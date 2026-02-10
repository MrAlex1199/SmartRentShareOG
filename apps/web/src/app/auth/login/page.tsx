'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLib } from '@/lib/auth';
import Cookies from 'js-cookie';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        // Check if already logged in
        const existingToken = Cookies.get('token');
        if (existingToken) {
          console.log('Already have token, redirecting to home...');
          router.push('/');
          return;
        }

        console.log('Starting LIFF Init...');
        const liff = await AuthLib.initLiff();
        console.log('LIFF Init Result:', liff);
        
        if (!liff) {
          setError('LIFF initialization failed. Please try again.');
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
          await handleLineLogin();
        } else {
          if (hasOAuthCode) {
            console.error('❌ OAuth callback received but LIFF still has no access token');
            setError('Login verification failed. Please try again.');
          } else {
            console.log('ℹ️ LIFF not logged in, waiting for user to click login button');
          }
        }
      } catch (e) {
        console.error('Error during init:', e);
        setError('An error occurred. Please try again.');
      }
    };
    init();
  }, []);

  const handleLineLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      const user = await AuthLib.loginWithLine();
      
      if (user) {
        console.log('✅ Login successful, user:', user);
        
        // Check if cookie exists before redirect
        const tokenCheck = Cookies.get('token');
        console.log('🔍 Token check before redirect:', tokenCheck ? 'EXISTS' : 'MISSING');
        console.log('🍪 All cookies before redirect:', document.cookie);
        
        if (!tokenCheck) {
          setError('Cookie was not set properly. Please try again.');
          setLoading(false);
          return;
        }
        
        // Small delay to ensure cookie is set
        setTimeout(() => {
          console.log('🚀 Redirecting to home...');
          router.push('/');
        }, 200);
      } else {
        console.error('❌ Login failed - no user returned');
        setError('Login failed. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      setError('An error occurred during login.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-50">
      <div className="p-8 bg-white rounded-lg shadow-md w-96 text-center">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Smart Rent & Share</h1>
        <p className="mb-6 text-gray-600">Please sign in to continue</p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        
        <button
          onClick={handleLineLogin}
          disabled={loading}
          className="w-full px-6 py-3 font-semibold text-white bg-[#00B900] rounded-lg hover:bg-[#009900] transition-colors disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Log in with LINE'}
        </button>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">For testing without LINE app:</p>
          <p className="text-xs text-gray-400">
            Open this page in LINE Browser or use the button above to authenticate
          </p>
        </div>
      </div>
    </div>
  );
}
