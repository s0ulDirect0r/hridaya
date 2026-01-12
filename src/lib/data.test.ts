import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock supabase before importing data.ts
vi.mock('./supabase', () => ({
  supabase: {},
}));

import {
  getExperimentProgress,
  getChartData,
  getTodayDateString,
} from './data';
import type { Experiment, LogEntry, MetricDefinition } from './types';

// Helper to create experiment fixtures
const createExperiment = (overrides: Partial<Experiment> = {}): Experiment => ({
  id: 'exp-1',
  user_id: 'user-1',
  title: 'Test Experiment',
  hypothesis: 'Testing hypothesis',
  protocol: 'Test protocol',
  metrics: [],
  duration_days: 7,
  start_date: '2026-01-10',
  end_date: '2026-01-16',
  status: 'active',
  conclusion: null,
  created_at: '2026-01-10T00:00:00Z',
  updated_at: '2026-01-10T00:00:00Z',
  ...overrides,
});

const createLogEntry = (overrides: Partial<LogEntry> = {}): LogEntry => ({
  id: 'log-1',
  user_id: 'user-1',
  experiment_id: 'exp-1',
  entry_type: 'after_sit',
  entry_date: '2026-01-10',
  ratings: {},
  notes: null,
  sit_duration_minutes: null,
  technique_notes: null,
  created_at: '2026-01-10T10:00:00Z',
  ...overrides,
});

describe('getExperimentProgress', () => {
  beforeEach(() => {
    // Mock Date to control "today"
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns day 1 on the start date', () => {
    vi.setSystemTime(new Date('2026-01-10T12:00:00'));
    const experiment = createExperiment({ start_date: '2026-01-10', duration_days: 7 });

    const progress = getExperimentProgress(experiment);

    expect(progress.currentDay).toBe(1);
    expect(progress.daysCompleted).toBe(0);
    expect(progress.daysRemaining).toBe(7);
    expect(progress.progress).toBe(0);
  });

  it('returns day 2 on the second day', () => {
    vi.setSystemTime(new Date('2026-01-11T12:00:00'));
    const experiment = createExperiment({ start_date: '2026-01-10', duration_days: 7 });

    const progress = getExperimentProgress(experiment);

    expect(progress.currentDay).toBe(2);
    expect(progress.daysCompleted).toBe(1);
    expect(progress.daysRemaining).toBe(6);
    expect(progress.progress).toBeCloseTo(1 / 7);
  });

  it('returns final day on the last day', () => {
    vi.setSystemTime(new Date('2026-01-16T12:00:00'));
    const experiment = createExperiment({ start_date: '2026-01-10', duration_days: 7 });

    const progress = getExperimentProgress(experiment);

    expect(progress.currentDay).toBe(7);
    expect(progress.daysCompleted).toBe(6);
    expect(progress.daysRemaining).toBe(1);
  });

  it('caps at max days after experiment ends', () => {
    vi.setSystemTime(new Date('2026-01-20T12:00:00')); // 10 days after start
    const experiment = createExperiment({ start_date: '2026-01-10', duration_days: 7 });

    const progress = getExperimentProgress(experiment);

    expect(progress.currentDay).toBe(7); // Capped at duration
    expect(progress.daysCompleted).toBe(7);
    expect(progress.daysRemaining).toBe(0);
    expect(progress.progress).toBe(1);
  });

  it('returns day 1 before start date', () => {
    vi.setSystemTime(new Date('2026-01-08T12:00:00')); // Before start
    const experiment = createExperiment({ start_date: '2026-01-10', duration_days: 7 });

    const progress = getExperimentProgress(experiment);

    expect(progress.currentDay).toBe(1); // Min is day 1
    expect(progress.daysCompleted).toBe(0);
    expect(progress.daysRemaining).toBe(7);
    expect(progress.progress).toBe(0);
  });

  it('handles single-day experiments', () => {
    vi.setSystemTime(new Date('2026-01-10T12:00:00'));
    const experiment = createExperiment({ start_date: '2026-01-10', duration_days: 1 });

    const progress = getExperimentProgress(experiment);

    expect(progress.currentDay).toBe(1);
    expect(progress.daysCompleted).toBe(0);
    expect(progress.daysRemaining).toBe(1);
  });

  it('handles long experiments', () => {
    vi.setSystemTime(new Date('2026-01-25T12:00:00')); // Day 16
    const experiment = createExperiment({ start_date: '2026-01-10', duration_days: 30 });

    const progress = getExperimentProgress(experiment);

    expect(progress.currentDay).toBe(16);
    expect(progress.daysCompleted).toBe(15);
    expect(progress.daysRemaining).toBe(15);
  });
});

