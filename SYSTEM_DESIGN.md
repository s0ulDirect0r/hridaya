# System Design

Technical architecture and design decisions for Hridaya.

## Overview

Hridaya is a single-page application built with Next.js 16, using Supabase for auth and data persistence, and Claude API for AI-assisted reflection. The app follows a "contemplative lab notebook" metaphor where users run structured experiments on their meditation practice.

## Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   page.tsx                           │    │
│  │              (View Orchestrator)                     │    │
│  │                                                      │    │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐         │    │
│  │   │Dashboard │  │CreateExp │  │ LogForm  │  ...    │    │
│  │   └────┬─────┘  └────┬─────┘  └────┬─────┘         │    │
│  │        │             │             │                │    │
│  │        └─────────────┴─────────────┘                │    │
│  │                      │                              │    │
│  │              ┌───────┴───────┐                      │    │
│  │              │  DataContext  │                      │    │
│  │              │  AuthContext  │                      │    │
│  │              └───────┬───────┘                      │    │
│  └──────────────────────┼──────────────────────────────┘    │
│                         │                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          │                               │
          ▼                               ▼
   ┌─────────────┐                ┌─────────────┐
   │  Supabase   │                │  /api/chat  │
   │  Auth + DB  │                │  (Claude)   │
   └─────────────┘                └─────────────┘
```

### View Orchestration

The app uses state-driven view switching instead of client-side routing. A single `view` state in `page.tsx` determines which component renders:

```typescript
type View = 'dashboard' | 'create-experiment' | 'log' | 'journal' | 'chat';
```

Navigation happens by calling `setView('target')`. This keeps the app simple and avoids URL management complexity.

**View Hierarchy:**
```
Not authenticated → Auth
Authenticated, not onboarded → OnboardingFlow
Authenticated, onboarded → view state:
  'dashboard' → Dashboard
  'create-experiment' → CreateExperiment
  'log' → LogForm
  'journal' → Journal
  'chat' → Chat
```

### Context Architecture

Two React contexts provide all shared state:

**AuthContext** (`src/lib/auth.tsx`)
- Wraps Supabase auth
- Provides: `user`, `session`, `loading`, `signIn`, `signUp`, `signOut`
- Listens to auth state changes

**DataContext** (`src/lib/data-context.tsx`)
- All application data and actions
- Loads on mount when user is authenticated
- Provides:
  - State: `profile`, `activeExperiment`, `experiments`, `recentLogs`, `todayLogs`
  - Computed: `isFirstTime`, `hasActiveExperiment`, `experimentProgress`
  - Actions: `markOnboarded`, `createExperiment`, `createLogEntry`, `completeExperiment`, `abandonExperiment`, `refresh`

**Why contexts instead of a state library?**
- App is simple enough that React Context suffices
- No need for complex state normalization
- Actions are thin wrappers around Supabase calls
- Computed values derived at load time, not on every render

## Data Model

### Entity Relationships

```
Profile (1) ←──────── (N) Experiment
                           │
                           │
                           └── (N) LogEntry
```

Each user has one profile, many experiments, and many log entries (scoped to experiments).

### Experiment Lifecycle

```
                    ┌─────────┐
                    │ created │
                    └────┬────┘
                         │
                         ▼
                    ┌─────────┐
            ┌───────│ active  │───────┐
            │       └────┬────┘       │
            │            │            │
            ▼            │            ▼
      ┌───────────┐      │     ┌───────────┐
      │ abandoned │      │     │ completed │
      └───────────┘      │     └───────────┘
                         │
                    (daily logs)
```

- Only one experiment can be `active` at a time
- `completed` requires a conclusion (what did you learn?)
- `abandoned` is for experiments stopped early

### Log Entry Types

Three entry types capture different moments:

| Type | When | Purpose |
|------|------|---------|
| `before_sit` | Before meditation | Baseline state |
| `after_sit` | After meditation | Immediate effect |
| `eod` | End of day | Bleed-through, integration |

Each entry captures:
- Ratings for all experiment metrics (e.g., `{bleed_through: 5, state: 6}`)
- Optional notes
- Optional sit duration and technique notes (for sit entries)

### Metrics System

Experiments define custom metrics:

```typescript
interface MetricDefinition {
  id: string;           // e.g., "bleed_through"
  name: string;         // e.g., "Bleed-through"
  description?: string; // e.g., "How much did the quality persist?"
  scale: [number, number]; // e.g., [1, 7]
}
```

This allows experiments to track anything quantifiable. The seed experiment uses:
- **Bleed-through** (1-7): How much did practice color the day?
- **State** (1-7): General well-being

## Database Schema

### Tables

```sql
-- User profile (minimal)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  onboarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Experiments
CREATE TABLE experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  hypothesis TEXT NOT NULL,
  protocol TEXT NOT NULL,
  metrics JSONB NOT NULL,              -- Array of MetricDefinition
  duration_days INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE GENERATED ALWAYS AS (start_date + duration_days - 1) STORED,
  status TEXT NOT NULL DEFAULT 'active',
  conclusion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log entries
CREATE TABLE log_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  experiment_id UUID REFERENCES experiments(id) NOT NULL,
  entry_type TEXT NOT NULL,            -- 'before_sit' | 'after_sit' | 'eod'
  entry_date DATE NOT NULL,
  ratings JSONB NOT NULL,              -- {metric_id: number}
  notes TEXT,
  sit_duration_minutes INTEGER,
  technique_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes

