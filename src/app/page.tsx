'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useData } from '@/lib/data-context';
import { Auth } from '@/components/Auth';
import { OnboardingFlow } from '@/components/OnboardingFlow';
import { Dashboard } from '@/components/Dashboard';
import { CreateExperiment } from '@/components/CreateExperiment';
import { LogForm } from '@/components/LogForm';
import { Journal } from '@/components/Journal';
import { Chat } from '@/components/Chat';

type View = 'dashboard' | 'create-experiment' | 'log' | 'journal' | 'chat';

export default function Home() {
  const [view, setView] = useState<View>('dashboard');

  const { user, loading: authLoading } = useAuth();
  const { loading: dataLoading, isFirstTime } = useData();

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

  // First time user - onboarding
  if (isFirstTime) {
    return <OnboardingFlow />;
  }

  // Create experiment view
  if (view === 'create-experiment') {
    return (
      <CreateExperiment
        onComplete={() => setView('dashboard')}
        onCancel={() => setView('dashboard')}
      />
    );
  }

  // Log entry view
  if (view === 'log') {
    return (
      <LogForm
        onComplete={() => setView('dashboard')}
        onCancel={() => setView('dashboard')}
      />
    );
  }

  // Journal view
  if (view === 'journal') {
    return <Journal onBack={() => setView('dashboard')} />;
  }

  // Chat view
  if (view === 'chat') {
    return <Chat onBack={() => setView('dashboard')} />;
  }

  // Dashboard (default)
  return (
    <Dashboard
      onNewExperiment={() => setView('create-experiment')}
      onLog={() => setView('log')}
      onViewJournal={() => setView('journal')}
      onChat={() => setView('chat')}
    />
  );
}
