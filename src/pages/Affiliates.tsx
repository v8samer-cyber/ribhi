import { useState } from 'react';
import { Copy, Check, Users, Percent, Trophy } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function Affiliates() {
  const { user } = useApp();
  const [copied, setCopied] = useState(false);

  const refCode = user?.username?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'guest';
  const refLink = `https://earnfast.app/r/${refCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(refLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-loot-black pb-24">
      <div className="mx-auto max-w-md px-4 pt-6">
        <h1 className="mb-6 font-display text-2xl font-bold text-white">Affiliates</h1>

        {/* Commission card */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-loot-border bg-gradient-to-br from-loot-card to-loot-dark p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-loot-orange/15">
              <Percent className="h-6 w-6 text-loot-orange" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-white">10%</p>
              <p className="text-xs text-gray-400">Commission on referrals</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-gray-400">
            Earn 10% of everything your referrals make — for life. Share your link and start building passive income.
          </p>
        </div>

        {/* Referral link */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-300">Your Referral Link</label>
          <div className="flex items-center gap-2 rounded-xl border border-loot-border bg-loot-card p-2">
            <div className="flex-1 truncate px-2 text-sm text-gray-400">{refLink}</div>
            <button
              onClick={copyLink}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all active:scale-95 ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-loot-orange text-white hover:bg-loot-orange-dark'
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats (empty) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-loot-border bg-loot-card p-4 text-center">
            <Users className="mx-auto mb-2 h-6 w-6 text-gray-600" />
            <p className="font-display text-xl font-bold text-white">0</p>
            <p className="text-xs text-gray-500">Referrals</p>
          </div>
          <div className="rounded-xl border border-loot-border bg-loot-card p-4 text-center">
            <Trophy className="mx-auto mb-2 h-6 w-6 text-gray-600" />
            <p className="font-display text-xl font-bold text-white">0</p>
            <p className="text-xs text-gray-500">Cash earned</p>
          </div>
        </div>
      </div>
    </div>
  );
}
