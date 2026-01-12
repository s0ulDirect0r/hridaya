import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import {
  mockUseData,
  createMockDataContext,
  createMockLogEntry,
  mockExperiment,
  mockProgress,
} from '@/test/test-utils';

// Mock dependencies
vi.mock('@/lib/data-context', () => ({
  useData: () => mockUseData(),
}));

vi.mock('@/lib/auth', () => ({
  useAuth: () => ({
    signOut: vi.fn(),
  }),
}));

// Mock ExperimentChart to avoid recharts rendering issues
vi.mock('./ExperimentChart', () => ({
  ExperimentChart: ({ title }: { title?: string }) => (
    <div data-testid="experiment-chart">{title}</div>
  ),
}));

describe('Dashboard', () => {
  const mockOnNewExperiment = vi.fn();
  const mockOnLog = vi.fn();
  const mockOnViewJournal = vi.fn();
  const mockOnChat = vi.fn();

  const defaultProps = {
    onNewExperiment: mockOnNewExperiment,
    onLog: mockOnLog,
    onViewJournal: mockOnViewJournal,
    onChat: mockOnChat,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseData.mockReturnValue(createMockDataContext());
  });

  describe('With active experiment', () => {
    it('renders experiment title and hypothesis', () => {
      render(<Dashboard {...defaultProps} />);

      expect(screen.getByText('Test Experiment')).toBeInTheDocument();
      expect(screen.getByText(/test hypothesis/i)).toBeInTheDocument();
    });

    it('shows current day progress', () => {
      render(<Dashboard {...defaultProps} />);

      expect(screen.getByText('Day 1 of 7')).toBeInTheDocument();
    });

    it('shows Log Entry button', () => {
      render(<Dashboard {...defaultProps} />);

      expect(screen.getByRole('button', { name: /log entry/i })).toBeInTheDocument();
    });

    it('calls onLog when Log Entry clicked', () => {
      render(<Dashboard {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /log entry/i }));

      expect(mockOnLog).toHaveBeenCalled();
    });

    it('calls onChat when Reflect with Claude clicked', () => {
      render(<Dashboard {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /reflect with claude/i }));

      expect(mockOnChat).toHaveBeenCalled();
    });

    it('shows "No logs yet today" when no today logs', () => {
      mockUseData.mockReturnValue(
        createMockDataContext({ todayLogs: [] })
      );

      render(<Dashboard {...defaultProps} />);

      expect(screen.getByText('No logs yet today')).toBeInTheDocument();
    });

    it('shows today log badges', () => {
      mockUseData.mockReturnValue(
        createMockDataContext({
          todayLogs: [
            createMockLogEntry({ entry_type: 'before_sit' }),
            createMockLogEntry({ id: 'log-2', entry_type: 'after_sit' }),
          ],
        })
      );

      render(<Dashboard {...defaultProps} />);

      expect(screen.getByText('Before Sit')).toBeInTheDocument();
      expect(screen.getByText('After Sit')).toBeInTheDocument();
    });

    it('shows chart when logs exist', () => {
      mockUseData.mockReturnValue(
        createMockDataContext({
          recentLogs: [createMockLogEntry()],
        })
      );

      render(<Dashboard {...defaultProps} />);

      expect(screen.getByTestId('experiment-chart')).toBeInTheDocument();
    });

    it('shows recent logs section', () => {
      mockUseData.mockReturnValue(
        createMockDataContext({
          recentLogs: [
            createMockLogEntry({ notes: 'Test note' }),
          ],
        })
      );

      render(<Dashboard {...defaultProps} />);

      expect(screen.getByText('Recent Logs')).toBeInTheDocument();
      expect(screen.getByText('Test note')).toBeInTheDocument();
    });

    it('shows "View all logs" when more than 5 logs', () => {
      const logs = Array.from({ length: 6 }, (_, i) =>
        createMockLogEntry({ id: `log-${i}` })
      );
      mockUseData.mockReturnValue(
        createMockDataContext({ recentLogs: logs })
      );

      render(<Dashboard {...defaultProps} />);

      expect(screen.getByText(/view all logs/i)).toBeInTheDocument();
    });
  });

  describe('Without active experiment', () => {
    beforeEach(() => {
      mockUseData.mockReturnValue(
        createMockDataContext({
          activeExperiment: null,
          hasActiveExperiment: false,
          experimentProgress: null,
        })
      );
    });

    it('shows empty state message', () => {
      render(<Dashboard {...defaultProps} />);

      expect(screen.getByText('No active experiment')).toBeInTheDocument();
      expect(screen.getByText(/ready to investigate/i)).toBeInTheDocument();
    });

    it('shows Start New Experiment button', () => {
      render(<Dashboard {...defaultProps} />);

      expect(screen.getByRole('button', { name: /start new experiment/i })).toBeInTheDocument();
    });

    it('calls onNewExperiment when button clicked', () => {
      render(<Dashboard {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /start new experiment/i }));

      expect(mockOnNewExperiment).toHaveBeenCalled();
    });
  });

  describe('Header', () => {
    it('shows app title', () => {
      render(<Dashboard {...defaultProps} />);

      expect(screen.getByText('Hridaya')).toBeInTheDocument();
    });

    it('shows Journal button with count', () => {
      mockUseData.mockReturnValue(
        createMockDataContext({
          recentLogs: [createMockLogEntry(), createMockLogEntry({ id: 'log-2' })],
        })
      );

      render(<Dashboard {...defaultProps} />);

      expect(screen.getByRole('button', { name: /journal \(2\)/i })).toBeInTheDocument();
    });

    it('calls onViewJournal when Journal clicked', () => {
      render(<Dashboard {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /journal/i }));

      expect(mockOnViewJournal).toHaveBeenCalled();
    });

    it('calls onChat when Reflect clicked', () => {
      render(<Dashboard {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Reflect' }));

      expect(mockOnChat).toHaveBeenCalled();
    });
  });
});
