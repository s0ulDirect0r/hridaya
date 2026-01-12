'use client';

import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { LogEntry, MetricDefinition, LogEntryType } from '@/lib/types';
import {
  transformLogsToChartData,
  aggregateByDate,
  filterLogsByType,
} from '@/lib/chart-utils';
import { LOG_TYPE_LABELS } from '@/lib/types';

// Color palette for metric lines
const COLORS = [
  '#6366f1', // indigo
  '#ec4899', // pink
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#14b8a6', // teal
];

type FilterOption = 'all' | LogEntryType;

interface ExperimentChartProps {
  logs: LogEntry[];
  metrics: MetricDefinition[];
  title?: string;
}

export function ExperimentChart({ logs, metrics, title }: ExperimentChartProps) {
  const [filter, setFilter] = useState<FilterOption>('all');
  const [aggregate, setAggregate] = useState(false);

  const chartData = useMemo(() => {
    // Apply entry type filter
    const filteredLogs =
      filter === 'all' ? logs : filterLogsByType(logs, [filter]);

    // Transform to chart data, optionally aggregating
    return aggregate
      ? aggregateByDate(filteredLogs, metrics)
      : transformLogsToChartData(filteredLogs, metrics);
  }, [logs, metrics, filter, aggregate]);

  const filterOptions: { value: FilterOption; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'before_sit', label: LOG_TYPE_LABELS.before_sit },
    { value: 'after_sit', label: LOG_TYPE_LABELS.after_sit },
    { value: 'eod', label: LOG_TYPE_LABELS.eod },
  ];

  if (logs.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
        <p className="text-gray-500">No data yet. Log some entries to see your trends.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {title && <h3 className="text-lg font-medium text-gray-900">{title}</h3>}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Entry type filter */}
        <div className="flex gap-1">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === option.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Aggregate toggle */}
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={aggregate}
            onChange={(e) => setAggregate(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          Average by day
        </label>
      </div>

      {/* Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(date: string) => {
                const d = new Date(date + 'T00:00:00');
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }}
            />
            <YAxis
              domain={[1, 7]}
              ticks={[1, 2, 3, 4, 5, 6, 7]}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              labelFormatter={(date: string) => {
                const d = new Date(date + 'T00:00:00');
                return d.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                });
              }}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
              }}
            />
            <Legend />
            {metrics.map((metric, index) => (
              <Line
                key={metric.id}
                type="monotone"
                dataKey={metric.id}
                name={metric.name}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
