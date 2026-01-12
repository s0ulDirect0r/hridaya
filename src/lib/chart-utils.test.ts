import { describe, it, expect } from 'vitest';
import {
  transformLogsToChartData,
  getMetricSeries,
  aggregateByDate,
  filterLogsByType,
} from './chart-utils';
import type { LogEntry, MetricDefinition, LogEntryType } from './types';

// Test fixtures
const createLogEntry = (
  overrides: Partial<LogEntry> & { entry_date: string; entry_type: LogEntryType }
): LogEntry => ({
  id: 'log-1',
  user_id: 'user-1',
  experiment_id: 'exp-1',
  ratings: {},
  notes: null,
  sit_duration_minutes: null,
  technique_notes: null,
  created_at: '2026-01-01T10:00:00Z',
  ...overrides,
});

const testMetrics: MetricDefinition[] = [
  { id: 'bleed_through', name: 'Bleed-through', scale: [1, 7] },
  { id: 'state', name: 'State', scale: [1, 7] },
];

describe('chart-utils', () => {
  describe('transformLogsToChartData', () => {
    it('returns empty array for empty logs', () => {
      const result = transformLogsToChartData([], testMetrics);
      expect(result).toEqual([]);
    });

    it('transforms single log entry to chart data point', () => {
      const logs: LogEntry[] = [
        createLogEntry({
          entry_date: '2026-01-10',
          entry_type: 'after_sit',
          ratings: { bleed_through: 5, state: 6 },
        }),
      ];

      const result = transformLogsToChartData(logs, testMetrics);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        date: '2026-01-10',
        bleed_through: 5,
        state: 6,
      });
    });

    it('transforms multiple logs on different dates', () => {
      const logs: LogEntry[] = [
        createLogEntry({
          id: 'log-1',
          entry_date: '2026-01-10',
          entry_type: 'after_sit',
          ratings: { bleed_through: 4, state: 5 },
        }),
        createLogEntry({
          id: 'log-2',
          entry_date: '2026-01-11',
          entry_type: 'after_sit',
          ratings: { bleed_through: 6, state: 7 },
        }),
      ];

      const result = transformLogsToChartData(logs, testMetrics);

      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2026-01-10');
      expect(result[1].date).toBe('2026-01-11');
    });

    it('sorts results by date ascending', () => {
      const logs: LogEntry[] = [
        createLogEntry({
          id: 'log-2',
          entry_date: '2026-01-12',
          entry_type: 'after_sit',
          ratings: { state: 5 },
        }),
        createLogEntry({
          id: 'log-1',
          entry_date: '2026-01-10',
          entry_type: 'after_sit',
          ratings: { state: 3 },
        }),
        createLogEntry({
          id: 'log-3',
          entry_date: '2026-01-11',
          entry_type: 'after_sit',
          ratings: { state: 4 },
        }),
      ];

      const result = transformLogsToChartData(logs, testMetrics);

      expect(result.map((d) => d.date)).toEqual([
        '2026-01-10',
        '2026-01-11',
        '2026-01-12',
      ]);
    });

    it('handles logs with partial metric ratings', () => {
      const logs: LogEntry[] = [
        createLogEntry({
          entry_date: '2026-01-10',
          entry_type: 'after_sit',
          ratings: { bleed_through: 5 }, // missing 'state'
        }),
      ];

      const result = transformLogsToChartData(logs, testMetrics);

      expect(result[0].bleed_through).toBe(5);
      expect(result[0].state).toBeUndefined();
    });
  });

  describe('aggregateByDate', () => {
    it('averages multiple entries on same date', () => {
      const logs: LogEntry[] = [
        createLogEntry({
          id: 'log-1',
          entry_date: '2026-01-10',
          entry_type: 'before_sit',
          ratings: { state: 4 },
        }),
        createLogEntry({
          id: 'log-2',
          entry_date: '2026-01-10',
          entry_type: 'after_sit',
          ratings: { state: 6 },
        }),
      ];

      const result = aggregateByDate(logs, testMetrics);

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2026-01-10');
      expect(result[0].state).toBe(5); // average of 4 and 6
    });

    it('handles multiple metrics with different entry counts', () => {
      const logs: LogEntry[] = [
        createLogEntry({
          id: 'log-1',
          entry_date: '2026-01-10',
          entry_type: 'before_sit',
          ratings: { state: 4, bleed_through: 3 },
        }),
        createLogEntry({
          id: 'log-2',
          entry_date: '2026-01-10',
          entry_type: 'after_sit',
          ratings: { state: 6 }, // no bleed_through
        }),
      ];

      const result = aggregateByDate(logs, testMetrics);

      expect(result[0].state).toBe(5); // average of 4 and 6
      expect(result[0].bleed_through).toBe(3); // only one value
    });
  });

  describe('filterLogsByType', () => {
    it('filters logs by single entry type', () => {
      const logs: LogEntry[] = [
        createLogEntry({
          id: 'log-1',
          entry_date: '2026-01-10',
          entry_type: 'before_sit',
          ratings: {},
        }),
        createLogEntry({
          id: 'log-2',
          entry_date: '2026-01-10',
          entry_type: 'after_sit',
          ratings: {},
        }),
        createLogEntry({
          id: 'log-3',
          entry_date: '2026-01-10',
          entry_type: 'eod',
          ratings: {},
        }),
      ];

      const result = filterLogsByType(logs, ['after_sit']);

      expect(result).toHaveLength(1);
      expect(result[0].entry_type).toBe('after_sit');
    });

    it('filters logs by multiple entry types', () => {
      const logs: LogEntry[] = [
        createLogEntry({
          id: 'log-1',
          entry_date: '2026-01-10',
          entry_type: 'before_sit',
          ratings: {},
        }),
        createLogEntry({
          id: 'log-2',
          entry_date: '2026-01-10',
          entry_type: 'after_sit',
          ratings: {},
        }),
        createLogEntry({
          id: 'log-3',
          entry_date: '2026-01-10',
          entry_type: 'eod',
          ratings: {},
        }),
      ];

      const result = filterLogsByType(logs, ['before_sit', 'after_sit']);

      expect(result).toHaveLength(2);
      expect(result.map((l) => l.entry_type)).toContain('before_sit');
      expect(result.map((l) => l.entry_type)).toContain('after_sit');
    });

    it('returns all logs when no filter provided', () => {
      const logs: LogEntry[] = [
        createLogEntry({
          id: 'log-1',
          entry_date: '2026-01-10',
          entry_type: 'before_sit',
          ratings: {},
        }),
        createLogEntry({
          id: 'log-2',
          entry_date: '2026-01-10',
          entry_type: 'eod',
          ratings: {},
        }),
      ];

      const result = filterLogsByType(logs, undefined);

      expect(result).toHaveLength(2);
    });
  });

  describe('getMetricSeries', () => {
    it('extracts series data for a specific metric', () => {
      const logs: LogEntry[] = [
        createLogEntry({
          id: 'log-1',
          entry_date: '2026-01-10',
          entry_type: 'after_sit',
          ratings: { state: 5 },
        }),
        createLogEntry({
          id: 'log-2',
          entry_date: '2026-01-11',
          entry_type: 'after_sit',
          ratings: { state: 6 },
        }),
      ];

      const result = getMetricSeries(logs, 'state');

      expect(result).toEqual([
        { date: '2026-01-10', value: 5 },
        { date: '2026-01-11', value: 6 },
      ]);
    });

    it('skips entries without the specified metric', () => {
      const logs: LogEntry[] = [
        createLogEntry({
          id: 'log-1',
          entry_date: '2026-01-10',
          entry_type: 'after_sit',
          ratings: { state: 5, bleed_through: 4 },
        }),
        createLogEntry({
          id: 'log-2',
          entry_date: '2026-01-11',
          entry_type: 'after_sit',
          ratings: { bleed_through: 6 }, // no state
        }),
      ];

      const result = getMetricSeries(logs, 'state');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ date: '2026-01-10', value: 5 });
    });
  });
});
