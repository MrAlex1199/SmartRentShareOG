'use client';

import { useEffect, useState } from 'react';
import { AuthLib } from '@/lib/auth';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        console.log('Starting LIFF Init...');
        const liff = await AuthLib.initLiff();
        console.log('LIFF Init Result:', liff);
        
        if (!liff) {
          alert('LIFF Init Failed! Check console.');
          return;
        }

        if (liff.isLoggedIn()) {
          console.log('User is logged in (LIFF), attempting backend login...');
          // alert('LIFF Logged In! Logging into Backend...');
          await handleLineLogin();
        } else {
          console.log('LIFF Check: Not logged in');
        }
      } catch (e) {
        alert('Error during init: ' + e);
      }
    };
    init();
  }, []);

  const handleLineLogin = async () => {
    setLoading(true);
    await AuthLib.loginWithLine();
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-50">
      <div className="p-8 bg-white rounded-lg shadow-md w-96 text-center">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Smart Rent & Share</h1>
        <p className="mb-6 text-gray-600">Please sign in to continue</p>
        
        <button
          onClick={handleLineLogin}
          disabled={loading}
          className="w-full px-6 py-3 font-semibold text-white bg-[#00B900] rounded-lg hover:bg-[#009900] transition-colors disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Log in with LINE'}
        </button>
      </div>
    </div>
  );
}
