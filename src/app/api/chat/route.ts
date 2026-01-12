import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const anthropic = new Anthropic();

interface LogEntry {
  date: string;
  type: string;
  ratings: Record<string, number>;
  notes: string | null;
  sitDuration: number | null;
}

interface PastExperiment {
  title: string;
  hypothesis: string;
  status: string;
  duration: number;
  conclusion: string | null;
}

interface ResearchContext {
  activeExperiment: {
    title: string;
    hypothesis: string;
    protocol: string;
    metrics: Array<{ id: string; name: string; description?: string }>;
    durationDays: number;
    currentDay: number;
  } | null;
  recentLogs: LogEntry[];
  pastExperiments: PastExperiment[];
}

function formatLogs(logs: LogEntry[]): string {
  if (logs.length === 0) return 'No logs yet.';

  // Group by date
  const byDate = new Map<string, LogEntry[]>();
  for (const log of logs) {
    const existing = byDate.get(log.date) || [];
    existing.push(log);
    byDate.set(log.date, existing);
  }

  const sortedDates = Array.from(byDate.keys()).sort().reverse();
  const lines: string[] = [];

  for (const date of sortedDates.slice(0, 7)) {
    lines.push(`--- ${date} ---`);
    const dayLogs = byDate.get(date) || [];
    for (const log of dayLogs) {
      const typeLabel =
        log.type === 'before_sit'
          ? 'Before Sit'
          : log.type === 'after_sit'
          ? 'After Sit'
          : 'EOD';
      lines.push(`[${typeLabel}]`);
      if (log.sitDuration) {
        lines.push(`Duration: ${log.sitDuration} min`);
      }
      const ratings = Object.entries(log.ratings)
        .map(([k, v]) => `${k}: ${v}/7`)
        .join(', ');
      if (ratings) {
        lines.push(`Ratings: ${ratings}`);
      }
      if (log.notes) {
        lines.push(`Notes: ${log.notes}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

function formatPastExperiments(experiments: PastExperiment[]): string {
  if (experiments.length === 0) return 'No past experiments.';

  return experiments
    .map((e) => {
      let str = `**${e.title}** (${e.duration} days, ${e.status})`;
      str += `\nHypothesis: ${e.hypothesis}`;
      if (e.conclusion) {
        str += `\nConclusion: ${e.conclusion}`;
      }
      return str;
    })
    .join('\n\n');
}

function buildSystemPrompt(context: ResearchContext): string {
  const today = new Date().toISOString().split('T')[0];

  let prompt = `You are a contemplative research partner. You help users investigate their inner life with scientific curiosity and rigor.

## Your Role

You are a collaborator, not a teacher. You help users:
- Design experiments that test real hypotheses about their practice
- Notice patterns in their data they might miss
- Ask good questions about what they're observing
- Maintain scientific honesty — null results are data too
- Connect findings to broader contemplative traditions when relevant

## Your Style

- Curious and engaged, never judgmental
- Ask questions that sharpen their inquiry
- Point out patterns: "Your clarity scores are 2 points higher after morning sits vs evening"
- Celebrate good methodology, not just good outcomes
- Honest about uncertainty — "We'd need more data to know if that's a pattern"
- Grounded in the data they've collected
- Concise — this is a conversation, not a lecture

## Today

Today is ${today}.

`;

  if (context.activeExperiment) {
    const exp = context.activeExperiment;
    prompt += `## Current Experiment

**Title:** ${exp.title}
**Hypothesis:** ${exp.hypothesis}
**Protocol:** ${exp.protocol}
**Metrics:** ${exp.metrics.map((m) => m.name).join(', ')}
**Progress:** Day ${exp.currentDay} of ${exp.durationDays}

`;
  } else {
    prompt += `## Current Experiment

No active experiment. The user may want help designing one.

`;
  }

  prompt += `## Recent Logs

${formatLogs(context.recentLogs)}

`;

  if (context.pastExperiments.length > 0) {
    prompt += `## Past Experiments

${formatPastExperiments(context.pastExperiments)}

`;
  }

  prompt += `## Guidelines

- Ground conversations in their actual data
- If they haven't logged today, note it without judgment
- Help them see patterns across time
- When they're struggling, help them adjust the experiment rather than abandoning it
- The goal is insight, not achievement
- If they ask about their hypothesis, evaluate it honestly based on the data
`;

  return prompt;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, context } = await request.json();

    const systemPrompt = buildSystemPrompt(context);

    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    // Create a streaming response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
