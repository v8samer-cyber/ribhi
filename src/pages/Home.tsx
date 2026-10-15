import { Rocket } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import Logo from '@/components/Logo';

export default function Home() {
  const { navigate } = useApp();

  return (
    <div className="min-h-screen bg-loot-black">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-loot-orange/20 blur-[120px]" />
        <div className="absolute bottom-20 left-1/2 h-60 w-60 -translate-x-1/2 rounded-full bg-loot-orange/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-6">
        {/* Top buttons */}
        <div className="flex items-center justify-between pt-8">
          <Logo size="sm" />
          <div className="flex gap-2">
            <button
              onClick={() => navigate('signin')}
              className="rounded-full px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('signup')}
              className="rounded-full border border-loot-orange bg-loot-orange px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-loot-orange-dark hover:shadow-lg hover:shadow-loot-orange/30"
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Hero */}
        <div className="flex flex-1 flex-col justify-center py-12">
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
            Earn Money While Having Fun{' '}
            <span className="text-loot-orange">Test Apps &amp; Games Now!</span>
          </h1>

          <p className="mt-5 text-base leading-relaxed text-gray-400">
            Earn money fast by completing simple tasks, testing apps, and playing games.
          </p>

          <button
            onClick={() => navigate('signup')}
            className="mt-8 w-full rounded-2xl bg-loot-orange py-4 text-center text-lg font-bold text-white transition-all hover:bg-loot-orange-dark hover:shadow-xl hover:shadow-loot-orange/30 active:scale-[0.98]"
          >
            Start Earning Now
          </button>

          {/* Stat card */}
          <div className="mt-8 flex items-center gap-3 rounded-2xl border border-loot-border bg-loot-card px-5 py-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-loot-orange/15">
              <Rocket className="h-5 w-5 text-loot-orange" />
            </div>
            <div>
              <p className="font-display text-lg font-bold text-white">
                13m 4s
              </p>
              <p className="text-xs text-gray-400">Average time until first cashout</p>
            </div>
          </div>
        </div>

        <p className="pb-8 text-center text-xs text-gray-600">
          By continuing you agree to our Terms &amp; Privacy Policy
        </p>
        <p className="pb-6 text-center text-xs text-gray-700">
          &copy; 2026 EarnFast. All rights reserved.
        </p>
      </div>
    </div>
  );
}
