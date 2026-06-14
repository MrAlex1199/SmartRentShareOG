'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Item, ItemCategory } from '@repo/shared';
import { Header } from '@/components/Layout/Header';
import { SearchBar } from '@/components/SearchBar';
import { ItemCard } from '@/components/ItemCard';
import { AuthLib } from '@/lib/auth';
import Cookies from 'js-cookie';

export default function Home() {
  const router = useRouter();
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Handle authentication on mount
  useEffect(() => {
    handleAuth();
  }, []);

  // Fetch items after auth is done
  useEffect(() => {
    if (!authChecking) {
      fetchItems();
    }
  }, [authChecking]);

  const handleAuth = async () => {
    try {
      const existingToken = Cookies.get('token');
      if (existingToken) {
        console.log('✅ Already authenticated');
        setAuthChecking(false);
        return;
      }

      console.log('Starting LIFF Init...');
      const liff = await AuthLib.initLiff();
      
      if (!liff) {
        console.error('LIFF initialization failed');
        setAuthChecking(false);
        return;
      }

      // Check if we just came back from LINE OAuth
      const currentUrl = window.location.href;
      const hasOAuthCode = currentUrl.includes('code=') || currentUrl.includes('state=');
      
      console.log('🔍 Current URL:', currentUrl);
      console.log('🔍 Has OAuth code:', hasOAuthCode);
      
      // Check if LIFF is logged in by checking for access token
      let accessToken = liff.getAccessToken();
      console.log('🔍 LIFF Access Token (initial):', accessToken ? 'EXISTS' : 'NOT FOUND');
      
      // If we have OAuth code but no access token, wait for LIFF to process
      if (hasOAuthCode && !accessToken) {
        console.log('⏳ OAuth callback detected, waiting for LIFF to process...');
        
        // Retry up to 3 times with 1 second delay
        for (let i = 0; i < 3; i++) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          accessToken = liff.getAccessToken();
          console.log(`🔍 LIFF Access Token (retry ${i + 1}):`, accessToken ? 'EXISTS' : 'NOT FOUND');
          
          if (accessToken) {
            console.log('✅ Access token obtained after retry');
            break;
          }
        }
      }
      
      if (accessToken) {
        console.log('✅ LIFF is logged in, attempting backend login...');
        await performBackendLogin();
      } else {
        console.log('ℹ️ LIFF not logged in');
        setAuthChecking(false);
      }
    } catch (e) {
      console.error('Error during auth:', e);
      setAuthChecking(false);
    }
  };

  const performBackendLogin = async () => {
    try {
      const user = await AuthLib.loginWithLine();
      
      if (user) {
        console.log('✅ Backend login successful');
        
        // Clean up URL by removing OAuth parameters
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        setAuthChecking(false);
      } else {
        console.error('❌ Backend login failed');
        setAuthChecking(false);
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      setAuthChecking(false);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/items`);
      if (response.ok) {
        const data = await response.json();
        setFilteredItems(data);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (filters: any) => {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.category) params.set('category', filters.category);
    if (filters.province) params.set('province', filters.province);
    if (filters.minPrice) params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString());
    if (filters.condition) params.set('condition', filters.condition);

    router.push(`/search?${params.toString()}`);
  };

  // Show loading spinner during auth check
  if (authChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังตรวจสอบการเข้าสู่ระบบ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ค้นหาสินค้าให้เช่า
          </h1>
          <p className="text-gray-600 mb-6">
            เช่า-ให้เช่าของใช้ระหว่างนักศึกษา ง่าย สะดวก ปลอดภัย
          </p>
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">กำลังโหลด...</p>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xl text-gray-500 mb-2">ไม่พบสินค้า</p>
            <p className="text-sm text-gray-400">ลองค้นหาด้วยคำอื่น หรือเป็นคนแรกที่ลงประกาศ!</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                พบ <span className="font-semibold text-gray-900">{filteredItems.length}</span> รายการ
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <ItemCard key={item._id} item={item} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
