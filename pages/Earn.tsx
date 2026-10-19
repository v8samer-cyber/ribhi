import { Gamepad2, Puzzle, TrendingUp, Clock, ExternalLink, Sparkles, Activity, Zap } from 'lucide-react';
import { useApp, type PostbackEntry } from '@/context/AppContext';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function Earn() {
  const { user, navigate, postbacks } = useApp();

  const userId = user ? encodeURIComponent(user.email) : '';
  const admavenUrl = `https://speedy-links.com/s?3ZM86kaX&user_id=${userId}`;
  const cpagripUrl = `https://getafilenow.com/1918411?sub_id_1=${userId}`;
const myleadUrl = `https://reward-me.eu/b1334694-c8d4-11f1-a264-8a5fb7be40ea?ml_sub1=${userId}`;
  const recentActivity = postbacks
    .filter((p) => p.user_id === user?.email && p.status === 'success')
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-loot-black pb-24">
      <div className="mx-auto max-w-md px-4 pt-6">
        {/* Balance card */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-loot-border bg-gradient-to-br from-loot-card to-loot-dark p-5">
          <p className="text-sm text-gray-400">Your Balance</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-white">{(user?.balance ?? 0).toLocaleString()}</span>
            <span className="text-sm text-gray-500">Cash</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <span>= {((user?.balance ?? 0) / 1000).toFixed(2)} USD</span>
          </div>
        </div>

        {/* More Ways to Earn */}
        <div className="mb-6">
          <h2 className="mb-4 font-display text-lg font-bold text-white">More Ways to Earn</h2>

          <div className="space-y-4">
            {/* CPAGrip card */}
            <div className="overflow-hidden rounded-2xl border border-green-500/30 bg-gradient-to-br from-loot-card to-loot-dark p-5">
              {/* Logo header */}
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/15">
                  <Zap className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-white">CPAGrip</h3>
                  <p className="text-xs text-gray-400">Complete simple tasks and surveys to earn Cash</p>
                </div>
              </div>

              <a
                href={cpagripUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-loot-orange py-3.5 font-bold text-white transition-all hover:bg-loot-orange-dark hover:shadow-lg hover:shadow-loot-orange/30 active:scale-[0.98]"
              >
                <ExternalLink className="h-5 w-5" />
                Open CPAGrip Offers
              </a>

              <p className="mt-3 text-center text-[11px] leading-relaxed text-gray-600">
                Offers provided by CPAGrip
              </p>
            </div>

            {/* AdMaven card */}
            <div className="overflow-hidden rounded-2xl border border-loot-orange/30 bg-gradient-to-br from-loot-card to-loot-dark p-5">
              {/* Logo header */}
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-loot-orange/15">
                  <Sparkles className="h-6 w-6 text-loot-orange" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-white">AdMaven</h3>
                  <p className="text-xs text-gray-400">Complete offers to earn extra Cash</p>
                </div>
              </div>

              <a
                href={admavenUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-loot-orange py-3.5 font-bold text-white transition-all hover:bg-loot-orange-dark hover:shadow-lg hover:shadow-loot-orange/30 active:scale-[0.98]"
              >
                <ExternalLink className="h-5 w-5" />
                Open Offers
              </a>

              <p className="mt-3 text-center text-[11px] leading-relaxed text-gray-600">
                Offers are provided by AdMaven.
              </p>
            </div>
          </div>
          {/* MyLead Card */}
<div className="overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-br from-loot-card to-loot-card/50 p-5">
  <div className="mb-4 flex items-center gap-3">
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15">
      <Sparkles className="h-6 w-6 text-blue-400" />
    </div>
    <div>
      <h3 className="font-display text-base font-bold text-white">MyLead</h3>
      <p className="text-xs text-gray-400">Complete offers to earn cash rewards</p>
    </div>
  </div>

  <a
    href={myleadUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-3.5 font-bold text-white hover:bg-blue-600"
  >
    <ExternalLink className="h-5 w-5" />
    Open MyLead Offers
  </a>

  <p className="mt-3 text-center text-[11px] leading-relaxed text-gray-600">
    Offers are provided by MyLead.
  </p>
</div>
        </div>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div className="mb-6 rounded-2xl border border-loot-border bg-loot-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-loot-orange" />
              <h3 className="font-display text-sm font-bold text-white">Recent Activity</h3>
            </div>
            <div className="space-y-2">
              {recentActivity.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">Offer Completed</p>
                    <p className="text-xs text-gray-500">{formatDate(entry.received_at)}</p>
                  </div>
                  <span className="shrink-0 font-display text-sm font-bold text-loot-orange">
                    +{entry.cash?.toLocaleString() ?? 0} Cash
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coming soon message */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-loot-border bg-loot-card/50 px-6 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-loot-orange/10">
            <Gamepad2 className="h-8 w-8 text-loot-orange" />
          </div>
          <h2 className="font-display text-xl font-bold text-white">Offers Coming Soon</h2>
          <p className="mt-2 max-w-xs text-sm text-gray-400">
            Connect offer partners to start earning. Once partners are linked, you'll see tasks, games, and surveys here.
          </p>
        </div>

        {/* Preview cards (locked) */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-4 rounded-2xl border border-loot-border bg-loot-card/30 p-4 opacity-50">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-loot-orange/10">
              <Puzzle className="h-6 w-6 text-loot-orange" />
            </div>
            <div>
              <p className="font-semibold text-white">Tasks &amp; Surveys</p>
              <p className="text-xs text-gray-500">Locked — connect a partner</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-loot-border bg-loot-card/30 p-4 opacity-50">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-loot-orange/10">
              <TrendingUp className="h-6 w-6 text-loot-orange" />
            </div>
            <div>
              <p className="font-semibold text-white">Offer Walls</p>
              <p className="text-xs text-gray-500">Locked — connect a partner</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-loot-border bg-loot-card/30 p-4 opacity-50">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-loot-orange/10">
              <Clock className="h-6 w-6 text-loot-orange" />
            </div>
            <div>
              <p className="font-semibold text-white">Quick Tasks</p>
              <p className="text-xs text-gray-500">Locked — connect a partner</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('tasks')}
          className="mt-6 w-full rounded-xl border border-loot-border bg-loot-card py-3 text-sm font-medium text-gray-300 transition-colors hover:text-white"
        >
          View Tasks History
        </button>
      </div>
    </div>
  );
}
