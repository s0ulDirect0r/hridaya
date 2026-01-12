'use client';

import { useState } from 'react';
import { useData } from '@/lib/data-context';
import { SEED_EXPERIMENT } from '@/lib/types';
import { getTodayDateString } from '@/lib/data';

export function OnboardingFlow() {
  const [step, setStep] = useState<'welcome' | 'choice' | 'creating'>('welcome');
  const [error, setError] = useState<string | null>(null);

  const { markOnboarded, createExperiment } = useData();

  const handleStartWithSeed = async () => {
    setStep('creating');
    setError(null);
    try {
      await markOnboarded();
      await createExperiment({
        ...SEED_EXPERIMENT,
        start_date: getTodayDateString(),
      });
      // Context will refresh and isFirstTime will become false
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create experiment');
      setStep('choice');
    }
  };

  const handleStartFresh = async () => {
    setStep('creating');
    setError(null);
    try {
      await markOnboarded();
      // Don't create experiment — user goes to dashboard with no active experiment
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to complete onboarding');
      setStep('choice');
    }
  };

  if (step === 'creating') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-stone-400">Setting up...</div>
      </div>
    );
  }

  if (step === 'welcome') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-8">
        <div className="max-w-md space-y-8 text-center">
          <div className="space-y-4">
            <h1 className="text-2xl font-light text-stone-800">Hridaya</h1>
            <p className="text-stone-600">
              A contemplative research platform for studying your own unfolding.
            </p>
          </div>

          <div className="space-y-3 text-left text-stone-600 text-sm">
            <p>
              <strong>The core metaphor:</strong> You are a scientist running experiments
              on your inner life, with the discipline and rigor that implies.
            </p>
            <p>
              <strong>The aim:</strong> Cultivating bodhicitta — the awakened heart —
              with samadhi as a supporting condition.
            </p>
          </div>

          <button
            onClick={() => setStep('choice')}
            className="w-full py-3 bg-stone-800 text-white rounded hover:bg-stone-700 transition-colors"
          >
            Begin
          </button>
        </div>
      </div>
    );
  }

  // Choice step
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-8">
      <div className="max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-light text-stone-800">How would you like to start?</h2>
          <p className="text-stone-500 text-sm">
            You can always create new experiments later.
          </p>
        </div>

        {error && (
          <div className="text-sm text-red-600 text-center">{error}</div>
        )}

        <div className="space-y-4">
          {/* Seed experiment option */}
          <button
            onClick={handleStartWithSeed}
            className="w-full p-6 text-left bg-white hover:bg-stone-50 rounded-lg border border-stone-200 transition-colors"
          >
            <p className="font-medium text-stone-800">Start with baseline experiment</p>
            <p className="text-sm text-stone-500 mt-1">
              A 7-day Creative Samadhi experiment to establish your baseline.
            </p>
            <p className="text-xs text-stone-400 mt-2">
              Hypothesis: Daily 60-min creative samadhi practice will increase
              bleed-through of positive feeling into your day.
            </p>
          </button>

          {/* Fresh start option */}
          <button
            onClick={handleStartFresh}
            className="w-full p-6 text-left bg-white hover:bg-stone-50 rounded-lg border border-stone-200 transition-colors"
          >
            <p className="font-medium text-stone-800">Design my own experiment</p>
            <p className="text-sm text-stone-500 mt-1">
              Start with a blank slate and create your first experiment from scratch.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
