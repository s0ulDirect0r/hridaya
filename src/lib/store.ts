import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserState, PracticeSession, getNextNode } from './types';

interface HridayaStore extends UserState {
  // Actions
  setVow: (vow: string) => void;
  recordSession: (session: Omit<PracticeSession, 'id'>) => void;
  recordMissedDay: (response: string) => void;
  passReadinessGate: (node: string, response: string) => void;
  advanceToNextNode: () => void;

  // Computed helpers
  hasVow: () => boolean;
  isFirstTime: () => boolean;
  needsMissedDayInquiry: () => boolean;
  canAdvance: () => boolean;
  daysAtCurrentNode: () => number;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export const useStore = create<HridayaStore>()(
  persist(
    (set, get) => ({
      // Initial state
      vow: null,
      currentNode: 'metta-self',
      completedNodes: [],
      streak: 0,
      lastPracticeDate: null,
      sessions: [],
      missedDayReflections: [],
      readinessGateResponses: [],

      // Actions
      setVow: (vow) => set({ vow }),

      recordSession: (session) => {
        const today = getToday();
        const { lastPracticeDate, streak } = get();

        let newStreak = 1;
        if (lastPracticeDate) {
          const daysSince = daysBetween(lastPracticeDate, today);
          if (daysSince === 0) {
            // Same day, keep streak
            newStreak = streak;
          } else if (daysSince === 1) {
            // Consecutive day, increment
            newStreak = streak + 1;
          }
          // If more than 1 day, streak resets to 1
        }

        set((state) => ({
          sessions: [...state.sessions, { ...session, id: generateId() }],
          lastPracticeDate: today,
          streak: newStreak,
        }));
      },

      recordMissedDay: (response) => {
        set((state) => ({
          missedDayReflections: [
            ...state.missedDayReflections,
            { date: getToday(), response },
          ],
          streak: 0, // Reset streak
        }));
      },

      passReadinessGate: (node, response) => {
        set((state) => ({
          readinessGateResponses: [
            ...state.readinessGateResponses,
            { node, response, date: getToday() },
          ],
          completedNodes: [...state.completedNodes, node],
        }));
      },

      advanceToNextNode: () => {
        const { currentNode } = get();
        const next = getNextNode(currentNode);
        if (next) {
          set({ currentNode: next });
        }
      },

      // Computed helpers
      hasVow: () => get().vow !== null,

      isFirstTime: () => get().vow === null,

      needsMissedDayInquiry: () => {
        const { lastPracticeDate, missedDayReflections } = get();
        if (!lastPracticeDate) return false;

        const today = getToday();
        const daysSince = daysBetween(lastPracticeDate, today);

        if (daysSince <= 1) return false;

        // Check if we already reflected on this gap
        const lastReflection = missedDayReflections[missedDayReflections.length - 1];
        if (lastReflection && lastReflection.date === today) return false;

        return true;
      },

      canAdvance: () => {
        const { streak, currentNode, completedNodes } = get();
        // Need active streak and minimum 7 days at node
        // For simplicity, we check if they've been practicing consistently
        // A more sophisticated check would look at actual days at this node
        return streak >= 7 && !completedNodes.includes(currentNode);
      },

      daysAtCurrentNode: () => {
        const { sessions, currentNode } = get();
        const nodeSessions = sessions.filter((s) => {
          // This is a simplification - in practice we'd need to track which node each session was for
          return true;
        });
        // Count unique days
        const days = new Set(nodeSessions.map((s) => s.date));
        return days.size;
      },
    }),
    {
      name: 'hridaya-storage',
    }
  )
);
