'use client';

import { useData } from '@/lib/data-context';
import { practices } from '@/lib/practices';

interface JournalProps {
  onBack: () => void;
}

export function Journal({ onBack }: JournalProps) {
  const { profile, sessions } = useData();
  const vow = profile?.vow;

  // Get practice title by ID
  const getPracticeTitle = (practiceId: string): string => {
    const practice = practices.find((p) => p.id === practiceId);
    return practice?.title ?? 'Practice';
  };

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
          {/* Vow */}
          {vow && (
            <div className="bg-white p-6 rounded-lg space-y-2">
              <h2 className="text-sm text-stone-500 uppercase tracking-wide">Your Vow</h2>
              <p className="text-stone-700 whitespace-pre-line">{vow}</p>
            </div>
          )}

          {/* Sessions */}
          <div className="space-y-4">
            <h2 className="text-sm text-stone-500 uppercase tracking-wide">
              Reflections ({sessions.length})
            </h2>

            {sessions.length === 0 ? (
              <p className="text-stone-500 text-center py-8">
                No reflections yet. Complete a practice to see your journal.
              </p>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="bg-white p-6 rounded-lg space-y-2">
                    <div className="flex justify-between items-start">
                      <p className="text-sm text-stone-500">{getPracticeTitle(session.practiceId)}</p>
                      <p className="text-sm text-stone-400">{session.date}</p>
                    </div>
                    <p className="text-stone-700 whitespace-pre-line">{session.reflection}</p>
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
