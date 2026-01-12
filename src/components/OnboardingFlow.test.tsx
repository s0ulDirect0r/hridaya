import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OnboardingFlow } from './OnboardingFlow';
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

describe('OnboardingFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseData.mockReturnValue(createMockDataContext());
  });

  describe('Welcome step', () => {
    it('renders welcome message', () => {
      render(<OnboardingFlow />);

      expect(screen.getByText('Hridaya')).toBeInTheDocument();
      expect(screen.getByText(/contemplative research platform/i)).toBeInTheDocument();
    });

    it('explains the core metaphor', () => {
      render(<OnboardingFlow />);

      expect(screen.getByText(/the core metaphor/i)).toBeInTheDocument();
      expect(screen.getByText(/scientist running experiments/i)).toBeInTheDocument();
    });

    it('shows Begin button', () => {
      render(<OnboardingFlow />);

      expect(screen.getByRole('button', { name: /begin/i })).toBeInTheDocument();
    });

    it('advances to choice step when Begin clicked', () => {
      render(<OnboardingFlow />);

      fireEvent.click(screen.getByRole('button', { name: /begin/i }));

      expect(screen.getByText('How would you like to start?')).toBeInTheDocument();
    });
  });

  describe('Choice step', () => {
    const goToChoiceStep = () => {
      fireEvent.click(screen.getByRole('button', { name: /begin/i }));
    };

    it('shows two options', () => {
      render(<OnboardingFlow />);
      goToChoiceStep();

      expect(screen.getByText(/start with baseline experiment/i)).toBeInTheDocument();
      expect(screen.getByText(/design my own experiment/i)).toBeInTheDocument();
    });

    it('describes the seed experiment', () => {
      render(<OnboardingFlow />);
      goToChoiceStep();

      expect(screen.getByText(/7-day creative samadhi/i)).toBeInTheDocument();
      expect(screen.getByText(/bleed-through of positive feeling/i)).toBeInTheDocument();
    });

    it('calls markOnboarded and createExperiment for seed option', async () => {
      const mockMarkOnboarded = vi.fn().mockResolvedValue(undefined);
      const mockCreateExperiment = vi.fn().mockResolvedValue(mockExperiment);
      mockUseData.mockReturnValue(
        createMockDataContext({
          markOnboarded: mockMarkOnboarded,
          createExperiment: mockCreateExperiment,
        })
      );

      render(<OnboardingFlow />);
      goToChoiceStep();

      fireEvent.click(screen.getByText(/start with baseline experiment/i));

      await waitFor(() => {
        expect(mockMarkOnboarded).toHaveBeenCalled();
        expect(mockCreateExperiment).toHaveBeenCalled();
      });
    });

    it('calls only markOnboarded for design own option', async () => {
      const mockMarkOnboarded = vi.fn().mockResolvedValue(undefined);
      const mockCreateExperiment = vi.fn().mockResolvedValue(mockExperiment);
      mockUseData.mockReturnValue(
        createMockDataContext({
          markOnboarded: mockMarkOnboarded,
          createExperiment: mockCreateExperiment,
        })
      );

      render(<OnboardingFlow />);
      goToChoiceStep();

      fireEvent.click(screen.getByText(/design my own experiment/i));

      await waitFor(() => {
        expect(mockMarkOnboarded).toHaveBeenCalled();
        expect(mockCreateExperiment).not.toHaveBeenCalled();
      });
    });

    it('shows creating state while processing', async () => {
      const mockMarkOnboarded = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      mockUseData.mockReturnValue(
        createMockDataContext({ markOnboarded: mockMarkOnboarded })
      );

      render(<OnboardingFlow />);
      goToChoiceStep();

      fireEvent.click(screen.getByText(/design my own experiment/i));

      expect(screen.getByText('Setting up...')).toBeInTheDocument();
    });

    it('shows error and returns to choice on failure', async () => {
      const mockMarkOnboarded = vi.fn().mockRejectedValue(new Error('Network error'));
      mockUseData.mockReturnValue(
        createMockDataContext({ markOnboarded: mockMarkOnboarded })
      );

      render(<OnboardingFlow />);
      goToChoiceStep();

      fireEvent.click(screen.getByText(/design my own experiment/i));

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
        expect(screen.getByText('How would you like to start?')).toBeInTheDocument();
      });
    });
  });
});
