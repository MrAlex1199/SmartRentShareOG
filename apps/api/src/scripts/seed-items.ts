import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smart-rent-share';

const mockItems = [
    {
        title: 'MacBook Pro M2 14" 2023',
        description: 'MacBook Pro M2 chip, 16GB RAM, 512GB SSD สภาพใหม่มาก ใช้งานเพียง 3 เดือน เหมาะสำหรับนักศึกษาที่ต้องการทำงานหนัก ตัดต่อวิดีโอ เขียนโค้ด',
        category: 'electronics',
        tags: ['laptop', 'macbook', 'apple', 'programming', 'video-editing'],
        dailyPrice: 500,
        weeklyPrice: 3000,
        monthlyPrice: 10000,
        deposit: 5000,
        images: [
            'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
            'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800',
        ],
        isAvailable: true,
        location: {
            university: 'มหาวิทยาลัยเกษตรศาสตร์',
            building: 'หอพักนักศึกษา A',
            area: 'บางเขน',
        },
        deliveryOptions: ['pickup', 'delivery'],
        deliveryFee: 100,
        condition: 'like-new',
    },
    {
        title: 'กล้อง Canon EOS R6 Mark II + เลนส์ 24-70mm',
        description: 'กล้อง Mirrorless Full Frame ตัวท็อป พร้อมเลนส์ซูม 24-70mm f/2.8 เหมาะสำหรับถ่ายภาพงานอีเวนท์ ถ่ายวิดีโอ มีอุปกรณ์ครบชุด แบตเตอรี่ 3 ก้อน',
        category: 'electronics',
        tags: ['camera', 'canon', 'photography', 'video', 'full-frame'],
        dailyPrice: 800,
        weeklyPrice: 5000,
        monthlyPrice: 15000,
        deposit: 10000,
        images: [
            'https://images.unsplash.com/photo-1606980707986-b7d27e90eb97?w=800',
            'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800',
        ],
        isAvailable: true,
        location: {
            university: 'จุฬาลงกรณ์มหาวิทยาลัย',
            building: 'หอพักศรีวิชัย',
            area: 'ปทุมวัน',
        },
        deliveryOptions: ['pickup'],
        condition: 'good',
    },
    {
        title: 'iPad Pro 12.9" M2 + Apple Pencil 2',
        description: 'iPad Pro รุ่นใหม่ล่าสุด พร้อม Apple Pencil Gen 2 และ Magic Keyboard เหมาะสำหรับนักศึกษาสถาปัตย์ ดิจิทัลอาร์ต จดโน้ต',
        category: 'electronics',
        tags: ['ipad', 'tablet', 'apple', 'drawing', 'note-taking'],
        dailyPrice: 400,
        weeklyPrice: 2500,
        monthlyPrice: 8000,
        deposit: 8000,
        images: [
            'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800',
            'https://images.unsplash.com/photo-1585790050230-5dd28404f905?w=800',
        ],
        isAvailable: true,
        location: {
            university: 'มหาวิทยาลัยธรรมศาสตร์',
            building: 'หอพักรังสิต',
            area: 'รังสิต',
        },
        deliveryOptions: ['pickup', 'delivery'],
        deliveryFee: 80,
        condition: 'like-new',
    },
    {
        title: 'โซฟา 3 ที่นั่ง สไตล์โมเดิร์น สีเทา',
        description: 'โซฟา 3 ที่นั่ง ผ้านุ่ม สีเทาเข้ากับทุกห้อง สภาพดีมาก เหมาะสำหรับนักศึกษาที่เช่าคอนโด หรือบ้านเช่า ขนาด 200x90x80 cm',
        category: 'furniture',
        tags: ['sofa', 'furniture', 'living-room', 'modern'],
        dailyPrice: 150,
        weeklyPrice: 900,
        monthlyPrice: 2500,
        deposit: 2000,
        images: [
            'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
            'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
        ],
        isAvailable: true,
        location: {
            university: 'มหาวิทยาลัยมหิดล',
            building: 'คอนโดใกล้มหิดล',
            area: 'ศาลายา',
        },
        deliveryOptions: ['delivery'],
        deliveryFee: 300,
        condition: 'good',
    },
    {
        title: 'ชุดหนังสือ Harry Potter ฉบับภาษาอังกฤษ (ครบ 7 เล่ม)',
        description: 'Harry Potter ฉบับภาษาอังกฤษ ครบทุกภาค สภาพดีมาก ปกแข็ง เหมาะสำหรับฝึกอ่านภาษาอังกฤษ หรือสะสม',
        category: 'books',
        tags: ['books', 'harry-potter', 'english', 'novel', 'collection'],
        dailyPrice: 50,
        weeklyPrice: 300,
        monthlyPrice: 800,
        deposit: 1500,
        images: [
            'https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=800',
            'https://images.unsplash.com/photo-1589998059171-988d887df646?w=800',
        ],
        isAvailable: true,
        location: {
            university: 'มหาวิทยาลัยเกษตรศาสตร์',
            building: 'หอพักนักศึกษา C',
            area: 'บางเขน',
        },
        deliveryOptions: ['pickup', 'delivery'],
        deliveryFee: 50,
        condition: 'good',
    },
    {
        title: 'เครื่องชงกาแฟ Breville Barista Express',
        description: 'เครื่องชงกาแฟแบบมืออาชีพ มีเครื่องบดในตัว ทำกาแฟได้หลากหลายเมนู เอสเพรสโซ่ ลาเต้ คาปูชิโน่ เหมาะสำหรับคอกาแฟตัวจริง',
        category: 'kitchen',
        tags: ['coffee-maker', 'espresso', 'kitchen', 'barista'],
        dailyPrice: 200,
        weeklyPrice: 1200,
        monthlyPrice: 3500,
        deposit: 3000,
        images: [
            'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800',
            'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
        ],
        isAvailable: true,
        location: {
            university: 'จุฬาลงกรณ์มหาวิทยาลัย',
            building: 'หอพักอินเตอร์',
            area: 'ปทุมวัน',
        },
        deliveryOptions: ['pickup', 'delivery'],
        deliveryFee: 100,
        condition: 'like-new',
    },
    {
        title: 'จักรยานเสือภูเขา Trek Marlin 7',
        description: 'จักรยานเสือภูเขา Trek Marlin 7 ขนาดล้อ 29" เกียร์ Shimano Deore สภาพดีมาก บำรุงรักษาเป็นประจำ เหมาะสำหรับปั่นออกกำลังกาย',
        category: 'sports',
        tags: ['bicycle', 'mountain-bike', 'trek', 'sports', 'exercise'],
        dailyPrice: 150,
        weeklyPrice: 900,
        monthlyPrice: 2500,
        deposit: 5000,
        images: [
            'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800',
            'https://images.unsplash.com/photo-1571333250630-f0230c320b6d?w=800',
        ],
        isAvailable: true,
        location: {
            university: 'มหาวิทยาลัยธรรมศาสตร์',
            building: 'หอพักท่าพระจันทร์',
            area: 'ท่าพระจันทร์',
        },
        deliveryOptions: ['pickup'],
        condition: 'good',
    },
    {
        title: 'ชุดเครื่องมือช่าง 108 ชิ้น',
        description: 'ชุดเครื่องมือช่างครบครัน 108 ชิ้น มีทั้งไขควง คีม ประแจ ค้อน เหมาะสำหรับซ่อมแซมของในบ้าน ประกอบเฟอร์นิเจอร์',
        category: 'tools',
        tags: ['tools', 'toolbox', 'repair', 'diy'],
        dailyPrice: 80,
        weeklyPrice: 500,
        monthlyPrice: 1500,
        deposit: 1000,
        images: [
            'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800',
            'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800',
        ],
        isAvailable: true,
        location: {
            university: 'มหาวิทยาลัยเกษตรศาสตร์',
            building: 'หอพักวิศวกรรม',
            area: 'บางเขน',
        },
        deliveryOptions: ['pickup', 'delivery'],
        deliveryFee: 60,
        condition: 'good',
    },
    {
        title: 'PlayStation 5 + 2 จอย + 5 เกมส์',
        description: 'PS5 สภาพดีมาก พร้อม DualSense Controller 2 ตัว และเกมส์ดัง 5 แผ่น (Spider-Man, God of War, Horizon, FIFA, GT7) เหมาะสำหรับเล่นกับเพื่อนๆ',
        category: 'electronics',
        tags: ['playstation', 'ps5', 'gaming', 'console', 'entertainment'],
        dailyPrice: 300,
        weeklyPrice: 1800,
        monthlyPrice: 5000,
        deposit: 8000,
        images: [
            'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800',
            'https://images.unsplash.com/photo-1622297845775-5ff3fef71d13?w=800',
        ],
        isAvailable: true,
        location: {
            university: 'มหาวิทยาลัยมหิดล',
            building: 'หอพักศาลายา',
            area: 'ศาลายา',
        },
        deliveryOptions: ['pickup', 'delivery'],
        deliveryFee: 120,
        condition: 'like-new',
    },
    {
        title: 'โต๊ะทำงาน + เก้าอี้เกมมิ่ง',
        description: 'โต๊ะทำงานขนาด 120x60 cm พร้อมเก้าอี้เกมมิ่ง ปรับระดับได้ มีพนักพิงหลัง สภาพดีมาก เหมาะสำหรับทำงาน เรียนออนไลน์ เล่นเกม',
        category: 'furniture',
        tags: ['desk', 'chair', 'gaming', 'workspace', 'furniture'],
        dailyPrice: 100,
        weeklyPrice: 600,
        monthlyPrice: 1800,
        deposit: 1500,
        images: [
            'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800',
            'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=800',
        ],
        isAvailable: true,
        location: {
            university: 'จุฬาลงกรณ์มหาวิทยาลัย',
            building: 'หอพักจามจุรี',
            area: 'ปทุมวัน',
        },
        deliveryOptions: ['delivery'],
        deliveryFee: 250,
        condition: 'good',
    },
];

