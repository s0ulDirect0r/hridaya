'use client';

import { useAuth } from '@/lib/auth';
import { useData } from '@/lib/data-context';
import { LOG_TYPE_LABELS, type LogEntry } from '@/lib/types';
import { ExperimentChart } from './ExperimentChart';

interface DashboardProps {
  onNewExperiment: () => void;
  onLog: () => void;
  onViewJournal: () => void;
  onChat: () => void;
}

export function Dashboard({
  onNewExperiment,
  onLog,
  onViewJournal,
  onChat,
}: DashboardProps) {
  const { signOut } = useAuth();
  const {
    activeExperiment,
    experimentProgress,
    todayLogs,
    recentLogs,
  } = useData();

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      {/* Header */}
      <header className="p-4 border-b border-stone-200 bg-white">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <h1 className="text-lg font-light text-stone-800">Hridaya</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={onChat}
              className="text-sm text-stone-600 hover:text-stone-800 font-medium"
            >
              Reflect
            </button>
            <button
              onClick={onViewJournal}
              className="text-sm text-stone-600 hover:text-stone-800"
            >
              Journal ({recentLogs.length})
            </button>
            <button
              onClick={() => signOut()}
              className="text-sm text-stone-400 hover:text-stone-600"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {activeExperiment && experimentProgress ? (
            <>
              {/* Active Experiment Card */}
              <div className="bg-white p-6 rounded-lg space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-stone-500">
                      Active Experiment
                    </p>
                    <h2 className="text-xl font-medium text-stone-800 mt-1">
                      {activeExperiment.title}
                    </h2>
                  </div>
                  <span className="text-sm text-stone-500">
                    Day {experimentProgress.currentDay} of{' '}
                    {activeExperiment.duration_days}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-stone-100 rounded-full h-2">
                  <div
                    className="bg-stone-800 h-2 rounded-full transition-all"
                    style={{ width: `${experimentProgress.progress * 100}%` }}
                  />
                </div>

                {/* Hypothesis */}
                <p className="text-stone-600 text-sm">
                  <span className="text-stone-400">Hypothesis: </span>
                  {activeExperiment.hypothesis}
                </p>

                {/* Today's logs */}
                <div className="pt-2 border-t border-stone-100">
                  <p className="text-xs text-stone-400 mb-2">Today</p>
                  {todayLogs.length > 0 ? (
                    <div className="flex gap-2">
                      {todayLogs.map((log) => (
                        <span
                          key={log.id}
                          className="text-xs px-2 py-1 bg-stone-100 rounded text-stone-600"
                        >
                          {LOG_TYPE_LABELS[log.entry_type]}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-stone-500">No logs yet today</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={onLog}
                    className="flex-1 py-3 bg-stone-800 text-white rounded hover:bg-stone-700 transition-colors"
                  >
                    Log Entry
                  </button>
                  <button
                    onClick={onChat}
                    className="px-4 py-3 bg-stone-100 text-stone-700 rounded hover:bg-stone-200 transition-colors"
                  >
                    Reflect with Claude
                  </button>
                </div>
              </div>

              {/* Metrics Chart */}
              {recentLogs.length > 0 && (
                <div className="bg-white p-6 rounded-lg">
                  <ExperimentChart
                    logs={recentLogs}
                    metrics={activeExperiment.metrics}
                    title="Metric Trends"
                  />
                </div>
              )}

              {/* Recent Logs Timeline */}
              {recentLogs.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-stone-600">
                    Recent Logs
                  </h3>
                  <div className="space-y-2">
                    {recentLogs.slice(0, 5).map((log) => (
                      <LogCard key={log.id} log={log} />
                    ))}
                    {recentLogs.length > 5 && (
                      <button
                        onClick={onViewJournal}
                        className="w-full text-center text-sm text-stone-500 hover:text-stone-700 py-2"
                      >
                        View all logs →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* No active experiment */
            <div className="bg-white p-8 rounded-lg text-center space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-medium text-stone-800">
                  No active experiment
                </h2>
                <p className="text-stone-500">
                  Ready to investigate your inner life?
                </p>
              </div>

              <button
                onClick={onNewExperiment}
                className="px-6 py-3 bg-stone-800 text-white rounded hover:bg-stone-700 transition-colors"
              >
                Start New Experiment
              </button>

              <p className="text-xs text-stone-400">
                Design a hypothesis, set your protocol, track your observations.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function LogCard({ log }: { log: LogEntry }) {
  // Format date for display
  const dateStr = new Date(log.entry_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  // Get rating values for display
  const ratingEntries = Object.entries(log.ratings);

  return (
    <div className="bg-white p-4 rounded-lg border border-stone-100">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 bg-stone-100 rounded text-stone-600">
              {LOG_TYPE_LABELS[log.entry_type]}
            </span>
            <span className="text-xs text-stone-400">{dateStr}</span>
          </div>
          {log.notes && (
            <p className="text-sm text-stone-600 line-clamp-2">{log.notes}</p>
          )}
        </div>
        {ratingEntries.length > 0 && (
          <div className="flex gap-2">
            {ratingEntries.map(([key, value]) => (
              <span
                key={key}
                className="text-sm font-medium text-stone-700"
                title={key}
              >
                {value}/7
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