describe('getChartData', () => {
  const testMetrics: MetricDefinition[] = [
    { id: 'state', name: 'State', scale: [1, 7] },
    { id: 'focus', name: 'Focus', scale: [1, 7] },
  ];

  it('returns empty array for no logs', () => {
    const result = getChartData([], testMetrics);
    expect(result).toEqual([]);
  });

  it('transforms single log to chart data point', () => {
    const logs: LogEntry[] = [
      createLogEntry({
        entry_date: '2026-01-10',
        ratings: { state: 5, focus: 6 },
      }),
    ];

    const result = getChartData(logs, testMetrics);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      date: '2026-01-10',
      state: 5,
      focus: 6,
    });
  });

  it('sorts by date ascending', () => {
    const logs: LogEntry[] = [
      createLogEntry({ id: 'log-2', entry_date: '2026-01-12', ratings: { state: 7 } }),
      createLogEntry({ id: 'log-1', entry_date: '2026-01-10', ratings: { state: 5 } }),
      createLogEntry({ id: 'log-3', entry_date: '2026-01-11', ratings: { state: 6 } }),
    ];

    const result = getChartData(logs, testMetrics);

    expect(result.map((d) => d.date)).toEqual(['2026-01-10', '2026-01-11', '2026-01-12']);
  });

  it('averages multiple logs on same date', () => {
    const logs: LogEntry[] = [
      createLogEntry({ id: 'log-1', entry_date: '2026-01-10', ratings: { state: 4 } }),
      createLogEntry({ id: 'log-2', entry_date: '2026-01-10', ratings: { state: 6 } }),
    ];

    const result = getChartData(logs, testMetrics);

    expect(result).toHaveLength(1);
    expect(result[0].state).toBe(5); // Average of 4 and 6
  });

  it('handles partial ratings across logs', () => {
    const logs: LogEntry[] = [
      createLogEntry({ id: 'log-1', entry_date: '2026-01-10', ratings: { state: 4, focus: 5 } }),
      createLogEntry({ id: 'log-2', entry_date: '2026-01-10', ratings: { state: 6 } }), // No focus
    ];

    const result = getChartData(logs, testMetrics);

    expect(result[0].state).toBe(5); // Average of 4 and 6
    expect(result[0].focus).toBe(5); // Only one value
  });

  it('excludes undefined metric values from average', () => {
    const logs: LogEntry[] = [
      createLogEntry({ id: 'log-1', entry_date: '2026-01-10', ratings: { state: 4 } }),
      createLogEntry({ id: 'log-2', entry_date: '2026-01-10', ratings: {} }), // No ratings
    ];

    const result = getChartData(logs, testMetrics);

    expect(result[0].state).toBe(4); // Only one valid value
    expect(result[0].focus).toBeUndefined();
  });
});

describe('getTodayDateString', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns ISO date string for today', () => {
    vi.setSystemTime(new Date('2026-01-15T14:30:00Z'));

    const result = getTodayDateString();

    expect(result).toBe('2026-01-15');
  });

  it('returns correct date regardless of time', () => {
    vi.setSystemTime(new Date('2026-01-15T23:59:59Z'));

    const result = getTodayDateString();

    expect(result).toBe('2026-01-15');
  });
});
