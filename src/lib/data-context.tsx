'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { useAuth } from './auth';
import {
  fetchProfile,
  markOnboarded as markOnboardedApi,
  fetchActiveExperiment,
  fetchExperiments,
  fetchRecentLogs,
  fetchTodayLogs,
  createExperiment as createExperimentApi,
  completeExperiment as completeExperimentApi,
  abandonExperiment as abandonExperimentApi,
  createLogEntry as createLogEntryApi,
  getExperimentProgress,
  getTodayDateString,
} from './data';
import type {
  Profile,
  Experiment,
  LogEntry,
  CreateExperimentInput,
  CreateLogEntryInput,
  ExperimentProgress,
} from './types';

interface DataContextType {
  // State
  profile: Profile | null;
  activeExperiment: Experiment | null;
  experiments: Experiment[];
  recentLogs: LogEntry[];
  todayLogs: LogEntry[];
  loading: boolean;
  error: string | null;

  // Computed
  isFirstTime: boolean;
  hasActiveExperiment: boolean;
  experimentProgress: ExperimentProgress | null;

  // Actions
  markOnboarded: () => Promise<void>;
  createExperiment: (input: CreateExperimentInput) => Promise<Experiment>;
  completeExperiment: (conclusion: string) => Promise<void>;
  abandonExperiment: () => Promise<void>;
  createLogEntry: (
    input: Omit<CreateLogEntryInput, 'experiment_id'>
  ) => Promise<LogEntry>;
  refresh: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeExperiment, setActiveExperiment] = useState<Experiment | null>(
    null
  );
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [todayLogs, setTodayLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setActiveExperiment(null);
      setExperiments([]);
      setRecentLogs([]);
      setTodayLogs([]);
      setLoading(false);
      return;
    }

    try {
      const [profileData, activeExp, allExperiments, logs] = await Promise.all([
        fetchProfile(user.id),
        fetchActiveExperiment(user.id),
        fetchExperiments(user.id),
        fetchRecentLogs(user.id, 50),
      ]);

      setProfile(profileData);
      setActiveExperiment(activeExp);
      setExperiments(allExperiments);
      setRecentLogs(logs);

      // Fetch today's logs if there's an active experiment
      if (activeExp) {
        const today = getTodayDateString();
        const todayData = await fetchTodayLogs(activeExp.id, today);
        setTodayLogs(todayData);
      } else {
        setTodayLogs([]);
      }

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

  const markOnboarded = async () => {
    if (!user) throw new Error('Not authenticated');
    await markOnboardedApi(user.id);
    await refresh();
  };

  const createExperiment = async (input: CreateExperimentInput) => {
    if (!user) throw new Error('Not authenticated');
    const experiment = await createExperimentApi(user.id, input);
    await refresh();
    return experiment;
  };

  const completeExperiment = async (conclusion: string) => {
    if (!activeExperiment) throw new Error('No active experiment');
    await completeExperimentApi(activeExperiment.id, conclusion);
    await refresh();
  };

  const abandonExperiment = async () => {
    if (!activeExperiment) throw new Error('No active experiment');
    await abandonExperimentApi(activeExperiment.id);
    await refresh();
  };

  const createLogEntry = async (
    input: Omit<CreateLogEntryInput, 'experiment_id'>
  ) => {
    if (!user) throw new Error('Not authenticated');
    if (!activeExperiment) throw new Error('No active experiment');
    const fullInput: CreateLogEntryInput = {
      ...input,
      experiment_id: activeExperiment.id,
    };
    const entry = await createLogEntryApi(user.id, fullInput);
    await refresh();
    return entry;
  };

  const value: DataContextType = {
    profile,
    activeExperiment,
    experiments,
    recentLogs,
    todayLogs,
    loading,
    error,

    isFirstTime: profile?.onboarded_at === null,
    hasActiveExperiment: activeExperiment !== null,
    experimentProgress: activeExperiment
      ? getExperimentProgress(activeExperiment)
      : null,

    markOnboarded,
    createExperiment,
    completeExperiment,
    abandonExperiment,
    createLogEntry,
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
