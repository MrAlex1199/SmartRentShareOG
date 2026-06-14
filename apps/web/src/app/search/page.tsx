'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Item, ItemCategory, ItemCondition } from '@repo/shared';
import { Header } from '@/components/Layout/Header';
import { SearchBar, SearchFilters } from '@/components/SearchBar';
import { ItemCard } from '@/components/ItemCard';
import { searchItems, SearchResponse } from '@/lib/search-api';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<SearchResponse | null>(null);

  // Parse URL to SearchFilters
  const getFiltersFromUrl = (): SearchFilters => {
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    
    return {
      q: searchParams.get('q') || undefined,
      category: (searchParams.get('category') as ItemCategory) || undefined,
      province: searchParams.get('province') || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      condition: (searchParams.get('condition') as ItemCondition) || undefined,
    };
  };

  const currentFilters = getFiltersFromUrl();

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const data = await searchItems(currentFilters);
        setResults(data);
      } catch (error) {
        console.error('Error fetching search results:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [searchParams]);

  // Handle search from SearchBar
  const handleSearch = (filters: SearchFilters) => {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.category) params.set('category', filters.category);
    if (filters.province) params.set('province', filters.province);
    if (filters.minPrice) params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString());
    if (filters.condition) params.set('condition', filters.condition);

    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Search Bar at the top */}
        <div className="mb-6">
          <SearchBar 
            onSearch={handleSearch} 
            initialFilters={currentFilters}
            autoSubmit={false} 
          />
        </div>

        {/* Results Area */}
        <div className="flex flex-col md:flex-row gap-6">
          
          {/* Main Content */}
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-500 text-sm">กำลังค้นหาข้อมูลด้วย OpenSearch...</p>
                </div>
              </div>
            ) : !results || results.items.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-1">ไม่พบสินค้าที่คุณค้นหา</h3>
                <p className="text-gray-500 text-sm mb-4">ลองปรับเปลี่ยนตัวกรอง หรือค้นหาด้วยคำอื่น</p>
                <button 
                  onClick={() => router.push('/search')}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              </div>
            ) : (
              <div>
                {/* Search Meta Info */}
                <div className="flex items-center justify-between mb-4 px-1">
                  <h2 className="text-gray-700 font-medium">
                    ผลการค้นหา {currentFilters.q && <span className="text-primary font-bold">"{currentFilters.q}"</span>}
                    <span className="text-gray-400 text-sm ml-2">({results.total} รายการ)</span>
                  </h2>
                </div>

                {/* Items Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {results.items.map((item: any) => (
                    <ItemCard key={item._id} item={item} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
