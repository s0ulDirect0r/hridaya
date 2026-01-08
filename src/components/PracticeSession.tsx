'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { getRandomPractice, aspirations, dedications } from '@/lib/practices';
import { formatNode } from '@/lib/types';
import type { Practice } from '@/lib/types';

type SessionStep = 'aspiration' | 'practice' | 'reflection' | 'dedication' | 'complete';
type TimerState = 'idle' | 'running' | 'complete';

export function PracticeSession() {
  const [step, setStep] = useState<SessionStep>('aspiration');
  const [practice, setPractice] = useState<Practice | null>(null);
  const [reflection, setReflection] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  // Timer state
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  const currentNode = useStore((state) => state.currentNode);
  const streak = useStore((state) => state.streak);
  const recordSession = useStore((state) => state.recordSession);

  // Pick a random practice and aspiration/dedication on mount
  const [aspiration] = useState(() => aspirations[Math.floor(Math.random() * aspirations.length)]);
  const [dedication] = useState(() => dedications[Math.floor(Math.random() * dedications.length)]);

  useEffect(() => {
    const p = getRandomPractice(currentNode);
    setPractice(p);
    if (p && p.reflectionPrompts.length > 0) {
      setSelectedPrompt(p.reflectionPrompts[Math.floor(Math.random() * p.reflectionPrompts.length)]);
    }
    if (p && p.duration) {
      setSecondsRemaining(p.duration * 60);
    }
  }, [currentNode]);

  // Timer countdown
  useEffect(() => {
    if (timerState !== 'running') return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setTimerState('complete');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerState]);

  const startTimer = useCallback(() => {
    if (practice?.duration) {
      setSecondsRemaining(practice.duration * 60);
      setTimerState('running');
    }
  }, [practice]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleComplete = () => {
    if (practice && reflection.trim()) {
      recordSession({
        date: new Date().toISOString().split('T')[0],
        practiceId: practice.id,
        reflection: reflection.trim(),
      });
      setStep('complete');
    }
  };

  // No practice available for this node
  if (!practice && step !== 'complete') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-8">
        <div className="max-w-xl text-center space-y-4">
          <h2 className="text-xl text-stone-800">No practices available yet</h2>
          <p className="text-stone-600">
            Practices for {formatNode(currentNode)} are still being curated.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      {/* Header */}
      <header className="p-4 border-b border-stone-200 bg-white">
        <div className="max-w-xl mx-auto flex justify-between items-center">
          <h1 className="text-lg font-light text-stone-800">Hridaya</h1>
          <div className="text-sm text-stone-600">
            {streak > 0 && <span>🔥 {streak} day streak</span>}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-xl w-full">
          {/* Step: Aspiration */}
          {step === 'aspiration' && (
            <div className="bg-white p-8 rounded-lg shadow-sm space-y-6">
              <div className="text-center space-y-2">
                <p className="text-sm text-stone-500 uppercase tracking-wide">Opening</p>
                <h2 className="text-xl text-stone-800">Bodhicitta Aspiration</h2>
              </div>

              <blockquote className="text-stone-700 leading-relaxed whitespace-pre-line text-center italic">
                {aspiration.text}
              </blockquote>

              <p className="text-center text-stone-500 text-sm">— {aspiration.source}</p>

              <p className="text-stone-600 text-center">
                Speak these words, and feel how they land in your system. What does this evoke? Contemplate this aspiration, and proceed when you are ready.
              </p>

              <button
                onClick={() => setStep('practice')}
                className="w-full py-3 bg-stone-800 text-stone-50 rounded hover:bg-stone-700 transition-colors"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step: Practice */}
          {step === 'practice' && practice && (
            <div className="bg-white p-8 rounded-lg shadow-sm space-y-6">
              <div className="text-center space-y-2">
                <p className="text-sm text-stone-500 uppercase tracking-wide">Practice</p>
                <h2 className="text-xl text-stone-800">{practice.title}</h2>
                <p className="text-sm text-stone-500">
                  {formatNode(currentNode)} • {practice.tradition}
                  {practice.duration && ` • ${practice.duration} min`}
                </p>
              </div>

              {/* Timer for formal practices */}
              {practice.duration && (
                <div className="flex flex-col items-center space-y-4 py-4 border-y border-stone-100">
                  <div className="text-4xl font-light text-stone-800 tabular-nums">
                    {formatTime(secondsRemaining)}
                  </div>

                  {timerState === 'idle' && (
                    <button
                      onClick={startTimer}
                      className="px-6 py-2 bg-stone-200 text-stone-800 rounded hover:bg-stone-300 transition-colors"
                    >
                      Start Timer
                    </button>
                  )}

                  {timerState === 'running' && (
                    <p className="text-sm text-stone-500">Practice in progress...</p>
                  )}

                  {timerState === 'complete' && (
                    <p className="text-sm text-stone-600">Time complete</p>
                  )}
                </div>
              )}

              <div className="text-stone-700 leading-relaxed whitespace-pre-line">
                {practice.instructions}
              </div>

              <button
                onClick={() => setStep('reflection')}
                disabled={practice.duration ? timerState !== 'complete' : false}
                className="w-full py-3 bg-stone-800 text-stone-50 rounded hover:bg-stone-700 transition-colors disabled:bg-stone-300 disabled:cursor-not-allowed"
              >
                {!practice.duration
                  ? 'Continue to Reflection'
                  : timerState === 'complete'
                  ? 'Continue to Reflection'
                  : 'Complete the practice first'}
              </button>
            </div>
          )}

          {/* Step: Reflection */}
          {step === 'reflection' && (
            <div className="bg-white p-8 rounded-lg shadow-sm space-y-6">
              <div className="text-center space-y-2">
                <p className="text-sm text-stone-500 uppercase tracking-wide">Reflection</p>
                <h2 className="text-xl text-stone-800">What arose?</h2>
              </div>

              {selectedPrompt && (
                <p className="text-stone-600 text-center italic">{selectedPrompt}</p>
              )}

              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="Write your reflection..."
                className="w-full h-40 p-4 border border-stone-200 rounded resize-none focus:outline-none focus:ring-2 focus:ring-stone-400 text-stone-800"
              />

              <button
                onClick={() => setStep('dedication')}
                disabled={!reflection.trim()}
                className="w-full py-3 bg-stone-800 text-stone-50 rounded hover:bg-stone-700 transition-colors disabled:bg-stone-300 disabled:cursor-not-allowed"
              >
                Continue to Dedication
              </button>
            </div>
          )}

          {/* Step: Dedication */}
          {step === 'dedication' && (
            <div className="bg-white p-8 rounded-lg shadow-sm space-y-6">
              <div className="text-center space-y-2">
                <p className="text-sm text-stone-500 uppercase tracking-wide">Closing</p>
                <h2 className="text-xl text-stone-800">Dedication of Merit</h2>
              </div>

              <blockquote className="text-stone-700 leading-relaxed whitespace-pre-line text-center italic">
                {dedication.text}
              </blockquote>

              <p className="text-center text-stone-500 text-sm">— {dedication.source}</p>

              <p className="text-stone-600 text-center">
                Offer the merit of this practice to all beings.
              </p>

              <button
                onClick={handleComplete}
                className="w-full py-3 bg-stone-800 text-stone-50 rounded hover:bg-stone-700 transition-colors"
              >
                Complete Session
              </button>
            </div>
          )}

          {/* Step: Complete */}
          {step === 'complete' && (
            <div className="bg-white p-8 rounded-lg shadow-sm space-y-6 text-center">
              <h2 className="text-xl text-stone-800">Session Complete</h2>

              <p className="text-stone-600">
                You practiced today. That matters.
              </p>

              <div className="text-stone-500">
                Current streak: {streak} day{streak !== 1 ? 's' : ''}
              </div>

              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-stone-200 text-stone-800 rounded hover:bg-stone-300 transition-colors"
              >
                Return
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
