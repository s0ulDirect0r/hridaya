# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hridaya (Sanskrit: Heart) is a **personal contemplative research platform** — a lab notebook for running structured experiments on inner life. The user is a scientist studying their own unfolding, tracking practices, logging observations, and surfacing patterns over time.

**North Star:** Cultivation of **bodhicitta** (awakened heart/compassion), with **samadhi** (inner stability/well-being) as a supporting condition.

**Core Metaphor:** Contemplative Lab Notebook. The user is the researcher; AI is a research partner (not a coach).

### Design Principles

1. **The user is the researcher** — They articulate their own observations. The act of writing is part of the practice.
2. **AI is a research partner** — Available for pattern analysis and reflection, not central to daily use.
3. **Simplicity over features** — MVP mindset; iterate from real use.

## Commands

```bash
npm run dev       # Start dev server at localhost:3000
npm run build     # Production build (strict TypeScript)
npm run lint      # ESLint
npm run test:run  # Run tests (Vitest)
```

## Tech Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4 (PostCSS plugin)
- Supabase (auth + PostgreSQL with RLS)
- Anthropic Claude API (for agent chat)
- Recharts (visualization)
- Vitest + React Testing Library (94 tests, 85% component coverage)

## Architecture

### View Orchestration (src/app/page.tsx)

Single-page app with state-driven view switching:
```
Auth → OnboardingFlow (first-time) → Dashboard ↔ CreateExperiment ↔ LogForm ↔ Journal ↔ Chat
```

The `view` state controls which component renders. No client-side routing.

### Agent Chat (src/app/api/chat/route.ts)

The Chat component connects to Claude via `/api/chat`. The system prompt is constructed from:
- Active experiment (hypothesis, protocol, progress)
- Recent log entries (formatted with ratings and notes)
- Past experiments (for context)

Agent personality: contemplative research partner — curious, grounded in data, asks hard questions.

### Context Pattern

Two React Contexts provide all shared state:

- **AuthContext** (`src/lib/auth.tsx`): User session, sign-in/up/out
- **DataContext** (`src/lib/data-context.tsx`): Profile, experiments, log entries, computed values (isFirstTime, experimentProgress), actions (createExperiment, createLogEntry, completeExperiment, etc.)

Both wrap the app in `src/app/providers.tsx`.

### Domain Model (src/lib/types.ts)

**Experiment**: The main unit of work
- `title`, `hypothesis`, `protocol` (what to practice)
- `metrics`: Array of `{id, name, description?, scale}` — custom measurements
- `duration_days`, `start_date`, `end_date`
- `status`: 'active' | 'completed' | 'abandoned'
- `conclusion`: Written at experiment end

**LogEntry**: Timestamped data point within an experiment
- `entry_type`: 'before_sit' | 'after_sit' | 'eod'
- `ratings`: `{metric_id: number}` — values for each metric
- `notes`, `sit_duration_minutes`, `technique_notes`

**Profile**: Minimal user record
- `onboarded_at`: Null until onboarding complete

### Supabase Schema

**profiles**: `id`, `onboarded_at`, `created_at`, `updated_at`

**experiments**: `id`, `user_id`, `title`, `hypothesis`, `protocol`, `metrics` (JSONB), `duration_days`, `start_date`, `end_date` (generated), `status`, `conclusion`, timestamps

**log_entries**: `id`, `user_id`, `experiment_id`, `entry_type`, `entry_date`, `ratings` (JSONB), `notes`, `sit_duration_minutes`, `technique_notes`, `created_at`

Query layer in `src/lib/data.ts`. RLS policies enforce user isolation.

### Components

- **Dashboard**: Active experiment card, progress, today's logs, navigation
- **CreateExperiment**: Multi-step wizard (basics → protocol → metrics → duration → review)
- **LogForm**: Entry type selector, rating sliders for each metric, notes fields
- **Journal**: Past experiments with conclusions, log history grouped by date
- **ExperimentChart**: Recharts visualization with filtering (entry type) and aggregation (daily average)
- **Chat**: Streaming conversation with Claude as research partner

### Data Utilities

- `src/lib/chart-utils.ts`: `filterLogsByType`, `transformLogsToChartData`, `aggregateByDate`
- `src/lib/data.ts`: All Supabase queries + computed helpers (`getExperimentProgress`, `getTodayDateString`)

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
ANTHROPIC_API_KEY=...
```

## Key Patterns

- All components use `'use client'` directive
- Styling is inline Tailwind (stone/neutral palette, minimalist)
- Path alias: `@/*` → `src/*`
- Error handling: try/catch with console.error, graceful UI fallbacks
- Immediate feedback: No modals; navigation via `view` state change
- Supabase RLS: All data filtered by user at DB layer

## Seed Experiment

New users can start with a pre-configured experiment:
- **Title**: "Creative Samadhi — Baseline"
- **Hypothesis**: Daily 60-min creative samadhi will increase bleed-through of positive feeling
- **Metrics**: Bleed-through (1-7), State (1-7)
- **Duration**: 7 days
