'use client';

import { useState, useEffect } from 'react';
import { ItemCategory } from '@repo/shared';

interface SearchBarProps {
  onSearch: (query: string, category?: ItemCategory) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | undefined>();

  // Trigger search whenever query or category changes
  useEffect(() => {
    onSearch(query, selectedCategory);
  }, [query, selectedCategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, selectedCategory);
  };

  const handleCategoryClick = (category?: ItemCategory) => {
    setSelectedCategory(category);
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          placeholder="ค้นหาสินค้า..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-4 py-3 pl-12 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <svg 
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </form>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => handleCategoryClick(undefined)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            !selectedCategory 
              ? 'bg-primary text-gray-900' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          ทั้งหมด
        </button>
        {Object.values(ItemCategory).map((category) => (
          <button
            key={category}
            onClick={() => handleCategoryClick(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === category 
                ? 'bg-primary text-gray-900' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}
