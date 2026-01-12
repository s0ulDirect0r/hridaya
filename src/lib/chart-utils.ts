import type { LogEntry, MetricDefinition, LogEntryType, ChartDataPoint } from './types';

/**
 * Filter logs by entry type(s).
 * If no types provided, returns all logs.
 */
export function filterLogsByType(
  logs: LogEntry[],
  types?: LogEntryType[]
): LogEntry[] {
  if (!types || types.length === 0) {
    return logs;
  }
  return logs.filter((log) => types.includes(log.entry_type));
}

/**
 * Transform log entries into chart data points.
 * Each log entry becomes one data point with date and metric values.
 * Results are sorted by date ascending.
 */
export function transformLogsToChartData(
  logs: LogEntry[],
  metrics: MetricDefinition[]
): ChartDataPoint[] {
  if (logs.length === 0) {
    return [];
  }

  const dataPoints: ChartDataPoint[] = logs.map((log) => {
    const point: ChartDataPoint = { date: log.entry_date };
    for (const metric of metrics) {
      if (log.ratings[metric.id] !== undefined) {
        point[metric.id] = log.ratings[metric.id];
      }
    }
    return point;
  });

  // Sort by date ascending
  return dataPoints.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Aggregate logs by date, averaging metric values when multiple entries exist
 * for the same date.
 */
export function aggregateByDate(
  logs: LogEntry[],
  metrics: MetricDefinition[]
): ChartDataPoint[] {
  if (logs.length === 0) {
    return [];
  }

  // Group logs by date
  const byDate = new Map<string, LogEntry[]>();
  for (const log of logs) {
    const existing = byDate.get(log.entry_date) || [];
    existing.push(log);
    byDate.set(log.entry_date, existing);
  }

  // Compute averages for each date
  const dataPoints: ChartDataPoint[] = [];
  for (const [date, dateLogs] of byDate) {
    const point: ChartDataPoint = { date };

    for (const metric of metrics) {
      const values = dateLogs
        .map((log) => log.ratings[metric.id])
        .filter((v): v is number => v !== undefined);

      if (values.length > 0) {
        const sum = values.reduce((acc, v) => acc + v, 0);
        point[metric.id] = sum / values.length;
      }
    }

    dataPoints.push(point);
  }

  // Sort by date ascending
  return dataPoints.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Extract a single metric's time series from logs.
 * Returns array of {date, value} for entries that have the metric.
 */
export function getMetricSeries(
  logs: LogEntry[],
  metricId: string
): { date: string; value: number }[] {
  const series: { date: string; value: number }[] = [];

  for (const log of logs) {
    const value = log.ratings[metricId];
    if (value !== undefined) {
      series.push({ date: log.entry_date, value });
    }
  }

  return series.sort((a, b) => a.date.localeCompare(b.date));
}
