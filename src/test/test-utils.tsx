import React from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';
import type { Experiment, LogEntry, Profile, ExperimentProgress } from '@/lib/types';

// Default mock data
export const mockProfile: Profile = {
  id: 'user-1',
  onboarded_at: '2026-01-01T00:00:00Z',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

export const mockExperiment: Experiment = {
  id: 'exp-1',
  user_id: 'user-1',
  title: 'Test Experiment',
  hypothesis: 'Test hypothesis',
  protocol: 'Test protocol',
  metrics: [
    { id: 'state', name: 'State', description: 'General well-being', scale: [1, 7] as [number, number] },
    { id: 'focus', name: 'Focus', description: 'Mental clarity', scale: [1, 7] as [number, number] },
  ],
  duration_days: 7,
  start_date: '2026-01-10',
  end_date: '2026-01-16',
  status: 'active',
  conclusion: null,
  created_at: '2026-01-10T00:00:00Z',
  updated_at: '2026-01-10T00:00:00Z',
};

export const mockProgress: ExperimentProgress = {
  currentDay: 1,
  daysCompleted: 0,
  daysRemaining: 7,
  progress: 0,
};

export const createMockLogEntry = (overrides: Partial<LogEntry> = {}): LogEntry => ({
  id: 'log-1',
  user_id: 'user-1',
  experiment_id: 'exp-1',
  entry_type: 'after_sit',
  entry_date: '2026-01-10',
  ratings: { state: 5, focus: 6 },
  notes: null,
  sit_duration_minutes: null,
  technique_notes: null,
  created_at: '2026-01-10T10:00:00Z',
  ...overrides,
});

// Default mock context values
export interface MockDataContextValue {
  profile: Profile | null;
  activeExperiment: Experiment | null;
  experiments: Experiment[];
  recentLogs: LogEntry[];
  todayLogs: LogEntry[];
  loading: boolean;
  error: string | null;
  isFirstTime: boolean;
  hasActiveExperiment: boolean;
  experimentProgress: ExperimentProgress | null;
  markOnboarded: () => Promise<void>;
  createExperiment: () => Promise<Experiment>;
  completeExperiment: () => Promise<void>;
  abandonExperiment: () => Promise<void>;
  createLogEntry: () => Promise<LogEntry>;
  refresh: () => Promise<void>;
}

export const createMockDataContext = (
  overrides: Partial<MockDataContextValue> = {}
): MockDataContextValue => ({
  profile: mockProfile,
  activeExperiment: mockExperiment,
  experiments: [mockExperiment],
  recentLogs: [],
  todayLogs: [],
  loading: false,
  error: null,
  isFirstTime: false,
  hasActiveExperiment: true,
  experimentProgress: mockProgress,
  markOnboarded: vi.fn().mockResolvedValue(undefined),
  createExperiment: vi.fn().mockResolvedValue(mockExperiment),
  completeExperiment: vi.fn().mockResolvedValue(undefined),
  abandonExperiment: vi.fn().mockResolvedValue(undefined),
  createLogEntry: vi.fn().mockResolvedValue(createMockLogEntry()),
  refresh: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

// Mock useData hook
export const mockUseData = vi.fn<[], MockDataContextValue>(() => createMockDataContext());

// Reset mocks
export const resetMocks = () => {
  mockUseData.mockReset();
  mockUseData.mockReturnValue(createMockDataContext());
};

// Custom render with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  dataContext?: Partial<MockDataContextValue>;
}

export function render(
  ui: React.ReactElement,
  { dataContext, ...options }: CustomRenderOptions = {}
) {
  if (dataContext) {
    mockUseData.mockReturnValue(createMockDataContext(dataContext));
  }
  return rtlRender(ui, options);
}

export * from '@testing-library/react';
