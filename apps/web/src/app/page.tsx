'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Forward the query parameters to the login page so LIFF can pick them up
    // Using window.location to ensure we capture everything before Next.js hydration might interfere
    const target = '/auth/login' + window.location.search;
    console.log('Redirecting to:', target);
    router.replace(target);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Redirecting...</p>
    </div>
  );
}
