'use client';

import { useState } from 'react';
import { useData } from '@/lib/data-context';

export function VowFlow() {
  const [vow, setVowText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const { setVow } = useData();

  const handleSubmit = async () => {
    if (vow.trim()) {
      setSaving(true);
      await setVow(vow.trim());
      setSubmitted(true);
      setSaving(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-8">
        <div className="max-w-xl text-center space-y-6">
          <h1 className="text-2xl font-light text-stone-800">Your vow is recorded.</h1>
          <p className="text-stone-600">
            When you struggle, when you slip, this vow will be here to remind you why you practice.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-8 px-6 py-3 bg-stone-800 text-stone-50 rounded hover:bg-stone-700 transition-colors"
          >
            Begin Practice
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-8">
      <div className="max-w-xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-light text-stone-800">Hridaya</h1>
          <p className="text-stone-600">The heart as ground. The aspiration as path.</p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-sm space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl text-stone-800">Before you begin</h2>
            <p className="text-stone-600 leading-relaxed">
              This practice exists in service of all beings. Before you enter, articulate your aspiration:
            </p>
            <ul className="text-stone-600 space-y-2 ml-4">
              <li>• Why are you here?</li>
              <li>• What are you committing to?</li>
              <li>• For whose benefit do you practice?</li>
            </ul>
          </div>

          <div className="space-y-4">
            <label htmlFor="vow" className="block text-stone-700">
              Your vow:
            </label>
            <textarea
              id="vow"
              value={vow}
              onChange={(e) => setVowText(e.target.value)}
              placeholder="Write your aspiration here..."
              className="w-full h-40 p-4 border border-stone-200 rounded resize-none focus:outline-none focus:ring-2 focus:ring-stone-400 text-stone-800"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!vow.trim() || saving}
            className="w-full py-3 bg-stone-800 text-stone-50 rounded hover:bg-stone-700 transition-colors disabled:bg-stone-300 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'I commit to this practice'}
          </button>
        </div>

        <p className="text-center text-stone-500 text-sm">
          This is serious. We are not fucking around.
        </p>
      </div>
    </div>
  );
}
