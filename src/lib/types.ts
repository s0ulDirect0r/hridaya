// Core types for Hridaya

export type Brahmavihara = 'metta' | 'karuna' | 'mudita' | 'upekkha';
export type PracticeObject = 'self' | 'benefactor' | 'friend' | 'neutral' | 'difficult' | 'all';
export type Tradition = 'theravada' | 'mahayana' | 'vajrayana' | 'nonsectarian';

export interface Practice {
  id: string;
  title: string;
  brahmavihara: Brahmavihara;
  object: PracticeObject;
  type: 'formal' | 'micro';
  tradition: Tradition;
  source?: string;
  duration?: number; // minutes, for formal practices
  instructions: string;
  reflectionPrompts: string[];
}

export interface PracticeSession {
  id: string;
  date: string; // ISO string
  practiceId: string;
  reflection: string;
}

export interface UserState {
  vow: string | null;
  currentNode: string; // Legacy, kept for compatibility
  completedNodes: string[];
  streak: number;
  lastPracticeDate: string | null; // ISO string
  sessions: PracticeSession[];
  missedDayReflections: Array<{ date: string; response: string }>;
  readinessGateResponses: Array<{ node: string; response: string; date: string }>;
  trackProgress: Record<string, string>; // brahmavihara → current object
}

// Node ID format: "{brahmavihara}-{object}" e.g., "metta-self", "karuna-benefactor"
export function nodeId(brahmavihara: Brahmavihara, object: PracticeObject): string {
  return `${brahmavihara}-${object}`;
}

// The progression order
export const OBJECTS_ORDER: PracticeObject[] = ['self', 'benefactor', 'friend', 'neutral', 'difficult', 'all'];
export const BRAHMAVIHARAS_ORDER: Brahmavihara[] = ['metta', 'karuna', 'mudita', 'upekkha'];

// Get next node in progression
export function getNextNode(current: string): string | null {
  const [brahmavihara, object] = current.split('-') as [Brahmavihara, PracticeObject];

  const objectIndex = OBJECTS_ORDER.indexOf(object);
  const brahmaviharaIndex = BRAHMAVIHARAS_ORDER.indexOf(brahmavihara);

  // If not at last object, move to next object
  if (objectIndex < OBJECTS_ORDER.length - 1) {
    return nodeId(brahmavihara, OBJECTS_ORDER[objectIndex + 1]);
  }

  // If at last object but not last brahmavihara, move to next brahmavihara
  if (brahmaviharaIndex < BRAHMAVIHARAS_ORDER.length - 1) {
    return nodeId(BRAHMAVIHARAS_ORDER[brahmaviharaIndex + 1], 'self');
  }

  // At the end of the path
  return null;
}

// Format node for display
export function formatNode(node: string): string {
  const [brahmavihara, object] = node.split('-');
  const brahmaviharaNames: Record<string, string> = {
    metta: 'Metta (Loving-kindness)',
    karuna: 'Karuna (Compassion)',
    mudita: 'Mudita (Sympathetic Joy)',
    upekkha: 'Upekkha (Equanimity)',
  };
  const objectNames: Record<string, string> = {
    self: 'Self',
    benefactor: 'Benefactor',
    friend: 'Dear Friend',
    neutral: 'Neutral Person',
    difficult: 'Difficult Person',
    all: 'All Beings',
  };
  return `${brahmaviharaNames[brahmavihara]} for ${objectNames[object]}`;
}
