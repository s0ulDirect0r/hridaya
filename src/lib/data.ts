import { supabase } from './supabase';
import type { Brahmavihara, PracticeObject } from './types';

// Types matching our database schema
export interface Profile {
  id: string;
  vow: string | null;
  streak: number;
  last_practice_date: string | null;
  metta_stage: PracticeObject;
  karuna_stage: PracticeObject;
  mudita_stage: PracticeObject;
  upekkha_stage: PracticeObject;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  entry_type: 'session' | 'missed_day' | 'readiness_gate';
  entry_date: string;
  data: Record<string, unknown>;
  created_at: string;
}

// Fetch profile
export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data;
}

// Update profile
export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

// Set vow
export async function setVow(userId: string, vow: string) {
  await updateProfile(userId, { vow });
}

// Fetch journal entries
export async function fetchJournal(userId: string): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from('journal')
    .select('*')
    .eq('user_id', userId)
    .order('entry_date', { ascending: false });

  if (error) {
    console.error('Error fetching journal:', error);
    return [];
  }
  return data || [];
}

// Add journal entry
export async function addJournalEntry(
  userId: string,
  entryType: JournalEntry['entry_type'],
  entryDate: string,
  data: Record<string, unknown>
) {
  const { error } = await supabase
    .from('journal')
    .insert({
      user_id: userId,
      entry_type: entryType,
      entry_date: entryDate,
      data,
    });

  if (error) {
    console.error('Error adding journal entry:', error);
    throw error;
  }
}

// Record a practice session
export async function recordSession(
  userId: string,
  practiceId: string,
  reflection: string,
  currentProfile: Profile
) {
  const today = new Date().toISOString().split('T')[0];

  // Calculate new streak
  let newStreak = 1;
  if (currentProfile.last_practice_date) {
    const lastDate = new Date(currentProfile.last_practice_date);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      newStreak = currentProfile.streak; // Same day
    } else if (diffDays === 1) {
      newStreak = currentProfile.streak + 1; // Consecutive
    }
    // Otherwise resets to 1
  }

  // Add journal entry
  await addJournalEntry(userId, 'session', today, {
    practice_id: practiceId,
    reflection,
  });

  // Update profile
  await updateProfile(userId, {
    streak: newStreak,
    last_practice_date: today,
  });

  return newStreak;
}

// Record missed day reflection
export async function recordMissedDay(userId: string, response: string) {
  const today = new Date().toISOString().split('T')[0];

  await addJournalEntry(userId, 'missed_day', today, { response });
  await updateProfile(userId, { streak: 0 });
}

// Record readiness gate response and advance track
export async function passReadinessGate(
  userId: string,
  brahmavihara: Brahmavihara,
  response: string,
  currentStage: PracticeObject
) {
  const today = new Date().toISOString().split('T')[0];
  const stages: PracticeObject[] = ['self', 'benefactor', 'friend', 'neutral', 'difficult', 'all'];
  const currentIndex = stages.indexOf(currentStage);
  const nextStage = currentIndex < stages.length - 1 ? stages[currentIndex + 1] : currentStage;

  await addJournalEntry(userId, 'readiness_gate', today, {
    brahmavihara,
    from_stage: currentStage,
    to_stage: nextStage,
    response,
  });

  // Update the specific brahmavihara stage
  const stageKey = `${brahmavihara}_stage` as keyof Profile;
  await updateProfile(userId, { [stageKey]: nextStage } as Partial<Profile>);

  return nextStage;
}

// Check if user needs missed day inquiry
export function needsMissedDayInquiry(profile: Profile, journal: JournalEntry[]): boolean {
  if (!profile.last_practice_date) return false;

  const today = new Date().toISOString().split('T')[0];
  const lastDate = new Date(profile.last_practice_date);
  const todayDate = new Date(today);
  const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 1) return false;

  // Check if already reflected today
  const todayReflection = journal.find(
    (e) => e.entry_type === 'missed_day' && e.entry_date === today
  );
  return !todayReflection;
}

// Get current stage for a brahmavihara
export function getStage(profile: Profile, brahmavihara: Brahmavihara): PracticeObject {
  const key = `${brahmavihara}_stage` as keyof Profile;
  return (profile[key] as PracticeObject) || 'self';
}

// Get sessions from journal
export function getSessions(journal: JournalEntry[]) {
  return journal
    .filter((e) => e.entry_type === 'session')
    .map((e) => ({
      id: e.id,
      date: e.entry_date,
      practiceId: e.data.practice_id as string,
      reflection: e.data.reflection as string,
    }));
}
