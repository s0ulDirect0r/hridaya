'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useData } from '@/lib/data-context';
import { Auth } from '@/components/Auth';
import { VowFlow } from '@/components/VowFlow';
import { MissedDayInquiry } from '@/components/MissedDayInquiry';
import { Dashboard } from '@/components/Dashboard';
import { PracticeSession } from '@/components/PracticeSession';
import { Journal } from '@/components/Journal';

type View = 'dashboard' | 'practice' | 'journal';

export default function Home() {
  const [view, setView] = useState<View>('dashboard');
  const [selectedPracticeId, setSelectedPracticeId] = useState<string | null>(null);

  const { user, loading: authLoading } = useAuth();
  const { loading: dataLoading, isFirstTime, needsMissedDayInquiry } = useData();

  // Loading state
  if (authLoading || (user && dataLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-stone-400">...</div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Auth />;
  }

  // First time user - collect vow
  if (isFirstTime) {
    return <VowFlow />;
  }

  // Missed day - inquiry before practice
  if (needsMissedDayInquiry) {
    return <MissedDayInquiry />;
  }

  // Journal view
  if (view === 'journal') {
    return <Journal onBack={() => setView('dashboard')} />;
  }

  // Practice session
  if (view === 'practice' && selectedPracticeId) {
    return (
      <PracticeSession
        practiceId={selectedPracticeId}
        onComplete={() => {
          setSelectedPracticeId(null);
          setView('dashboard');
        }}
      />
    );
  }

  // Dashboard (default)
  return (
    <Dashboard
      onStartPractice={(practiceId) => {
        setSelectedPracticeId(practiceId);
        setView('practice');
      }}
      onViewJournal={() => setView('journal')}
    />
  );
}
