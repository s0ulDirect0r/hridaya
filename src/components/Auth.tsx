'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';

export function Auth() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password);

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-light text-stone-800">Hridaya</h1>
          <p className="text-stone-500 mt-2">Cultivating the heart</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-sm space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm text-stone-600 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-stone-200 rounded focus:outline-none focus:ring-2 focus:ring-stone-400 text-stone-800"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-stone-600 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-stone-200 rounded focus:outline-none focus:ring-2 focus:ring-stone-400 text-stone-800"
              required
              minLength={6}
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-stone-800 text-stone-50 rounded hover:bg-stone-700 transition-colors disabled:bg-stone-400"
          >
            {loading ? '...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>

          <p className="text-center text-sm text-stone-500">
            {mode === 'signin' ? (
              <>
                No account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-stone-800 hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-stone-800 hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
