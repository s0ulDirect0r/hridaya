# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hridaya is a meditation practice app built on the four brahmaviharas (metta, karuna, mudita, upekkha). Users progress through each brahmavihara by practicing with different objects (self → benefactor → friend → neutral → difficult → all beings).

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build (strict TypeScript)
npm run lint     # ESLint
```

No test runner is configured.

## Tech Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4 (PostCSS plugin)
- Supabase (auth + PostgreSQL with RLS)
- Client-side only — no server components or API routes

## Architecture

### View Orchestration (src/app/page.tsx)

Single-page app with state-driven view switching:
```
Auth → VowFlow (first-time) → MissedDayInquiry → Dashboard ↔ PracticeSession ↔ Journal
```

The `view` state controls which component renders. No client-side routing.

### Context Pattern

Two React Contexts provide all shared state:

- **AuthContext** (`src/lib/auth.tsx`): User session, sign-in/up/out
- **DataContext** (`src/lib/data-context.tsx`): User profile, journal entries, actions (recordSession, recordMissedDay, passReadinessGate)

Both wrap the app in `src/app/providers.tsx`.

### Domain Model (src/lib/types.ts)

- **Brahmavihara**: 'metta' | 'karuna' | 'mudita' | 'upekkha'
- **PracticeObject**: 'self' | 'benefactor' | 'friend' | 'neutral' | 'difficult' | 'all'
- **Practice**: Has type ('formal' | 'micro'), instructions, reflection prompts
- **Node ID format**: `"{brahmavihara}-{object}"` (e.g., "metta-self")

### Supabase Schema

**profiles**: id, vow, streak, last_practice_date, {brahmavihara}_stage columns, updated_at

**journal**: id, user_id, entry_type ('session' | 'missed_day' | 'readiness_gate'), entry_date, data (JSONB), created_at

Query layer in `src/lib/data.ts`. RLS policies enforce user isolation.

### Practice Data

All practice content is hardcoded in `src/lib/practices.ts`. The `PRACTICES` constant maps node IDs to practice arrays.

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Key Patterns

- All components use `'use client'` directive
- Styling is inline Tailwind (no CSS modules)
- Path alias: `@/*` → `src/*`
- Error handling: try/catch with console.error, graceful UI fallbacks
