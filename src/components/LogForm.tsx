'use client';

import { useState } from 'react';
import { useData } from '@/lib/data-context';
import { getTodayDateString } from '@/lib/data';
import type { LogEntryType, MetricDefinition } from '@/lib/types';
import { LOG_TYPE_LABELS } from '@/lib/types';

interface LogFormProps {
  onComplete: () => void;
  onCancel: () => void;
}

const ENTRY_TYPES: LogEntryType[] = ['before_sit', 'after_sit', 'eod'];

export function LogForm({ onComplete, onCancel }: LogFormProps) {
  const { activeExperiment, createLogEntry, todayLogs } = useData();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [entryType, setEntryType] = useState<LogEntryType>(() => {
    // Default to the next logical entry type based on today's logs
    const loggedTypes = new Set(todayLogs.map((l) => l.entry_type));
    if (!loggedTypes.has('before_sit')) return 'before_sit';
    if (!loggedTypes.has('after_sit')) return 'after_sit';
    if (!loggedTypes.has('eod')) return 'eod';
    return 'after_sit'; // Default if all done
  });
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [sitDuration, setSitDuration] = useState<number | undefined>(undefined);
  const [techniqueNotes, setTechniqueNotes] = useState('');

  if (!activeExperiment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-stone-500">No active experiment</div>
      </div>
    );
  }

  const metrics = activeExperiment.metrics as MetricDefinition[];

  const updateRating = (metricId: string, value: number) => {
    setRatings((prev) => ({ ...prev, [metricId]: value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);

    try {
      await createLogEntry({
        entry_type: entryType,
        entry_date: getTodayDateString(),
        ratings,
        notes: notes.trim() || undefined,
        sit_duration_minutes:
          entryType !== 'eod' ? sitDuration : undefined,
        technique_notes:
          entryType !== 'eod' && techniqueNotes.trim()
            ? techniqueNotes.trim()
            : undefined,
      });
      onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save log');
      setSaving(false);
    }
  };

  const isSitEntry = entryType === 'before_sit' || entryType === 'after_sit';

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      {/* Header */}
      <header className="p-4 border-b border-stone-200 bg-white">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <h1 className="text-lg font-light text-stone-800">New Log Entry</h1>
          <button
            onClick={onCancel}
            className="text-sm text-stone-400 hover:text-stone-600"
          >
            Cancel
          </button>
        </div>
      </header>

      <main className="flex-1 p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Entry type selector */}
          <div className="flex gap-2">
            {ENTRY_TYPES.map((type) => {
              const alreadyLogged = todayLogs.some((l) => l.entry_type === type);
              return (
                <button
                  key={type}
                  onClick={() => setEntryType(type)}
                  className={`flex-1 py-3 rounded transition-colors ${
                    entryType === type
                      ? 'bg-stone-800 text-white'
                      : 'bg-white text-stone-700 hover:bg-stone-100'
                  } ${alreadyLogged ? 'opacity-50' : ''}`}
                >
                  <span className="text-sm">{LOG_TYPE_LABELS[type]}</span>
                  {alreadyLogged && (
                    <span className="text-xs block opacity-70">logged</span>
                  )}
                </button>
              );
            })}
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded">
              {error}
            </div>
          )}

          <div className="bg-white p-6 rounded-lg space-y-6">
            {/* Sit-specific fields */}
            {isSitEntry && (
              <div className="space-y-4 pb-4 border-b border-stone-100">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Sit Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={sitDuration || ''}
                    onChange={(e) =>
                      setSitDuration(
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                    placeholder="e.g., 30"
                    className="w-32 p-2 border border-stone-200 rounded focus:outline-none focus:ring-2 focus:ring-stone-500"
                  />
                </div>

                {entryType === 'after_sit' && (
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Technique Notes
                    </label>
                    <textarea
                      value={techniqueNotes}
                      onChange={(e) => setTechniqueNotes(e.target.value)}
                      placeholder="What technique did you use? Any adjustments?"
                      rows={2}
                      className="w-full p-3 border border-stone-200 rounded focus:outline-none focus:ring-2 focus:ring-stone-500 resize-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Metric ratings */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-stone-700">Ratings</h3>
              {metrics.map((metric) => (
                <div key={metric.id} className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <label className="text-sm text-stone-700">{metric.name}</label>
                    <span className="text-sm text-stone-500">
                      {ratings[metric.id] || '–'}/7
                    </span>
                  </div>
                  {metric.description && (
                    <p className="text-xs text-stone-400">{metric.description}</p>
                  )}
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5, 6, 7].map((value) => (
                      <button
                        key={value}
                        onClick={() => updateRating(metric.id, value)}
                        className={`flex-1 py-2 rounded text-sm transition-colors ${
                          ratings[metric.id] === value
                            ? 'bg-stone-800 text-white'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-stone-400">
                    <span>Not at all</span>
                    <span>Moderate</span>
                    <span>Strongly</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  entryType === 'before_sit'
                    ? 'Anything to note going in?'
                    : entryType === 'after_sit'
                    ? 'What did you notice during practice?'
                    : 'What did you notice? When did you feel it? When did you lose it?'
                }
                rows={4}
                className="w-full p-3 border border-stone-200 rounded focus:outline-none focus:ring-2 focus:ring-stone-500 resize-none"
              />
            </div>

            {/* EOD-specific context */}
            {entryType === 'eod' && (
              <div className="text-xs text-stone-400 space-y-1">
                <p>Consider noting:</p>
                <ul className="list-disc list-inside">
                  <li>Sleep quality and duration</li>
                  <li>Stress level</li>
                  <li>Notable events that may have affected your state</li>
                </ul>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full py-3 bg-stone-800 text-white rounded hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Save Log'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
