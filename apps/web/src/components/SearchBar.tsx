'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ItemCategory, ItemCondition } from '@repo/shared';
import { useSearchSuggest } from '@/hooks/useSearchSuggest';

export interface SearchFilters {
  q?: string;
  category?: ItemCategory;
  province?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: ItemCondition;
}

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  initialFilters?: SearchFilters;
  autoSubmit?: boolean;
}

type GeoStatus = 'idle' | 'loading' | 'success' | 'error' | 'denied';

export function SearchBar({ onSearch, initialFilters, autoSubmit = false }: SearchBarProps) {
  const [query, setQuery] = useState(initialFilters?.q || '');
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | undefined>(initialFilters?.category);
  const [selectedProvince, setSelectedProvince] = useState<string>(initialFilters?.province || '');
  const [minPrice, setMinPrice] = useState<number | ''>(initialFilters?.minPrice || '');
  const [maxPrice, setMaxPrice] = useState<number | ''>(initialFilters?.maxPrice || '');
  const [condition, setCondition] = useState<ItemCondition | ''>(initialFilters?.condition || '');

  const [provinces, setProvinces] = useState<string[]>([]);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle');
  const [detectedProvince, setDetectedProvince] = useState<string>('');
  
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const suggestRef = useRef<HTMLDivElement>(null);
  const { suggestions, isLoading: isSuggestLoading } = useSearchSuggest(query);

  // Initial Sync from Props
  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.q !== undefined) setQuery(initialFilters.q);
      if (initialFilters.category !== undefined) setSelectedCategory(initialFilters.category);
      if (initialFilters.province !== undefined) setSelectedProvince(initialFilters.province);
      if (initialFilters.minPrice !== undefined) setMinPrice(initialFilters.minPrice);
      if (initialFilters.maxPrice !== undefined) setMaxPrice(initialFilters.maxPrice);
      if (initialFilters.condition !== undefined) setCondition(initialFilters.condition);
    }
  }, [initialFilters]);

  // Fetch available provinces from API
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/items/provinces`)
      .then(res => res.json())
      .then((data: string[]) => setProvinces(data))
      .catch(() => setProvinces([]));
  }, []);

  // Handle outside click for suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestRef.current && !suggestRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getFilters = (): SearchFilters => ({
    q: query || undefined,
    category: selectedCategory,
    province: selectedProvince || undefined,
    minPrice: minPrice !== '' ? Number(minPrice) : undefined,
    maxPrice: maxPrice !== '' ? Number(maxPrice) : undefined,
    condition: condition !== '' ? (condition as ItemCondition) : undefined,
  });

  // Auto-submit feature for dynamic searching (e.g. on Search Page)
  useEffect(() => {
    if (autoSubmit) {
      // Small debounce to prevent too many requests when typing fast
      const timer = setTimeout(() => {
        onSearch(getFilters());
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [query, selectedCategory, selectedProvince, minPrice, maxPrice, condition, autoSubmit]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setShowSuggestions(false);
    onSearch(getFilters());
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    if (!autoSubmit) {
      // Force submit if not auto submitting
      onSearch({ ...getFilters(), q: suggestion });
    }
  };

  const handleNearMe = useCallback(async () => {
    if (!navigator.geolocation) {
      setGeoStatus('error');
      return;
    }

    setGeoStatus('loading');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=th`,
            { headers: { 'User-Agent': 'SmartRentShare/1.0' } }
          );
          const data = await res.json();
          const province = data.address?.state || data.address?.province || data.address?.county || '';

          if (province) {
            const cleanProvince = province.replace(/^จังหวัด/, '').trim();
            const matched = provinces.find(p =>
              p.toLowerCase().includes(cleanProvince.toLowerCase()) ||
              cleanProvince.toLowerCase().includes(p.toLowerCase())
            );

            const finalProvince = matched || cleanProvince;
            setSelectedProvince(finalProvince);
            setDetectedProvince(finalProvince);
            setGeoStatus('success');
          } else {
            setGeoStatus('error');
          }
        } catch {
          setGeoStatus('error');
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGeoStatus('denied');
        } else {
          setGeoStatus('error');
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, [provinces]);

  const clearLocation = () => {
    setSelectedProvince('');
    setDetectedProvince('');
    setGeoStatus('idle');
  };

  const categoryLabels: Record<ItemCategory, string> = {
    [ItemCategory.ELECTRONICS]: '💻 ไอที',
    [ItemCategory.BOOKS]: '📚 หนังสือ',
    [ItemCategory.FURNITURE]: '🪑 เฟอร์นิเจอร์',
    [ItemCategory.KITCHEN]: '🍳 ของใช้ครัว',
    [ItemCategory.SPORTS]: '⚽ กีฬา',
    [ItemCategory.TOOLS]: '🔧 เครื่องมือ',
    [ItemCategory.CLOTHING]: '👕 เสื้อผ้า',
    [ItemCategory.OTHER]: '📦 อื่นๆ',
  };

  const conditionLabels: Record<ItemCondition, string> = {
    [ItemCondition.NEW]: '✨ ใหม่',
    [ItemCondition.LIKE_NEW]: '👍 สภาพเหมือนใหม่',
    [ItemCondition.GOOD]: '👌 สภาพดี',
    [ItemCondition.FAIR]: 'พอใช้',
  };

  return (
    <div className="space-y-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
      {/* Search Input Row */}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        {/* Main Text Search with Autocomplete */}
        <div className="relative flex-1" ref={suggestRef}>
          <input
            type="text"
            placeholder="ค้นหาสินค้า เช่น โน้ตบุ๊ค, กล้อง..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="w-full px-4 py-3.5 pl-11 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm bg-gray-50"
          />
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>

          {/* Autocomplete Dropdown */}
          {showSuggestions && (query.trim().length >= 2) && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
              {isSuggestLoading ? (
                <div className="px-4 py-3 text-sm text-gray-500">กำลังค้นหา...</div>
              ) : suggestions.length > 0 ? (
                <ul>
                  {suggestions.map((suggestion, index) => (
                    <li key={index}>
                      <button
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-2 border-b border-gray-50 last:border-0"
                      >
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        {suggestion}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500">ไม่พบคำแนะนำ</div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3.5 rounded-xl border text-sm font-medium transition-colors ${
              showFilters || minPrice !== '' || maxPrice !== '' || condition !== ''
                ? 'bg-primary text-white border-primary' 
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            ตัวกรอง
          </button>
          
          <button
            type="submit"
            className="flex-1 sm:flex-none px-6 py-3.5 bg-gray-900 hover:bg-black text-white text-sm font-medium rounded-xl transition-colors"
          >
            ค้นหาเลย
          </button>
        </div>
      </form>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="pt-3 pb-1 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Price Range */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">ช่วงราคา (บาท/วัน)</label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                placeholder="ต่ำสุด" 
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary outline-none"
              />
              <span className="text-gray-400">-</span>
              <input 
                type="number" 
                placeholder="สูงสุด" 
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          {/* Condition */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">สภาพสินค้า</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as ItemCondition | '')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary outline-none appearance-none"
            >
              <option value="">ทั้งหมด</option>
              {Object.entries(conditionLabels).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          {/* Province (Moved to advanced filters) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">พื้นที่ / จังหวัด</label>
            <div className="flex gap-2">
              <select
                value={selectedProvince}
                onChange={(e) => {
                  setSelectedProvince(e.target.value);
                  if (detectedProvince && e.target.value !== detectedProvince) setDetectedProvince('');
                }}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary outline-none appearance-none"
              >
                <option value="">🗺️ ทุกจังหวัด</option>
                {provinces.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleNearMe}
                disabled={geoStatus === 'loading'}
                title="ค้นหาสินค้าใกล้ฉัน"
                className={`px-3 py-2 rounded-lg border text-sm flex items-center justify-center transition-colors
                  ${geoStatus === 'success' ? 'bg-green-50 border-green-200 text-green-700' 
                  : geoStatus === 'error' ? 'bg-red-50 border-red-200 text-red-600'
                  : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'}`}
              >
                {geoStatus === 'loading' ? '⏳' : '📍 ใกล้ฉัน'}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide pt-2">
        <button
          type="button"
          onClick={() => { 
            setSelectedCategory(undefined); 
            onSearch({...getFilters(), category: undefined}); 
          }}
          className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            !selectedCategory
              ? 'bg-gray-900 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ทั้งหมด
        </button>
        {Object.values(ItemCategory).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => { 
              setSelectedCategory(cat); 
              onSearch({...getFilters(), category: cat}); 
            }}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {categoryLabels[cat] || cat}
          </button>
        ))}
      </div>
    </div>
  );
}
