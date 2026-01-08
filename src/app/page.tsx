'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { VowFlow } from '@/components/VowFlow';
import { MissedDayInquiry } from '@/components/MissedDayInquiry';
import { PracticeSession } from '@/components/PracticeSession';

export default function Home() {
  const [hydrated, setHydrated] = useState(false);
  const { isFirstTime, needsMissedDayInquiry } = useStore();

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Wait for client-side hydration before rendering
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-stone-400">...</div>
      </div>
    );
  }

  // First time user - collect vow
  if (isFirstTime()) {
    return <VowFlow />;
  }

  // Missed day - inquiry before practice
  if (needsMissedDayInquiry()) {
    return <MissedDayInquiry />;
  }

  // Regular practice session
  return <PracticeSession />;
}