```sql
CREATE INDEX idx_experiments_user_status ON experiments(user_id, status);
CREATE INDEX idx_log_entries_experiment_date ON log_entries(experiment_id, entry_date);
CREATE INDEX idx_log_entries_user_date ON log_entries(user_id, entry_date);
```

### Row-Level Security

All tables use RLS policies that enforce `auth.uid() = user_id`:

```sql
-- Example policy
CREATE POLICY "Users can only access own experiments"
  ON experiments FOR ALL
  USING (auth.uid() = user_id);
```

This ensures data isolation at the database level.

## API Design

### Chat Endpoint (`/api/chat`)

**Request:**
```typescript
POST /api/chat
{
  messages: Array<{role: 'user' | 'assistant', content: string}>,
  context: {
    activeExperiment: Experiment | null,
    recentLogs: LogEntry[],
    pastExperiments: Experiment[]
  }
}
```

**Response:** Server-sent events (streaming)

**System Prompt Construction:**
1. Role definition (contemplative research partner)
2. Today's date
3. Active experiment details (if any)
4. Recent logs formatted by day
5. Past experiment summaries

The prompt emphasizes:
- Pattern recognition in data
- Scientific honesty
- Asking good questions
- Concise responses

## Component Design

### Dashboard

The main hub. Shows:
- Active experiment card (title, hypothesis, progress bar, day X of Y)
- Today's completed logs
- Navigation buttons

**State dependencies:**
- `activeExperiment` from DataContext
- `todayLogs` from DataContext
- `experimentProgress` computed value

### CreateExperiment

Multi-step wizard:
1. **Basics**: Title, hypothesis
2. **Protocol**: What you'll practice, when
3. **Metrics**: Define 1-3 custom metrics with scales
4. **Duration**: How many days
5. **Review**: Confirm and create

Uses local state for form data, commits to DataContext on final step.

### LogForm

Dynamic form based on entry type:
- Rating sliders for each metric (rendered from experiment.metrics)
- Notes textarea
- Sit duration (for sit entries only)
- Technique notes (optional)

**Smart defaults:** Pre-selects next logical entry type based on what's already logged today.

### ExperimentChart

Recharts-based visualization:
- Line chart with date on X-axis, ratings on Y-axis
- Multiple lines for multiple metrics
- Filters: All | Before Sit | After Sit | EOD
- Aggregation toggle: Each entry vs. Daily average

Data transformation handled by `chart-utils.ts`.

### Chat

Simple chat interface:
- Message history
- Input textarea
- Streaming response display
- Builds context from DataContext on each message

## Data Flow Examples

### Creating a Log Entry

```
User fills LogForm
       │
       ▼
LogForm calls dataContext.createLogEntry(input)
       │
       ▼
DataContext calls data.createLogEntry(userId, input)
       │
       ▼
Supabase INSERT into log_entries
       │
       ▼
DataContext refreshes: fetchTodayLogs, fetchRecentLogs
       │
       ▼
UI updates via context state change
```

### Loading Active Experiment Data

```
User authenticates
       │
       ▼
DataProvider useEffect triggers
       │
       ▼
Parallel fetches:
  - fetchProfile(userId)
  - fetchActiveExperiment(userId)
  - fetchExperiments(userId)
  - fetchRecentLogs(userId, 50)
       │
       ▼
If activeExperiment exists:
  - fetchTodayLogs(experimentId)
  - compute experimentProgress
       │
       ▼
State populated, loading = false
       │
       ▼
page.tsx renders appropriate view
```

## Testing Strategy

### Unit Tests

- **chart-utils.ts**: Pure functions, easy to test with various log configurations
- **data.ts**: Query layer (mocked Supabase client)

### Component Tests

- **Dashboard**: Renders experiment card, handles navigation
- **CreateExperiment**: Multi-step flow, validation, submission
- **LogForm**: Rating inputs, entry type switching, form submission
- **ExperimentChart**: Data transformation, filter behavior
- **OnboardingFlow**: Flow completion, seed experiment option

### Test Setup

```typescript
// test/setup.ts
- Mock Supabase client
- Mock auth context
- Custom render with providers

// test/test-utils.tsx
- renderWithProviders helper
- Mock data factories
```

## Performance Considerations

### Data Loading

- All data loaded on auth, cached in context
- No pagination needed (personal app, limited data volume)
- Refresh triggered explicitly after mutations

### Chart Rendering

- Data transformation memoized in component
- Filter changes don't re-fetch, just re-filter cached data
- Recharts handles SVG rendering efficiently

### Chat Streaming

- Server-sent events for real-time feel
- No message persistence (conversations are ephemeral)
- Context rebuilt fresh each conversation

## Security

### Authentication

- Supabase Auth handles all auth flows
- Session stored in browser, refreshed automatically
- No custom auth logic

### Authorization

- RLS policies on all tables
- Every query filtered by `auth.uid()`
- No server-side auth checks needed (Supabase handles it)

### API Security

- `/api/chat` doesn't persist anything
- Anthropic API key server-side only
- No user data sent to external services except Claude (for chat)

## Future Considerations

### Not in MVP

- Multiple concurrent experiments
- Voice/video logging
- Export/sharing
- Mobile app (responsive web is sufficient)
- Fancy analytics beyond line charts

### Potential Additions

- Tagging system for notes
- Correlations dashboard (sleep vs. bleed-through)
- Longer-term arc tracking across experiments
- Calendar integration
