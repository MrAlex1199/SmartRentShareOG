/**
 * search-api.ts
 * Helper functions for calling the OpenSearch-powered search endpoints
 * Falls back gracefully when the API is unavailable
 */

let API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    API_URL = API_URL.replace('http://', 'https://');
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SearchItemParams {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  province?: string;
  district?: string;
  condition?: string;
  /** relevance | price-asc | price-desc | newest | popular */
  sort?: string;
  page?: number;
  limit?: number;
}

export interface SearchItemResult {
  _id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  condition: string;
  dailyPrice: number;
  weeklyPrice?: number;
  monthlyPrice?: number;
  deposit: number;
  images: string[];
  isAvailable: boolean;
  province: string;
  district: string;
  area: string;
  deliveryOptions: string[];
  deliveryFee?: number;
  views: number;
  favorites: number;
  ownerId: string;
  ownerName: string;
  ownerPicture?: string;
  createdAt: string;
  updatedAt: string;
  /** OpenSearch relevance score */
  _score?: number;
  /** Highlighted snippets: { title: ['...'], description: ['...'] } */
  _highlight?: Record<string, string[]>;
}

export interface FacetBucket {
  key: string;
  count: number;
}

export interface SearchResponse {
  total: number;
  items: SearchItemResult[];
  aggregations?: {
    byCategory: FacetBucket[];
    priceStats: { min: number; max: number; avg: number };
    byProvince: FacetBucket[];
  };
}

// ─── Search Items ─────────────────────────────────────────────────────────────

/**
 * Search items using OpenSearch via GET /search/items
 * Returns full-text results with faceted aggregations
 */
export async function searchItems(params: SearchItemParams): Promise<SearchResponse> {
  const query = buildQueryString(params);

  const response = await fetch(`${API_URL}/search/items?${query}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }

  return response.json() as Promise<SearchResponse>;
}

// ─── Autocomplete Suggestions ─────────────────────────────────────────────────

/**
 * Fetch autocomplete suggestions for a given prefix
 * Returns up to 5 item title suggestions
 * Uses debouncing on the caller side (see useSearchSuggest hook)
 */
export async function fetchSuggestions(q: string): Promise<string[]> {
  if (!q || q.trim().length < 1) return [];

  try {
    const response = await fetch(
      `${API_URL}/search/suggest?q=${encodeURIComponent(q.trim())}`,
      { cache: 'no-store' },
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.suggestions ?? [];
  } catch {
    return [];
  }
}

// ─── Health Check ─────────────────────────────────────────────────────────────

export async function checkSearchHealth(): Promise<{
  opensearch: 'healthy' | 'unavailable';
  fallback: string;
}> {
  const response = await fetch(`${API_URL}/search/health`);
  return response.json();
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function buildQueryString(params: any): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params || {})) {
    if (value !== undefined && value !== null && value !== '') {
      qs.set(key, String(value));
    }
  }
  return qs.toString();
}