async function seedItems() {
    const client = new MongoClient(MONGO_URI);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');

        const db = client.db();
        const itemsCollection = db.collection('items');
        const usersCollection = db.collection('users');

        // Get a user to be the owner (or create a mock user)
        let owner = await usersCollection.findOne({});

        if (!owner) {
            console.log('⚠️  No users found, creating a mock user...');
            const mockUser = {
                lineId: 'mock_line_id_123',
                displayName: 'Mock User',
                pictureUrl: 'https://via.placeholder.com/150',
                email: 'mock@example.com',
                role: 'student',
                isVerified: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const result = await usersCollection.insertOne(mockUser);
            owner = { _id: result.insertedId, ...mockUser };
        }

        console.log(`📝 Using owner: ${owner.displayName}`);

        // Clear existing items (optional)
        const deleteResult = await itemsCollection.deleteMany({});
        console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing items`);

        // Insert mock items
        const itemsToInsert = mockItems.map(item => ({
            ...item,
            owner: owner._id,
            views: Math.floor(Math.random() * 500),
            favorites: Math.floor(Math.random() * 50),
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
            updatedAt: new Date(),
        }));

        const insertResult = await itemsCollection.insertMany(itemsToInsert);
        console.log(`✅ Inserted ${insertResult.insertedCount} items`);

        // Display summary
        console.log('\n📊 Summary:');
        console.log(`   Total items: ${insertResult.insertedCount}`);
        console.log(`   Owner: ${owner.displayName}`);
        console.log('\n🎉 Seed completed successfully!');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        await client.close();
        console.log('👋 Disconnected from MongoDB');
    }
}

// Run the seed function
seedItems();
