/**
 * reindex-opensearch.ts
 *
 * Standalone script to bulk-index all items from MongoDB into OpenSearch.
 * Run with: npm run search:reindex
 *
 * ไม่ต้องการ JWT token — รันตรงจาก command line
 */
import { MongoClient, ObjectId } from 'mongodb';
import { Client } from '@opensearch-project/opensearch';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smart-rent-share';
const OPENSEARCH_NODE = process.env.OPENSEARCH_NODE || 'http://localhost:9200';
const OPENSEARCH_USERNAME = process.env.OPENSEARCH_USERNAME || '';
const OPENSEARCH_PASSWORD = process.env.OPENSEARCH_PASSWORD || '';
const INDEX_NAME = process.env.OPENSEARCH_INDEX_ITEMS || 'items';

// ── OpenSearch client ─────────────────────────────────────────────────────────
const clientOptions: any = { node: OPENSEARCH_NODE };
if (OPENSEARCH_USERNAME && OPENSEARCH_PASSWORD) {
    clientOptions.auth = { username: OPENSEARCH_USERNAME, password: OPENSEARCH_PASSWORD };
}
const osClient = new Client(clientOptions);

// ── Helper: convert MongoDB document → OpenSearch document ────────────────────
function toDoc(item: any, owner: any) {
    return {
        // NOTE: Do NOT include _id here — it's a metadata field passed via bulk action header
        title: item.title ?? '',
        description: item.description ?? '',
        category: item.category ?? '',
        tags: item.tags ?? [],
        condition: item.condition ?? '',
        dailyPrice: item.dailyPrice ?? 0,
        weeklyPrice: item.weeklyPrice,
        monthlyPrice: item.monthlyPrice,
        deposit: item.deposit ?? 0,
        images: item.images ?? [],
        isAvailable: item.isAvailable ?? true,
        province: item.location?.province ?? '',
        district: item.location?.district ?? '',
        area: item.location?.area ?? '',
        deliveryOptions: item.deliveryOptions ?? [],
        deliveryFee: item.deliveryFee,
        views: item.views ?? 0,
        favorites: item.favorites ?? 0,
        ownerId: owner?._id?.toString() ?? item.owner?.toString() ?? '',
        ownerName: owner?.displayName ?? '',
        ownerPicture: owner?.pictureUrl,
        createdAt: item.createdAt?.toISOString() ?? new Date().toISOString(),
        updatedAt: item.updatedAt?.toISOString() ?? new Date().toISOString(),
    };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function reindex() {
    console.log('🔍 SmartRentShare — OpenSearch Reindex Script');
    console.log(`📡 OpenSearch: ${OPENSEARCH_NODE}`);
    console.log(`🍃 MongoDB:    ${MONGO_URI.replace(/:\/\/[^@]+@/, '://***@')}\n`);

    // 1. Check OpenSearch health
    try {
        const health = await osClient.cluster.health({ timeout: '5s' });
        const status = (health.body as any).status;
        if (!['green', 'yellow'].includes(status)) {
            console.error(`❌ OpenSearch cluster status: ${status} — aborting`);
            process.exit(1);
        }
        console.log(`✅ OpenSearch cluster: ${status}`);
    } catch (err: any) {
        console.error(`❌ Cannot connect to OpenSearch at ${OPENSEARCH_NODE}: ${err.message}`);
        console.error('   Make sure Docker is running: docker-compose up opensearch -d');
        process.exit(1);
    }

    // 2. Delete + recreate index for clean reindex
    try {
        const exists = await osClient.indices.exists({ index: INDEX_NAME });
        if ((exists.body as any)) {
            await osClient.indices.delete({ index: INDEX_NAME });
            console.log(`🗑️  Deleted existing index "${INDEX_NAME}"`);
        }
    } catch { /* index may not exist */ }

    // Create index with Thai analyzer + mappings
    await osClient.indices.create({
        index: INDEX_NAME,
        body: {
            settings: {
                number_of_shards: 1,
                number_of_replicas: 0,
                analysis: {
                    analyzer: {
                        thai_analyzer: {
                            type: 'custom',
                            tokenizer: 'thai',
                            filter: ['lowercase'],
                        },
                    },
                },
            },
            mappings: {
                properties: {
                    title:           { type: 'text', analyzer: 'thai_analyzer', fields: { keyword: { type: 'keyword' } } },
                    description:     { type: 'text', analyzer: 'thai_analyzer' },
                    category:        { type: 'keyword' },
                    tags:            { type: 'keyword' },
                    condition:       { type: 'keyword' },
                    dailyPrice:      { type: 'float' },
                    weeklyPrice:     { type: 'float' },
                    monthlyPrice:    { type: 'float' },
                    deposit:         { type: 'float' },
                    images:          { type: 'keyword', index: false },
                    isAvailable:     { type: 'boolean' },
                    province:        { type: 'keyword' },
                    district:        { type: 'keyword' },
                    area:            { type: 'text' },
                    deliveryOptions: { type: 'keyword' },
                    deliveryFee:     { type: 'float' },
                    views:           { type: 'integer' },
                    favorites:       { type: 'integer' },
                    ownerId:         { type: 'keyword' },
                    ownerName:       { type: 'text', fields: { keyword: { type: 'keyword' } } },
                    ownerPicture:    { type: 'keyword', index: false },
                    createdAt:       { type: 'date' },
                    updatedAt:       { type: 'date' },
                },
            },
        },
    });
    console.log(`✅ Created index "${INDEX_NAME}" with Thai analyzer\n`);

    // 3. Connect to MongoDB and reindex
    const mongoClient = new MongoClient(MONGO_URI);
    try {
        await mongoClient.connect();
        console.log('✅ Connected to MongoDB');

        const db = mongoClient.db();
        const itemsCol = db.collection('items');
        const usersCol = db.collection('users');

        const total = await itemsCol.countDocuments();
        console.log(`📦 Total items in MongoDB: ${total}\n`);

        if (total === 0) {
            console.log('⚠️  No items found. Run: npm run seed  (to add sample data first)');
            return;
        }

        // Process in batches of 100
        const BATCH = 100;
        let skip = 0;
        let indexed = 0;
        let errors = 0;

        while (skip < total) {
            const items = await itemsCol.find({}).skip(skip).limit(BATCH).toArray();
            if (items.length === 0) break;

            // Collect unique owner IDs and fetch them
            const ownerIds = [...new Set(items.map(i => i.owner?.toString()).filter(Boolean))];
            const owners = await usersCol
                .find({ _id: { $in: ownerIds.map(id => { try { return new ObjectId(id); } catch { return null; } }).filter(Boolean) as any[] } })
                .toArray();
            const ownerMap = Object.fromEntries(owners.map(o => [o._id.toString(), o]));

            // Build bulk body
            const body = items.flatMap(item => {
                const owner = ownerMap[item.owner?.toString()] ?? null;
                return [
                    { index: { _index: INDEX_NAME, _id: item._id.toString() } },
                    toDoc(item, owner),
                ];
            });

            const resp = await osClient.bulk({ body, refresh: true });
            const respBody = resp.body as any;

            if (respBody.errors) {
                const errItems = respBody.items.filter((i: any) => i.index?.error);
                errors += errItems.length;
                indexed += items.length - errItems.length;
                errItems.forEach((i: any) =>
                    console.error(`  ❌ Error indexing ${i.index._id}: ${JSON.stringify(i.index.error)}`));
            } else {
                indexed += items.length;
            }

            skip += BATCH;
            const pct = Math.round((skip / total) * 100);
            process.stdout.write(`\r⏳ Progress: ${Math.min(skip, total)}/${total} (${pct}%)  `);
        }

        console.log(`\n\n🎉 Reindex complete!`);
        console.log(`   ✅ Indexed: ${indexed}`);
        if (errors > 0) console.log(`   ❌ Errors:  ${errors}`);
        console.log(`\n🔎 Test search:`);
        console.log(`   curl "http://localhost:3001/search/items?q=laptop"`);
        console.log(`   curl "http://localhost:3001/search/suggest?q=mac"`);

    } finally {
        await mongoClient.close();
        await osClient.close();
    }
}

reindex().catch(err => {
    console.error('\n❌ Reindex failed:', err.message);
    process.exit(1);
});
