'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './auth';
import {
  Profile,
  JournalEntry,
  fetchProfile,
  fetchJournal,
  setVow as setVowApi,
  recordSession as recordSessionApi,
  recordMissedDay as recordMissedDayApi,
  passReadinessGate as passReadinessGateApi,
  needsMissedDayInquiry,
  getStage,
  getSessions,
} from './data';
import type { Brahmavihara, PracticeObject } from './types';

interface DataContextType {
  profile: Profile | null;
  journal: JournalEntry[];
  loading: boolean;
  error: string | null;

  // Computed
  isFirstTime: boolean;
  needsMissedDayInquiry: boolean;
  sessions: ReturnType<typeof getSessions>;
  getStage: (brahmavihara: Brahmavihara) => PracticeObject;

  // Actions
  setVow: (vow: string) => Promise<void>;
  recordSession: (practiceId: string, reflection: string) => Promise<number>;
  recordMissedDay: (response: string) => Promise<void>;
  passReadinessGate: (brahmavihara: Brahmavihara, response: string) => Promise<PracticeObject>;
  refresh: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setJournal([]);
      setLoading(false);
      return;
    }

    try {
      const [profileData, journalData] = await Promise.all([
        fetchProfile(user.id),
        fetchJournal(user.id),
      ]);
      setProfile(profileData);
      setJournal(journalData);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setVow = async (vow: string) => {
    if (!user) throw new Error('Not authenticated');
    await setVowApi(user.id, vow);
    await refresh();
  };

  const recordSession = async (practiceId: string, reflection: string) => {
    if (!user || !profile) throw new Error('Not authenticated');
    const newStreak = await recordSessionApi(user.id, practiceId, reflection, profile);
    await refresh();
    return newStreak;
  };

  const recordMissedDay = async (response: string) => {
    if (!user) throw new Error('Not authenticated');
    await recordMissedDayApi(user.id, response);
    await refresh();
  };

  const passReadinessGate = async (brahmavihara: Brahmavihara, response: string) => {
    if (!user || !profile) throw new Error('Not authenticated');
    const currentStage = getStage(profile, brahmavihara);
    const nextStage = await passReadinessGateApi(user.id, brahmavihara, response, currentStage);
    await refresh();
    return nextStage;
  };

  const value: DataContextType = {
    profile,
    journal,
    loading,
    error,

    isFirstTime: profile?.vow === null,
    needsMissedDayInquiry: profile ? needsMissedDayInquiry(profile, journal) : false,
    sessions: getSessions(journal),
    getStage: (brahmavihara) => profile ? getStage(profile, brahmavihara) : 'self',

    setVow,
    recordSession,
    recordMissedDay,
    passReadinessGate,
    refresh,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
