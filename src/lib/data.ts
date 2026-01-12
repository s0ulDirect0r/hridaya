import { supabase } from './supabase';
import type {
  Profile,
  Experiment,
  LogEntry,
  CreateExperimentInput,
  CreateLogEntryInput,
  ExperimentProgress,
  ChartDataPoint,
  MetricDefinition,
} from './types';

// ============================================================================
// Profile
// ============================================================================

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

export async function markOnboarded(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      onboarded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Error marking onboarded:', error);
    throw error;
  }
}

// ============================================================================
// Experiments
// ============================================================================

export async function fetchExperiments(userId: string): Promise<Experiment[]> {
  const { data, error } = await supabase
    .from('experiments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching experiments:', error);
    return [];
  }
  return data || [];
}

export async function fetchActiveExperiment(userId: string): Promise<Experiment | null> {
  const { data, error } = await supabase
    .from('experiments')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - that's fine, no active experiment
      return null;
    }
    console.error('Error fetching active experiment:', error);
    return null;
  }
  return data;
}

export async function createExperiment(
  userId: string,
  input: CreateExperimentInput
): Promise<Experiment> {
  const { data, error } = await supabase
    .from('experiments')
    .insert({
      user_id: userId,
      title: input.title,
      hypothesis: input.hypothesis,
      protocol: input.protocol,
      metrics: input.metrics,
      duration_days: input.duration_days,
      start_date: input.start_date,
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating experiment:', error);
    throw error;
  }
  return data;
}

export async function completeExperiment(
  experimentId: string,
  conclusion: string
): Promise<void> {
  const { error } = await supabase
    .from('experiments')
    .update({
      status: 'completed',
      conclusion,
      updated_at: new Date().toISOString(),
    })
    .eq('id', experimentId);

  if (error) {
    console.error('Error completing experiment:', error);
    throw error;
  }
}

export async function abandonExperiment(experimentId: string): Promise<void> {
  const { error } = await supabase
    .from('experiments')
    .update({
      status: 'abandoned',
      updated_at: new Date().toISOString(),
    })
    .eq('id', experimentId);

  if (error) {
    console.error('Error abandoning experiment:', error);
    throw error;
  }
}

// ============================================================================
// Log Entries
// ============================================================================

export async function fetchLogEntries(
  experimentId: string,
  options?: { limit?: number; since?: string }
): Promise<LogEntry[]> {
  let query = supabase
    .from('log_entries')
    .select('*')
    .eq('experiment_id', experimentId)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (options?.since) {
    query = query.gte('entry_date', options.since);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching log entries:', error);
    return [];
  }
  return data || [];
}

export async function fetchRecentLogs(
  userId: string,
  limit: number = 20
): Promise<LogEntry[]> {
  const { data, error } = await supabase
    .from('log_entries')
    .select('*')
    .eq('user_id', userId)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent logs:', error);
    return [];
  }
  return data || [];
}

export async function createLogEntry(
  userId: string,
  input: CreateLogEntryInput
): Promise<LogEntry> {
  const { data, error } = await supabase
    .from('log_entries')
    .insert({
      user_id: userId,
      experiment_id: input.experiment_id,
      entry_type: input.entry_type,
      entry_date: input.entry_date,
      ratings: input.ratings,
      notes: input.notes || null,
      sit_duration_minutes: input.sit_duration_minutes || null,
      technique_notes: input.technique_notes || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating log entry:', error);
    throw error;
  }
  return data;
}

export async function fetchTodayLogs(
  experimentId: string,
  date: string
): Promise<LogEntry[]> {
  const { data, error } = await supabase
    .from('log_entries')
    .select('*')
    .eq('experiment_id', experimentId)
    .eq('entry_date', date)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching today logs:', error);
    return [];
  }
  return data || [];
}

// ============================================================================
// Computed Helpers
// ============================================================================

export function getExperimentProgress(experiment: Experiment): ExperimentProgress {
  // Parse date string as local time (not UTC) by splitting components
  const [year, month, day] = experiment.start_date.split('-').map(Number);
  const startDate = new Date(year, month - 1, day); // month is 0-indexed

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / msPerDay);

  // Current day is 1-indexed (Day 1, Day 2, etc.)
  const currentDay = Math.min(Math.max(daysSinceStart + 1, 1), experiment.duration_days);
  const daysCompleted = Math.min(Math.max(daysSinceStart, 0), experiment.duration_days);
  const daysRemaining = Math.max(experiment.duration_days - daysCompleted, 0);
  const progress = Math.min(daysCompleted / experiment.duration_days, 1);

  return {
    currentDay,
    daysCompleted,
    daysRemaining,
    progress,
  };
}

export function getChartData(
  logs: LogEntry[],
  metrics: MetricDefinition[]
): ChartDataPoint[] {
  // Group logs by date
  const byDate = new Map<string, LogEntry[]>();
  for (const log of logs) {
    const existing = byDate.get(log.entry_date) || [];
    existing.push(log);
    byDate.set(log.entry_date, existing);
  }

  // Sort dates
  const sortedDates = Array.from(byDate.keys()).sort();

  // Build chart data points
  return sortedDates.map((date) => {
    const dayLogs = byDate.get(date) || [];
    const point: ChartDataPoint = { date };

    // For each metric, average across all logs that day
    for (const metric of metrics) {
      const values = dayLogs
        .map((log) => log.ratings[metric.id])
        .filter((v) => v !== undefined && v !== null);

      if (values.length > 0) {
        point[metric.id] = values.reduce((a, b) => a + b, 0) / values.length;
      }
    }

    return point;
  });
}

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}
