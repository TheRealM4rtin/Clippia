'use client'

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Whiteboard from '@/components/Whiteboard';
import Onboarding from '@/components/Onboarding';

function HomeContent() {
  const [isClient, setIsClient] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);

    // Check for error parameters
    const error = searchParams.get('error');
    const error_description = searchParams.get('error_description');

    if (error || error_description) {
      router.push(`/auth-error?error=${encodeURIComponent(error || '')}&description=${encodeURIComponent(error_description || '')}`);
    }
  }, [searchParams, router]);

  return (
    <main className="w-full h-full">
      {isClient && (
        <>
          <Whiteboard />
          {showOnboarding && (
            <Onboarding onComplete={() => setShowOnboarding(false)} />
          )}
        </>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="w-full h-full flex items-center justify-center">
        <div className="window">
          <div className="title-bar">
            <div className="title-bar-text">Loading...</div>
          </div>
          <div className="window-body">
            <p>Please wait...</p>
          </div>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
