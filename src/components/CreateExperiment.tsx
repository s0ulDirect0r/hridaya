'use client';

import { useState } from 'react';
import { useData } from '@/lib/data-context';
import { getTodayDateString } from '@/lib/data';
import type { MetricDefinition, CreateExperimentInput } from '@/lib/types';

interface CreateExperimentProps {
  onComplete: () => void;
  onCancel: () => void;
}

type Step = 'basics' | 'protocol' | 'metrics' | 'duration' | 'review';

const DEFAULT_METRIC: MetricDefinition = {
  id: '',
  name: '',
  scale: [1, 7],
};

export function CreateExperiment({ onComplete, onCancel }: CreateExperimentProps) {
  const [step, setStep] = useState<Step>('basics');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [hypothesis, setHypothesis] = useState('');
  const [protocol, setProtocol] = useState('');
  const [metrics, setMetrics] = useState<MetricDefinition[]>([
    { id: 'state', name: 'State', description: 'General sense of well-being', scale: [1, 7] },
  ]);
  const [durationDays, setDurationDays] = useState(7);
  const [startDate, setStartDate] = useState(getTodayDateString());

  const { createExperiment } = useData();

  const addMetric = () => {
    const newId = `metric_${Date.now()}`;
    setMetrics([...metrics, { ...DEFAULT_METRIC, id: newId }]);
  };

  const updateMetric = (index: number, updates: Partial<MetricDefinition>) => {
    const updated = [...metrics];
    updated[index] = { ...updated[index], ...updates };
    // Generate ID from name if not set
    if (updates.name && !updated[index].id) {
      updated[index].id = updates.name.toLowerCase().replace(/\s+/g, '_');
    }
    setMetrics(updated);
  };

  const removeMetric = (index: number) => {
    if (metrics.length <= 1) return;
    setMetrics(metrics.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);

    // Validate metrics have IDs
    const validatedMetrics = metrics.map((m) => ({
      ...m,
      id: m.id || m.name.toLowerCase().replace(/\s+/g, '_'),
    }));

    const input: CreateExperimentInput = {
      title,
      hypothesis,
      protocol,
      metrics: validatedMetrics,
      duration_days: durationDays,
      start_date: startDate,
    };

    try {
      await createExperiment(input);
      onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create experiment');
      setSaving(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 'basics':
        return title.trim() && hypothesis.trim();
      case 'protocol':
        return protocol.trim();
      case 'metrics':
        return metrics.length > 0 && metrics.every((m) => m.name.trim());
      case 'duration':
        return durationDays > 0 && startDate;
      default:
        return true;
    }
  };

  const nextStep = () => {
    const steps: Step[] = ['basics', 'protocol', 'metrics', 'duration', 'review'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: Step[] = ['basics', 'protocol', 'metrics', 'duration', 'review'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      {/* Header */}
      <header className="p-4 border-b border-stone-200 bg-white">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <h1 className="text-lg font-light text-stone-800">New Experiment</h1>
          <button
            onClick={onCancel}
            className="text-sm text-stone-400 hover:text-stone-600"
          >
            Cancel
          </button>
        </div>
      </header>

      <main className="flex-1 p-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress indicator */}
          <div className="flex gap-2 mb-8">
            {(['basics', 'protocol', 'metrics', 'duration', 'review'] as Step[]).map(
              (s, i) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded ${
                    i <= ['basics', 'protocol', 'metrics', 'duration', 'review'].indexOf(step)
                      ? 'bg-stone-800'
                      : 'bg-stone-200'
                  }`}
                />
              )
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded">
              {error}
            </div>
          )}

          <div className="bg-white p-6 rounded-lg space-y-6">
            {step === 'basics' && (
              <>
                <div>
                  <h2 className="text-xl font-medium text-stone-800">
                    What are you investigating?
                  </h2>
                  <p className="text-stone-500 text-sm mt-1">
                    Name your experiment and state your hypothesis.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Experiment Name
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Morning Metta Baseline"
                      className="w-full p-3 border border-stone-200 rounded focus:outline-none focus:ring-2 focus:ring-stone-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Hypothesis
                    </label>
                    <textarea
                      value={hypothesis}
                      onChange={(e) => setHypothesis(e.target.value)}
                      placeholder="I suspect that [intervention] will support [outcome]..."
                      rows={3}
                      className="w-full p-3 border border-stone-200 rounded focus:outline-none focus:ring-2 focus:ring-stone-500 resize-none"
                    />
                  </div>
                </div>
              </>
            )}

            {step === 'protocol' && (
              <>
                <div>
                  <h2 className="text-xl font-medium text-stone-800">
                    What will you do?
                  </h2>
                  <p className="text-stone-500 text-sm mt-1">
                    Describe your daily practice in enough detail to follow consistently.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Protocol
                  </label>
                  <textarea
                    value={protocol}
                    onChange={(e) => setProtocol(e.target.value)}
                    placeholder="e.g., Morning sit, 30 min. Begin with breath awareness for 5 min, then..."
                    rows={6}
                    className="w-full p-3 border border-stone-200 rounded focus:outline-none focus:ring-2 focus:ring-stone-500 resize-none"
                  />
                </div>
              </>
            )}

            {step === 'metrics' && (
              <>
                <div>
                  <h2 className="text-xl font-medium text-stone-800">
                    What will you measure?
                  </h2>
                  <p className="text-stone-500 text-sm mt-1">
                    Define the metrics you&apos;ll rate on a 1-7 scale each day.
                  </p>
                </div>

                <div className="space-y-4">
                  {metrics.map((metric, index) => (
                    <div
                      key={index}
                      className="p-4 bg-stone-50 rounded-lg space-y-3"
                    >
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="block text-xs text-stone-500 mb-1">
                            Metric Name
                          </label>
                          <input
                            type="text"
                            value={metric.name}
                            onChange={(e) =>
                              updateMetric(index, { name: e.target.value })
                            }
                            placeholder="e.g., Bleed-through"
                            className="w-full p-2 border border-stone-200 rounded focus:outline-none focus:ring-2 focus:ring-stone-500"
                          />
                        </div>
                        {metrics.length > 1 && (
                          <button
                            onClick={() => removeMetric(index)}
                            className="self-end px-3 py-2 text-stone-400 hover:text-stone-600"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-stone-500 mb-1">
                          Description (optional)
                        </label>
                        <input
                          type="text"
                          value={metric.description || ''}
                          onChange={(e) =>
                            updateMetric(index, { description: e.target.value })
                          }
                          placeholder="What does this metric measure?"
                          className="w-full p-2 border border-stone-200 rounded focus:outline-none focus:ring-2 focus:ring-stone-500"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addMetric}
                    className="w-full p-3 border border-dashed border-stone-300 rounded text-stone-500 hover:border-stone-400 hover:text-stone-600 transition-colors"
                  >
                    + Add Metric
                  </button>
                </div>
              </>
            )}

            {step === 'duration' && (
              <>
                <div>
                  <h2 className="text-xl font-medium text-stone-800">
                    How long will you run it?
                  </h2>
                  <p className="text-stone-500 text-sm mt-1">
                    Set your experiment duration and start date.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Duration (days)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={durationDays}
                      onChange={(e) =>
                        setDurationDays(parseInt(e.target.value) || 1)
                      }
                      className="w-full p-3 border border-stone-200 rounded focus:outline-none focus:ring-2 focus:ring-stone-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full p-3 border border-stone-200 rounded focus:outline-none focus:ring-2 focus:ring-stone-500"
                    />
                  </div>
                </div>
              </>
            )}

            {step === 'review' && (
              <>
                <div>
                  <h2 className="text-xl font-medium text-stone-800">
                    Review Your Experiment
                  </h2>
                  <p className="text-stone-500 text-sm mt-1">
                    Make sure everything looks right before you begin.
                  </p>
                </div>

                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-stone-500">Name</p>
                    <p className="text-stone-800 font-medium">{title}</p>
                  </div>
                  <div>
                    <p className="text-stone-500">Hypothesis</p>
                    <p className="text-stone-800">{hypothesis}</p>
                  </div>
                  <div>
                    <p className="text-stone-500">Protocol</p>
                    <p className="text-stone-800 whitespace-pre-wrap">{protocol}</p>
                  </div>
                  <div>
                    <p className="text-stone-500">Metrics</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {metrics.map((m) => (
                        <span
                          key={m.id || m.name}
                          className="px-2 py-1 bg-stone-100 rounded text-stone-700"
                        >
                          {m.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-stone-500">Duration</p>
                    <p className="text-stone-800">
                      {durationDays} days, starting {startDate}
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Navigation */}
            <div className="flex gap-3 pt-4 border-t border-stone-100">
              {step !== 'basics' && (
                <button
                  onClick={prevStep}
                  className="px-4 py-2 text-stone-600 hover:text-stone-800"
                >
                  Back
                </button>
              )}
              <div className="flex-1" />
              {step !== 'review' ? (
                <button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="px-6 py-2 bg-stone-800 text-white rounded hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="px-6 py-2 bg-stone-800 text-white rounded hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Creating...' : 'Start Experiment'}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
