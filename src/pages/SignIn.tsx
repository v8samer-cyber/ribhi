import { useState } from 'react';
import { Mail, Lock, ArrowLeft } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function SignIn() {
  const { navigate, login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email.');
      return;
    }
    login(email, password);
  };

  return (
    <div className="min-h-screen bg-loot-black">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-loot-orange/15 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-6">
        <button
          onClick={() => navigate('home')}
          className="mt-8 flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex flex-1 flex-col justify-center py-8">
          {/* Tabs */}
          <div className="mb-8 flex gap-1 rounded-xl bg-loot-card p-1">
            <button className="flex-1 rounded-lg bg-loot-orange py-2.5 text-sm font-semibold text-white">
              Login
            </button>
            <button
              onClick={() => navigate('signup')}
              className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-gray-400 transition-colors hover:text-white"
            >
              Create Account
            </button>
          </div>

          <h2 className="mb-6 font-display text-2xl font-bold text-white">Welcome back</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-loot-border bg-loot-card py-3 pl-11 pr-4 text-white placeholder-gray-600 outline-none transition-colors focus:border-loot-orange"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-loot-border bg-loot-card py-3 pl-11 pr-4 text-white placeholder-gray-600 outline-none transition-colors focus:border-loot-orange"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button type="button" className="text-sm text-loot-orange transition-colors hover:text-loot-orange-light">
                Forgot your password?
              </button>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              className="w-full rounded-xl bg-loot-orange py-3.5 font-bold text-white transition-all hover:bg-loot-orange-dark hover:shadow-lg hover:shadow-loot-orange/30 active:scale-[0.98]"
            >
              Login
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-loot-border" />
            <span className="text-xs font-medium text-gray-500">OR</span>
            <div className="h-px flex-1 bg-loot-border" />
          </div>

          <button
            onClick={() => login('guest@gmail.com', 'guest')}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-loot-border bg-white py-3.5 font-semibold text-gray-800 transition-all hover:bg-gray-100 active:scale-[0.98]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
}
