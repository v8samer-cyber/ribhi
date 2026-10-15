import { Trophy } from 'lucide-react';

export default function Leaderboard() {
  return (
    <div className="min-h-screen bg-loot-black pb-24">
      <div className="mx-auto max-w-md px-4 pt-6">
        <h1 className="mb-6 font-display text-2xl font-bold text-white">Leaderboard</h1>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-loot-border bg-loot-card/50 px-6 py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-loot-orange/10">
            <Trophy className="h-8 w-8 text-loot-orange" />
          </div>
          <h2 className="font-display text-xl font-bold text-white">No data yet</h2>
          <p className="mt-2 max-w-xs text-sm text-gray-400">
            The leaderboard will appear here once users start earning.
          </p>
        </div>
      </div>
    </div>
  );
}
