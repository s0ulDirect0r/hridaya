import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateExperiment } from './CreateExperiment';
import {
  mockUseData,
  createMockDataContext,
  mockExperiment,
} from '@/test/test-utils';

// Mock dependencies
vi.mock('@/lib/data-context', () => ({
  useData: () => mockUseData(),
}));

vi.mock('@/lib/data', () => ({
  getTodayDateString: () => '2026-01-10',
}));

describe('CreateExperiment', () => {
  const mockOnComplete = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseData.mockReturnValue(createMockDataContext());
  });

  describe('Step 1: Basics', () => {
    it('renders basics step initially', () => {
      render(<CreateExperiment onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      expect(screen.getByText('New Experiment')).toBeInTheDocument();
      expect(screen.getByText('What are you investigating?')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/morning metta/i)).toBeInTheDocument();
    });

    it('disables Continue when fields are empty', () => {
      render(<CreateExperiment onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      const continueButton = screen.getByRole('button', { name: /continue/i });
      expect(continueButton).toBeDisabled();
    });

    it('enables Continue when title and hypothesis are filled', () => {
      render(<CreateExperiment onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      fireEvent.change(screen.getByPlaceholderText(/morning metta/i), {
        target: { value: 'Test Experiment' },
      });
      fireEvent.change(screen.getByPlaceholderText(/I suspect that/i), {
        target: { value: 'Test hypothesis' },
      });

      const continueButton = screen.getByRole('button', { name: /continue/i });
      expect(continueButton).not.toBeDisabled();
    });
  });

  describe('Step Navigation', () => {
    it('advances to protocol step', () => {
      render(<CreateExperiment onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      // Fill basics
      fireEvent.change(screen.getByPlaceholderText(/morning metta/i), {
        target: { value: 'Test' },
      });
      fireEvent.change(screen.getByPlaceholderText(/I suspect that/i), {
        target: { value: 'Hypothesis' },
      });
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));

      expect(screen.getByText('What will you do?')).toBeInTheDocument();
    });

    it('shows Back button after first step', () => {
      render(<CreateExperiment onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      // Initially no Back button
      expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();

      // Go to step 2
      fireEvent.change(screen.getByPlaceholderText(/morning metta/i), {
        target: { value: 'Test' },
      });
      fireEvent.change(screen.getByPlaceholderText(/I suspect that/i), {
        target: { value: 'Hypothesis' },
      });
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));

      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    it('navigates back to previous step', () => {
      render(<CreateExperiment onComplete={mockOnComplete} onCancel={mockOnCancel} />);

      // Go to step 2
      fireEvent.change(screen.getByPlaceholderText(/morning metta/i), {
        target: { value: 'Test' },
      });
      fireEvent.change(screen.getByPlaceholderText(/I suspect that/i), {
        target: { value: 'Hypothesis' },
      });
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));

      // Go back
      fireEvent.click(screen.getByRole('button', { name: /back/i }));

      expect(screen.getByText('What are you investigating?')).toBeInTheDocument();
    });
  });

  describe('Step 2: Protocol', () => {
    const goToProtocolStep = () => {
      fireEvent.change(screen.getByPlaceholderText(/morning metta/i), {
        target: { value: 'Test' },
      });
      fireEvent.change(screen.getByPlaceholderText(/I suspect that/i), {
        target: { value: 'Hypothesis' },
      });
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    };

    it('renders protocol step', () => {
      render(<CreateExperiment onComplete={mockOnComplete} onCancel={mockOnCancel} />);
      goToProtocolStep();

      expect(screen.getByText('What will you do?')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/morning sit/i)).toBeInTheDocument();
    });

    it('disables Continue when protocol is empty', () => {
      render(<CreateExperiment onComplete={mockOnComplete} onCancel={mockOnCancel} />);
      goToProtocolStep();

      const continueButton = screen.getByRole('button', { name: /continue/i });
      expect(continueButton).toBeDisabled();
    });
  });

  describe('Step 3: Metrics', () => {
    const goToMetricsStep = () => {
      fireEvent.change(screen.getByPlaceholderText(/morning metta/i), {
        target: { value: 'Test' },
      });
      fireEvent.change(screen.getByPlaceholderText(/I suspect that/i), {
        target: { value: 'Hypothesis' },
      });
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      fireEvent.change(screen.getByPlaceholderText(/morning sit/i), {
        target: { value: 'Protocol' },
      });
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    };

    it('renders metrics step with default metric', () => {
      render(<CreateExperiment onComplete={mockOnComplete} onCancel={mockOnCancel} />);
      goToMetricsStep();

      expect(screen.getByText('What will you measure?')).toBeInTheDocument();
      expect(screen.getByDisplayValue('State')).toBeInTheDocument();
    });

    it('adds a new metric', () => {
      render(<CreateExperiment onComplete={mockOnComplete} onCancel={mockOnCancel} />);
      goToMetricsStep();

      fireEvent.click(screen.getByRole('button', { name: /add metric/i }));

      // Should have two metric inputs now
      const metricInputs = screen.getAllByPlaceholderText(/bleed-through/i);
      expect(metricInputs.length).toBe(2);
    });

    it('removes a metric', () => {
      render(<CreateExperiment onComplete={mockOnComplete} onCancel={mockOnCancel} />);
      goToMetricsStep();

      // Add second metric
      fireEvent.click(screen.getByRole('button', { name: /add metric/i }));

      // Remove one
      const removeButtons = screen.getAllByRole('button', { name: /remove/i });
      fireEvent.click(removeButtons[0]);

      // Should have one metric input
      const metricInputs = screen.getAllByPlaceholderText(/bleed-through/i);
      expect(metricInputs.length).toBe(1);
    });

    it('prevents removing the last metric', () => {
      render(<CreateExperiment onComplete={mockOnComplete} onCancel={mockOnCancel} />);
      goToMetricsStep();

      // Should not have remove button with only one metric
      expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
    });
  });

  describe('Step 5: Review and Submit', () => {
    const goToReviewStep = () => {
      // Step 1: Basics
      fireEvent.change(screen.getByPlaceholderText(/morning metta/i), {
        target: { value: 'My Test Experiment' },
      });
      fireEvent.change(screen.getByPlaceholderText(/I suspect that/i), {
        target: { value: 'This will work' },
      });
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));

      // Step 2: Protocol
      fireEvent.change(screen.getByPlaceholderText(/morning sit/i), {
        target: { value: 'Do the thing' },
      });
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));

      // Step 3: Metrics (already has default)
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));

      // Step 4: Duration (already has defaults)
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    };

    it('shows review step with all entered data', () => {
      render(<CreateExperiment onComplete={mockOnComplete} onCancel={mockOnCancel} />);
      goToReviewStep();

      expect(screen.getByText('Review Your Experiment')).toBeInTheDocument();
      expect(screen.getByText('My Test Experiment')).toBeInTheDocument();
      expect(screen.getByText('This will work')).toBeInTheDocument();
      expect(screen.getByText('Do the thing')).toBeInTheDocument();
    });

    it('shows Start Experiment button on review', () => {
      render(<CreateExperiment onComplete={mockOnComplete} onCancel={mockOnCancel} />);
      goToReviewStep();

      expect(screen.getByRole('button', { name: /start experiment/i })).toBeInTheDocument();
    });

    it('calls createExperiment and onComplete on submit', async () => {
      const mockCreateExperiment = vi.fn().mockResolvedValue(mockExperiment);
      mockUseData.mockReturnValue(
        createMockDataContext({ createExperiment: mockCreateExperiment })
      );

      render(<CreateExperiment onComplete={mockOnComplete} onCancel={mockOnCancel} />);
      goToReviewStep();

      fireEvent.click(screen.getByRole('button', { name: /start experiment/i }));

      await waitFor(() => {
        expect(mockCreateExperiment).toHaveBeenCalled();
        expect(mockOnComplete).toHaveBeenCalled();
      });
    });

    it('shows error on submit failure', async () => {
      const mockCreateExperiment = vi.fn().mockRejectedValue(new Error('Failed'));
      mockUseData.mockReturnValue(
        createMockDataContext({ createExperiment: mockCreateExperiment })
      );

      render(<CreateExperiment onComplete={mockOnComplete} onCancel={mockOnCancel} />);
      goToReviewStep();

      fireEvent.click(screen.getByRole('button', { name: /start experiment/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed')).toBeInTheDocument();
      });
    });
  });

  it('calls onCancel when cancel button clicked', () => {
    render(<CreateExperiment onComplete={mockOnComplete} onCancel={mockOnCancel} />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnCancel).toHaveBeenCalled();
  });
});
