'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';

export function Auth() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (mode === 'signin') {
      const { error } = await signIn(email, password);
      if (error) {
        setError(formatError(error.message));
      }
    } else {
      const { error } = await signUp(email, password);
      if (error) {
        setError(formatError(error.message));
      } else {
        setSuccess('Check your email to confirm your account, then sign in.');
        setMode('signin');
      }
    }
    setLoading(false);
  };

  // Make Supabase error messages more user-friendly
  const formatError = (message: string): string => {
    if (message.includes('Invalid login credentials')) {
      return 'Invalid email or password. Please try again.';
    }
    if (message.includes('Email not confirmed')) {
      return 'Please check your email and click the confirmation link first.';
    }
    if (message.includes('User already registered')) {
      return 'An account with this email already exists. Try signing in.';
    }
    if (message.includes('Password should be at least')) {
      return 'Password must be at least 6 characters.';
    }
    if (message.includes('invalid')) {
      return 'Please check your email address and try again.';
    }
    return message;
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
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-stone-800 text-stone-50 rounded hover:bg-stone-700 transition-colors disabled:bg-stone-400"
          >
            {loading
              ? mode === 'signin'
                ? 'Signing in...'
                : 'Creating account...'
              : mode === 'signin'
              ? 'Sign In'
              : 'Sign Up'}
          </button>

          <p className="text-center text-sm text-stone-500">
            {mode === 'signin' ? (
              <>
                No account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                    setSuccess(null);
                  }}
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
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                    setSuccess(null);
                  }}
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
