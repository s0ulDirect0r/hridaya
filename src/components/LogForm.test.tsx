import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LogForm } from './LogForm';
import {
  mockUseData,
  createMockDataContext,
  createMockLogEntry,
  mockExperiment,
} from '@/test/test-utils';

// Mock dependencies
vi.mock('@/lib/data-context', () => ({
  useData: () => mockUseData(),
}));

vi.mock('@/lib/data', () => ({
  getTodayDateString: () => '2026-01-10',
}));

describe('LogForm', () => {
  const mockOnComplete = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseData.mockReturnValue(createMockDataContext());
  });

  it('renders the form with entry type buttons', () => {
    render(<LogForm onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    expect(screen.getByText('New Log Entry')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /before sit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /after sit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /end of day/i })).toBeInTheDocument();
  });

  it('renders metric rating buttons', () => {
    render(<LogForm onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    // Should show metrics from experiment
    expect(screen.getByText('State')).toBeInTheDocument();
    expect(screen.getByText('Focus')).toBeInTheDocument();

    // Should show 1-7 scale buttons for each metric (14 total)
    const ratingButtons = screen.getAllByRole('button', { name: /^[1-7]$/ });
    expect(ratingButtons.length).toBe(14); // 7 per metric × 2 metrics
  });

  it('shows "No active experiment" when none exists', () => {
    mockUseData.mockReturnValue(
      createMockDataContext({ activeExperiment: null })
    );

    render(<LogForm onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    expect(screen.getByText('No active experiment')).toBeInTheDocument();
  });

  it('defaults to first unlogged entry type', () => {
    // No logs yet - should default to before_sit
    render(<LogForm onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    const beforeSitButton = screen.getByRole('button', { name: /before sit/i });
    expect(beforeSitButton).toHaveClass('bg-stone-800'); // Active state
  });

  it('defaults to after_sit when before_sit is logged', () => {
    mockUseData.mockReturnValue(
      createMockDataContext({
        todayLogs: [createMockLogEntry({ entry_type: 'before_sit' })],
      })
    );

    render(<LogForm onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    const afterSitButton = screen.getByRole('button', { name: /after sit/i });
    expect(afterSitButton).toHaveClass('bg-stone-800');
  });

  it('marks already logged entry types', () => {
    mockUseData.mockReturnValue(
      createMockDataContext({
        todayLogs: [createMockLogEntry({ entry_type: 'before_sit' })],
      })
    );

    render(<LogForm onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    expect(screen.getByText('logged')).toBeInTheDocument();
  });

  it('switches entry type when button clicked', () => {
    render(<LogForm onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    const eodButton = screen.getByRole('button', { name: /end of day/i });
    fireEvent.click(eodButton);

    expect(eodButton).toHaveClass('bg-stone-800');
  });

  it('shows sit duration field for sit entries', () => {
    render(<LogForm onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    expect(screen.getByText(/sit duration/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g., 30')).toBeInTheDocument();
  });

  it('hides sit duration field for eod entry', () => {
    render(<LogForm onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    const eodButton = screen.getByRole('button', { name: /end of day/i });
    fireEvent.click(eodButton);

    expect(screen.queryByText(/sit duration/i)).not.toBeInTheDocument();
  });

  it('shows technique notes only for after_sit', () => {
    render(<LogForm onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    // Default is before_sit - no technique notes
    expect(screen.queryByPlaceholderText(/what technique/i)).not.toBeInTheDocument();

    // Switch to after_sit
    const afterSitButton = screen.getByRole('button', { name: /after sit/i });
    fireEvent.click(afterSitButton);

    expect(screen.getByPlaceholderText(/what technique/i)).toBeInTheDocument();
  });

  it('updates rating when button clicked', () => {
    render(<LogForm onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    // Find the first "5" button (for State metric)
    const ratingButtons = screen.getAllByRole('button', { name: '5' });
    fireEvent.click(ratingButtons[0]);

    // Should show "5/7" for the first metric
    expect(screen.getByText('5/7')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button clicked', () => {
    render(<LogForm onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('calls createLogEntry and onComplete on submit', async () => {
    const mockCreateLogEntry = vi.fn().mockResolvedValue(createMockLogEntry());
    mockUseData.mockReturnValue(
      createMockDataContext({ createLogEntry: mockCreateLogEntry })
    );

    render(<LogForm onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    // Select a rating
    const ratingButtons = screen.getAllByRole('button', { name: '5' });
    fireEvent.click(ratingButtons[0]);

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /save log/i }));

    await waitFor(() => {
      expect(mockCreateLogEntry).toHaveBeenCalled();
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  it('shows error message on failed submit', async () => {
    const mockCreateLogEntry = vi.fn().mockRejectedValue(new Error('Database error'));
    mockUseData.mockReturnValue(
      createMockDataContext({ createLogEntry: mockCreateLogEntry })
    );

    render(<LogForm onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    fireEvent.click(screen.getByRole('button', { name: /save log/i }));

    await waitFor(() => {
      expect(screen.getByText('Database error')).toBeInTheDocument();
    });
  });

  it('disables save button while saving', async () => {
    const mockCreateLogEntry = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );
    mockUseData.mockReturnValue(
      createMockDataContext({ createLogEntry: mockCreateLogEntry })
    );

    render(<LogForm onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    const saveButton = screen.getByRole('button', { name: /save log/i });
    fireEvent.click(saveButton);

    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
  });

  it('shows EOD guidance text when EOD selected', () => {
    render(<LogForm onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    const eodButton = screen.getByRole('button', { name: /end of day/i });
    fireEvent.click(eodButton);

    expect(screen.getByText(/sleep quality/i)).toBeInTheDocument();
    expect(screen.getByText(/stress level/i)).toBeInTheDocument();
  });
});
