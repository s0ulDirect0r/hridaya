'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useData } from '@/lib/data-context';
import { getPracticesForNode } from '@/lib/practices';
import {
  BRAHMAVIHARAS_ORDER,
  nodeId,
  type Brahmavihara,
  type PracticeObject,
} from '@/lib/types';

const OBJECT_LABELS: Record<PracticeObject, string> = {
  self: 'Self',
  benefactor: 'Benefactor',
  friend: 'Dear Friend',
  neutral: 'Neutral Person',
  difficult: 'Difficult Person',
  all: 'All Beings',
};

interface DashboardProps {
  onStartPractice: (practiceId: string) => void;
  onViewJournal: () => void;
}

const BRAHMAVIHARA_INFO: Record<Brahmavihara, { name: string; sanskrit: string; description: string }> = {
  metta: {
    name: 'Loving-kindness',
    sanskrit: 'Mettā',
    description: 'The wish for all beings to be happy',
  },
  karuna: {
    name: 'Compassion',
    sanskrit: 'Karuṇā',
    description: 'The wish for all beings to be free from suffering',
  },
  mudita: {
    name: 'Sympathetic Joy',
    sanskrit: 'Muditā',
    description: 'Rejoicing in the happiness of others',
  },
  upekkha: {
    name: 'Equanimity',
    sanskrit: 'Upekkhā',
    description: 'Balanced acceptance of all beings equally',
  },
};

export function Dashboard({ onStartPractice, onViewJournal }: DashboardProps) {
  const [selectedBrahmavihara, setSelectedBrahmavihara] = useState<Brahmavihara | null>(null);

  const { signOut } = useAuth();
  const { profile, sessions, getStage } = useData();

  const streak = profile?.streak ?? 0;
  const vow = profile?.vow;

  // Get practices for the current object in a brahmavihara
  const getAvailablePractices = (brahmavihara: Brahmavihara) => {
    const currentObject = getStage(brahmavihara);
    return getPracticesForNode(nodeId(brahmavihara, currentObject));
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      {/* Header */}
      <header className="p-4 border-b border-stone-200 bg-white">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <h1 className="text-lg font-light text-stone-800">Hridaya</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={onViewJournal}
              className="text-sm text-stone-600 hover:text-stone-800"
            >
              Journal ({sessions.length})
            </button>
            {streak > 0 && (
              <span className="text-sm text-stone-600">🔥 {streak} day{streak !== 1 ? 's' : ''}</span>
            )}
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
          {/* Brahmaviharas grid */}
          <div className="grid grid-cols-2 gap-4">
            {BRAHMAVIHARAS_ORDER.map((brahmavihara) => {
              const info = BRAHMAVIHARA_INFO[brahmavihara];
              const isSelected = selectedBrahmavihara === brahmavihara;
              const currentObject = getStage(brahmavihara);
              const practiceCount = getAvailablePractices(brahmavihara).length;

              return (
                <button
                  key={brahmavihara}
                  onClick={() => setSelectedBrahmavihara(isSelected ? null : brahmavihara)}
                  className={`p-6 rounded-lg text-left transition-all ${
                    isSelected
                      ? 'bg-stone-800 text-stone-50'
                      : 'bg-white hover:bg-stone-100 text-stone-800'
                  }`}
                >
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide opacity-70">{info.sanskrit}</p>
                    <h3 className="font-medium">{info.name}</h3>
                    <p className="text-sm opacity-70">{info.description}</p>
                    <p className="text-xs mt-2 opacity-50">
                      {OBJECT_LABELS[currentObject]} • {practiceCount} practice{practiceCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Practice selection */}
          {selectedBrahmavihara && (
            <div className="bg-white p-6 rounded-lg space-y-4">
              <h3 className="text-lg text-stone-800">
                Available Practices — {BRAHMAVIHARA_INFO[selectedBrahmavihara].name}
              </h3>

              <div className="space-y-2">
                {getAvailablePractices(selectedBrahmavihara).map((practice) => (
                  <button
                    key={practice.id}
                    onClick={() => onStartPractice(practice.id)}
                    className="w-full p-4 text-left bg-stone-50 hover:bg-stone-100 rounded transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-stone-800 font-medium">{practice.title}</p>
                        <p className="text-sm text-stone-500">
                          {practice.type === 'formal' ? `${practice.duration} min` : 'Micro-practice'} • {practice.tradition}
                        </p>
                      </div>
                      <span className="text-stone-400">→</span>
                    </div>
                  </button>
                ))}

                {getAvailablePractices(selectedBrahmavihara).length === 0 && (
                  <p className="text-stone-500 text-center py-4">
                    No practices available yet for this stage.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Vow reminder */}
          {vow && (
            <div className="text-center">
              <button
                onClick={() => {/* Could expand to show full vow */}}
                className="text-sm text-stone-400 hover:text-stone-600"
              >
                Remember your vow
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
