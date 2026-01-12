'use client';

import { useState, useRef, useEffect } from 'react';
import { useData } from '@/lib/data-context';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatProps {
  onBack: () => void;
}

export function Chat({ onBack }: ChatProps) {
  const { activeExperiment, experimentProgress, recentLogs, experiments } = useData();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const buildContext = () => {
    // Format recent logs for context
    const formattedLogs = recentLogs.slice(0, 20).map((log) => ({
      date: log.entry_date,
      type: log.entry_type,
      ratings: log.ratings,
      notes: log.notes,
      sitDuration: log.sit_duration_minutes,
    }));

    // Get past experiments (completed/abandoned)
    const pastExperiments = experiments
      .filter((e) => e.status !== 'active')
      .slice(0, 5)
      .map((e) => ({
        title: e.title,
        hypothesis: e.hypothesis,
        status: e.status,
        duration: e.duration_days,
        conclusion: e.conclusion,
      }));

    return {
      activeExperiment: activeExperiment
        ? {
            title: activeExperiment.title,
            hypothesis: activeExperiment.hypothesis,
            protocol: activeExperiment.protocol,
            metrics: activeExperiment.metrics,
            durationDays: activeExperiment.duration_days,
            currentDay: experimentProgress?.currentDay ?? 1,
          }
        : null,
      recentLogs: formattedLogs,
      pastExperiments,
    };
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          context: buildContext(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let assistantMessage = '';

      setMessages([...newMessages, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        assistantMessage += decoder.decode(value, { stream: true });
        setMessages([...newMessages, { role: 'assistant', content: assistantMessage }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'Something went wrong. Try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Prompt starters for users
  const promptStarters = [
    'What patterns are you noticing in my logs?',
    'How am I tracking against my hypothesis?',
    'What might I experiment with next?',
  ];

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-stone-200 flex items-center justify-between bg-white">
        <button
          onClick={onBack}
          className="text-stone-500 hover:text-stone-700 text-sm"
        >
          &larr; Back
        </button>
        <h1 className="text-lg font-medium text-stone-800">Reflect</h1>
        <div className="w-12" /> {/* Spacer for centering */}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center mt-8 space-y-6">
            <div className="text-stone-400">
              <p className="text-lg mb-2">Research partner ready.</p>
              <p className="text-sm">I&apos;ve seen your experiment and logs. How can I help?</p>
            </div>

            {/* Prompt starters */}
            <div className="flex flex-wrap justify-center gap-2">
              {promptStarters.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, i) => (
          <div
            key={i}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-stone-800 text-white'
                  : 'bg-white border border-stone-200 text-stone-800'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="bg-white border border-stone-200 rounded-2xl px-4 py-2">
              <p className="text-stone-400">...</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-stone-200 bg-white">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type here..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-stone-300 px-4 py-2 focus:outline-none focus:border-stone-500 text-stone-800"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-stone-800 text-white rounded-xl hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
