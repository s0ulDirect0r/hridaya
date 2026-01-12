import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExperimentChart } from './ExperimentChart';
import type { LogEntry, MetricDefinition } from '@/lib/types';

// Mock recharts to avoid SVG rendering issues in jsdom
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: ({ dataKey, name }: { dataKey: string; name: string }) => (
    <div data-testid={`line-${dataKey}`} data-name={name} />
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

const createLogEntry = (
  overrides: Partial<LogEntry>
): LogEntry => ({
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

const testMetrics: MetricDefinition[] = [
  { id: 'bleed_through', name: 'Bleed-through', scale: [1, 7] },
  { id: 'state', name: 'State', scale: [1, 7] },
];

describe('ExperimentChart', () => {
  it('renders empty state when no logs provided', () => {
    render(<ExperimentChart logs={[]} metrics={testMetrics} />);

    expect(screen.getByText(/no data yet/i)).toBeInTheDocument();
  });

  it('renders chart when logs are provided', () => {
    const logs: LogEntry[] = [
      createLogEntry({
        entry_date: '2026-01-10',
        ratings: { bleed_through: 5, state: 6 },
      }),
    ];

    render(<ExperimentChart logs={logs} metrics={testMetrics} />);

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.queryByText(/no data yet/i)).not.toBeInTheDocument();
  });

  it('renders a line for each metric', () => {
    const logs: LogEntry[] = [
      createLogEntry({
        entry_date: '2026-01-10',
        ratings: { bleed_through: 5, state: 6 },
      }),
    ];

    render(<ExperimentChart logs={logs} metrics={testMetrics} />);

    expect(screen.getByTestId('line-bleed_through')).toBeInTheDocument();
    expect(screen.getByTestId('line-state')).toBeInTheDocument();
  });

  it('renders entry type filter buttons', () => {
    const logs: LogEntry[] = [
      createLogEntry({
        entry_date: '2026-01-10',
        ratings: { state: 5 },
      }),
    ];

    render(<ExperimentChart logs={logs} metrics={testMetrics} />);

    expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /before sit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /after sit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /end of day/i })).toBeInTheDocument();
  });

  it('filters data when entry type button clicked', () => {
    const logs: LogEntry[] = [
      createLogEntry({
        id: 'log-1',
        entry_type: 'before_sit',
        entry_date: '2026-01-10',
        ratings: { state: 3 },
      }),
      createLogEntry({
        id: 'log-2',
        entry_type: 'after_sit',
        entry_date: '2026-01-10',
        ratings: { state: 5 },
      }),
    ];

    render(<ExperimentChart logs={logs} metrics={testMetrics} />);

    // Initially shows all
    const allButton = screen.getByRole('button', { name: /all/i });
    expect(allButton).toHaveClass('bg-indigo-600');

    // Click After Sit filter
    const afterSitButton = screen.getByRole('button', { name: /after sit/i });
    fireEvent.click(afterSitButton);

    // After Sit button should now be active
    expect(afterSitButton).toHaveClass('bg-indigo-600');
    expect(allButton).not.toHaveClass('bg-indigo-600');
  });

  it('shows aggregate toggle', () => {
    const logs: LogEntry[] = [
      createLogEntry({
        entry_date: '2026-01-10',
        ratings: { state: 5 },
      }),
    ];

    render(<ExperimentChart logs={logs} metrics={testMetrics} />);

    expect(screen.getByLabelText(/average by day/i)).toBeInTheDocument();
  });

  it('renders chart title when provided', () => {
    const logs: LogEntry[] = [
      createLogEntry({
        entry_date: '2026-01-10',
        ratings: { state: 5 },
      }),
    ];

    render(
      <ExperimentChart
        logs={logs}
        metrics={testMetrics}
        title="Metric Trends"
      />
    );

    expect(screen.getByText('Metric Trends')).toBeInTheDocument();
  });
});
