'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';

export function MissedDayInquiry() {
  const [response, setResponse] = useState('');
  const recordMissedDay = useStore((state) => state.recordMissedDay);
  const streak = useStore((state) => state.streak);

  const handleSubmit = () => {
    if (response.trim()) {
      recordMissedDay(response.trim());
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-8">
      <div className="max-w-xl w-full space-y-8">
        <div className="bg-white p-8 rounded-lg shadow-sm space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl text-stone-800">You didn&apos;t practice yesterday.</h2>

            {streak > 0 && (
              <p className="text-stone-600">
                Your streak of {streak} day{streak > 1 ? 's' : ''} has ended.
              </p>
            )}

            <p className="text-stone-600 leading-relaxed">
              Before continuing, reflect honestly:
            </p>

            <ul className="text-stone-600 space-y-2 ml-4">
              <li>• What arose?</li>
              <li>• What does this tell you about your commitment right now?</li>
              <li>• How would you like to proceed?</li>
            </ul>
          </div>

          <div className="space-y-4">
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Write your reflection..."
              className="w-full h-40 p-4 border border-stone-200 rounded resize-none focus:outline-none focus:ring-2 focus:ring-stone-400 text-stone-800"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!response.trim()}
            className="w-full py-3 bg-stone-800 text-stone-50 rounded hover:bg-stone-700 transition-colors disabled:bg-stone-300 disabled:cursor-not-allowed"
          >
            Continue to Practice
          </button>
        </div>

        <p className="text-center text-stone-500 text-sm">
          This isn&apos;t shame. It&apos;s an invitation to honesty.
        </p>
      </div>
    </div>
  );
}
