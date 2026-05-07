'use client';

import { useState, useEffect, useCallback } from 'react';
import { ItemCategory } from '@repo/shared';

interface SearchBarProps {
  onSearch: (query: string, category?: ItemCategory, province?: string) => void;
}

type GeoStatus = 'idle' | 'loading' | 'success' | 'error' | 'denied';

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | undefined>();
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [provinces, setProvinces] = useState<string[]>([]);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle');
  const [detectedProvince, setDetectedProvince] = useState<string>('');

  // Fetch available provinces from API
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/items/provinces`)
      .then(res => res.json())
      .then((data: string[]) => setProvinces(data))
      .catch(() => setProvinces([]));
  }, []);

  // Trigger search whenever query, category, or province changes
  useEffect(() => {
    onSearch(query, selectedCategory, selectedProvince || undefined);
  }, [query, selectedCategory, selectedProvince]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, selectedCategory, selectedProvince || undefined);
  };

  const handleCategoryClick = (category?: ItemCategory) => {
    setSelectedCategory(category);
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProvince(e.target.value);
    if (detectedProvince && e.target.value !== detectedProvince) {
      setDetectedProvince('');
    }
  };

  const clearLocation = () => {
    setSelectedProvince('');
    setDetectedProvince('');
    setGeoStatus('idle');
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
          // Use Nominatim (OpenStreetMap) for free reverse geocoding - no API key needed
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=th`,
            { headers: { 'User-Agent': 'SmartRentShare/1.0' } }
          );
          const data = await res.json();

          // Nominatim returns Thai province in address.state or address.province
          const province =
            data.address?.state ||
            data.address?.province ||
            data.address?.county ||
            '';

          if (province) {
            // Strip "จังหวัด" prefix if present (Nominatim sometimes includes it)
            const cleanProvince = province.replace(/^จังหวัด/, '').trim();

            // Try to match against our available provinces (case-insensitive partial match)
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

  const geoButtonContent = () => {
    switch (geoStatus) {
      case 'loading':
        return (
          <span className="flex items-center gap-1 text-blue-600">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="hidden sm:inline text-xs">กำลังค้นหา...</span>
          </span>
        );
      case 'denied':
        return <span className="text-red-500 text-xs">🚫 ไม่อนุญาต GPS</span>;
      case 'error':
        return <span className="text-orange-500 text-xs">⚠️ ไม่พบตำแหน่ง</span>;
      default:
        return (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="hidden sm:inline text-xs font-medium">ใกล้ฉัน</span>
          </>
        );
    }
  };

  return (
    <div className="space-y-3">
      {/* Search + Location Row */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        {/* Text Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="ค้นหาสินค้า เช่น โน้ตบุ๊ค, กระเป๋า..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          />
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Province Dropdown */}
        <div className="relative">
          <select
            value={selectedProvince}
            onChange={handleProvinceChange}
            className="h-full px-3 py-3 pr-8 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-white appearance-none cursor-pointer min-w-[130px] sm:min-w-[160px]"
          >
            <option value="">🗺️ ทุกจังหวัด</option>
            {provinces.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Near Me Button */}
        <button
          type="button"
          onClick={handleNearMe}
          disabled={geoStatus === 'loading'}
          title="ค้นหาสินค้าใกล้ตำแหน่งของฉัน"
          className={`flex items-center gap-1.5 px-3 py-3 rounded-xl border transition-all whitespace-nowrap text-sm
            ${geoStatus === 'success'
              ? 'bg-green-50 border-green-300 text-green-700'
              : geoStatus === 'denied' || geoStatus === 'error'
                ? 'bg-red-50 border-red-200 text-red-600'
                : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
            } disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {geoButtonContent()}
        </button>
      </form>

      {/* Active Location Badge */}
      {(selectedProvince || detectedProvince) && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium rounded-full">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            {detectedProvince ? `📍 ใกล้ฉัน: ${selectedProvince}` : `จังหวัด: ${selectedProvince}`}
          </span>
          <button
            onClick={clearLocation}
            className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
          >
            ล้างตัวกรอง
          </button>
        </div>
      )}

      {/* GPS Error Messages */}
      {geoStatus === 'denied' && (
        <p className="text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
          ⚠️ กรุณาอนุญาตการเข้าถึงตำแหน่งในเบราว์เซอร์ แล้วลองใหม่อีกครั้ง
        </p>
      )}
      {geoStatus === 'error' && !detectedProvince && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          ❌ ไม่สามารถระบุตำแหน่งได้ กรุณาเลือกจังหวัดด้วยตนเอง
        </p>
      )}

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => handleCategoryClick(undefined)}
          className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            !selectedCategory
              ? 'bg-primary text-gray-900 shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ทั้งหมด
        </button>
        {Object.values(ItemCategory).map((category) => (
          <button
            key={category}
            onClick={() => handleCategoryClick(category)}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === category
                ? 'bg-primary text-gray-900 shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {categoryLabels[category] || category}
          </button>
        ))}
      </div>
    </div>
  );
}
