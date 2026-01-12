// Core types for Hridaya - Contemplative Research Platform

// Metric definition for an experiment
export interface MetricDefinition {
  id: string;
  name: string;
  description?: string;
  scale: [number, number]; // e.g., [1, 7]
}

// Experiment status
export type ExperimentStatus = 'active' | 'completed' | 'abandoned';

// Log entry types
export type LogEntryType = 'before_sit' | 'after_sit' | 'eod';

// Experiment (matches DB schema)
export interface Experiment {
  id: string;
  user_id: string;
  title: string;
  hypothesis: string;
  protocol: string;
  metrics: MetricDefinition[];
  duration_days: number;
  start_date: string; // ISO date string
  end_date: string; // computed
  status: ExperimentStatus;
  conclusion: string | null;
  created_at: string;
  updated_at: string;
}

// Log entry (matches DB schema)
export interface LogEntry {
  id: string;
  user_id: string;
  experiment_id: string;
  entry_type: LogEntryType;
  entry_date: string;
  ratings: Record<string, number>; // metric_id -> rating
  notes: string | null;
  sit_duration_minutes: number | null;
  technique_notes: string | null;
  created_at: string;
}

// Profile (minimal)
export interface Profile {
  id: string;
  onboarded_at: string | null;
  created_at: string;
  updated_at: string;
}

// Form data for creating experiment
export interface CreateExperimentInput {
  title: string;
  hypothesis: string;
  protocol: string;
  metrics: MetricDefinition[];
  duration_days: number;
  start_date: string;
}

// Form data for log entry
export interface CreateLogEntryInput {
  experiment_id: string;
  entry_type: LogEntryType;
  entry_date: string;
  ratings: Record<string, number>;
  notes?: string;
  sit_duration_minutes?: number;
  technique_notes?: string;
}

// Chart data point for visualization
export interface ChartDataPoint {
  date: string;
  [metricId: string]: number | string;
}

// Progress info for active experiment
export interface ExperimentProgress {
  daysCompleted: number;
  daysRemaining: number;
  progress: number; // 0-1
  currentDay: number;
}

// Display names for log entry types
export const LOG_TYPE_LABELS: Record<LogEntryType, string> = {
  before_sit: 'Before Sit',
  after_sit: 'After Sit',
  eod: 'End of Day',
};

// Default metrics for seed experiment
export const DEFAULT_METRICS: MetricDefinition[] = [
  {
    id: 'bleed_through',
    name: 'Bleed-through',
    description: 'How much did the quality from practice persist/color your day?',
    scale: [1, 7],
  },
  {
    id: 'state',
    name: 'State',
    description: 'General sense of well-being',
    scale: [1, 7],
  },
];

// Seed experiment definition
export const SEED_EXPERIMENT: Omit<CreateExperimentInput, 'start_date'> = {
  title: 'Creative Samadhi — Baseline',
  hypothesis:
    'Daily 60-min creative samadhi practice will increase bleed-through of positive feeling into my day.',
  protocol:
    'Morning sit, 60 min. Generate and savor positive feeling — metta, gratitude, or ambient bliss. Follow what\'s alive.',
  metrics: DEFAULT_METRICS,
  duration_days: 7,
};
