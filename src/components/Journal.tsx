'use client';

import { useData } from '@/lib/data-context';
import { LOG_TYPE_LABELS, type LogEntry } from '@/lib/types';

interface JournalProps {
  onBack: () => void;
}

export function Journal({ onBack }: JournalProps) {
  const { recentLogs, experiments } = useData();

  // Group logs by date
  const logsByDate = recentLogs.reduce((acc, log) => {
    const date = log.entry_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {} as Record<string, LogEntry[]>);

  const sortedDates = Object.keys(logsByDate).sort().reverse();

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      {/* Header */}
      <header className="p-4 border-b border-stone-200 bg-white">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <button
            onClick={onBack}
            className="text-stone-600 hover:text-stone-800"
          >
            ← Back
          </button>
          <h1 className="text-lg font-light text-stone-800">Journal</h1>
          <div className="w-12" /> {/* Spacer for centering */}
        </div>
      </header>

      <main className="flex-1 p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Past Experiments Summary */}
          {experiments.filter((e) => e.status !== 'active').length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm text-stone-500 uppercase tracking-wide">
                Past Experiments
              </h2>
              <div className="space-y-2">
                {experiments
                  .filter((e) => e.status !== 'active')
                  .map((exp) => (
                    <div
                      key={exp.id}
                      className="bg-white p-4 rounded-lg border border-stone-100"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-stone-800">{exp.title}</p>
                          <p className="text-sm text-stone-500">
                            {exp.duration_days} days • {exp.status}
                          </p>
                        </div>
                        <span className="text-xs text-stone-400">
                          {exp.start_date}
                        </span>
                      </div>
                      {exp.conclusion && (
                        <p className="text-sm text-stone-600 mt-2 border-t border-stone-100 pt-2">
                          {exp.conclusion}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Log Entries */}
          <div className="space-y-4">
            <h2 className="text-sm text-stone-500 uppercase tracking-wide">
              Log History ({recentLogs.length})
            </h2>

            {sortedDates.length === 0 ? (
              <p className="text-stone-500 text-center py-8">
                No logs yet. Start logging to see your journal.
              </p>
            ) : (
              <div className="space-y-6">
                {sortedDates.map((date) => (
                  <div key={date} className="space-y-2">
                    <h3 className="text-sm font-medium text-stone-600">
                      {formatDate(date)}
                    </h3>
                    <div className="space-y-2">
                      {logsByDate[date].map((log) => (
                        <LogCard key={log.id} log={log} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function LogCard({ log }: { log: LogEntry }) {
  const ratingEntries = Object.entries(log.ratings);

  return (
    <div className="bg-white p-4 rounded-lg border border-stone-100 space-y-2">
      <div className="flex justify-between items-start">
        <span className="text-xs px-2 py-0.5 bg-stone-100 rounded text-stone-600">
          {LOG_TYPE_LABELS[log.entry_type]}
        </span>
        {ratingEntries.length > 0 && (
          <div className="flex gap-3">
            {ratingEntries.map(([key, value]) => (
              <span
                key={key}
                className="text-sm text-stone-600"
                title={key}
              >
                <span className="text-stone-400">{formatMetricName(key)}:</span>{' '}
                <span className="font-medium">{value}/7</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {log.sit_duration_minutes && (
        <p className="text-xs text-stone-400">
          {log.sit_duration_minutes} min sit
        </p>
      )}

      {log.technique_notes && (
        <p className="text-sm text-stone-500 italic">{log.technique_notes}</p>
      )}

      {log.notes && (
        <p className="text-stone-700 whitespace-pre-line">{log.notes}</p>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatMetricName(id: string): string {
  return id
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
