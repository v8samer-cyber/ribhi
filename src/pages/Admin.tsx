import { useState, useEffect } from 'react';
import {
  Lock, LogOut, Users, CheckCircle2, Coins, Banknote,
  Check, X, Clock, ArrowLeft, User, Copy,
} from 'lucide-react';
import { useApp, type Withdrawal, type PostbackEntry } from '@/context/AppContext';

const ADMIN_USERNAME = 'hasanvv88vv88';
const ADMIN_PASSWORD = 'Hasan11233211';
const ADMIN_SESSION_KEY = 'lootearn_admin_session';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function duration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${min}m ${rem}s`;
}

// ─── Password gate ───────────────────────────────────────

function PasswordGate({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const { navigate } = useApp();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ADMIN_USERNAME && pw === ADMIN_PASSWORD) {
      setError('');
      localStorage.setItem(ADMIN_SESSION_KEY, 'true');
      onSuccess();
    } else {
      setError('Invalid credentials');
    }
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
          Back to site
        </button>

        <div className="flex flex-1 flex-col justify-center py-8">
          <div className="mb-6 flex flex-col items-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-loot-orange/10">
              <Lock className="h-8 w-8 text-loot-orange" />
            </div>
            <h2 className="font-display text-2xl font-bold text-white">Admin Panel</h2>
            <p className="mt-1 text-sm text-gray-500">Enter your credentials to continue</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                autoComplete="off"
                className="w-full rounded-xl border border-loot-border bg-loot-card py-3.5 pl-11 pr-4 text-white placeholder-gray-600 outline-none transition-colors focus:border-loot-orange"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="Password"
                className="w-full rounded-xl border border-loot-border bg-loot-card py-3.5 pl-11 pr-4 text-white placeholder-gray-600 outline-none transition-colors focus:border-loot-orange"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              className="w-full rounded-xl bg-loot-orange py-3.5 font-bold text-white transition-all hover:bg-loot-orange-dark hover:shadow-lg hover:shadow-loot-orange/30 active:scale-[0.98]"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Stat card ───────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, accent,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl border border-loot-border bg-loot-card p-4">
      <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-lg ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="font-display text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

// ─── Status badge ────────────────────────────────────────

function StatusBadge({ status }: { status: Withdrawal['status'] }) {
  const styles: Record<Withdrawal['status'], string> = {
    pending: 'bg-loot-orange/15 text-loot-orange border-loot-orange/30',
    paid: 'bg-green-500/15 text-green-400 border-green-500/30',
    rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
  };
  const labels: Record<Withdrawal['status'], string> = {
    pending: 'Pending', paid: 'Paid', rejected: 'Rejected',
  };
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

// ─── Copyable cell ───────────────────────────────────────

function CopyableCell({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  if (!text) return <span className="text-gray-600">—</span>;

  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className="max-w-[120px] truncate font-mono text-xs text-gray-300" title={text}>{text}</span>
      <button
        onClick={copy}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors ${
          copied ? 'text-green-400' : 'text-gray-500 hover:text-loot-orange'
        }`}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

// ─── Section header ──────────────────────────────────────

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="font-display text-lg font-bold text-white">{title}</h3>
      <span className="rounded-full bg-loot-card px-2.5 py-0.5 text-xs text-gray-400">{count}</span>
    </div>
  );
}

// ─── Main admin panel ────────────────────────────────────

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const { allUsers, withdrawals, tasks, postbacks, updateWithdrawalStatus, navigate } = useApp();

  const totalDistributed = tasks.reduce((s, t) => s + t.cash, 0);
  const totalWithdrawn = withdrawals.filter((w) => w.status === 'paid').reduce((s, w) => s + w.amount, 0);
  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'pending');

  return (
    <div className="min-h-screen bg-loot-black">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-loot-border bg-loot-black/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-loot-orange" />
            <div className="flex flex-col">
              <span className="font-display text-lg font-bold text-white">Admin Panel</span>
              <span className="text-xs text-gray-500">Welcome, {ADMIN_USERNAME}</span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 rounded-lg border border-loot-border bg-loot-card px-3 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:border-red-500/30 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={Users} label="Total Users" value={allUsers.length.toString()} accent="bg-loot-orange/15 text-loot-orange" />
          <StatCard icon={CheckCircle2} label="Tasks Completed" value={tasks.length.toString()} accent="bg-blue-500/15 text-blue-400" />
          <StatCard icon={Coins} label="Cash Distributed" value={totalDistributed.toLocaleString()} accent="bg-green-500/15 text-green-400" />
          <StatCard icon={Banknote} label="Cash Withdrawn" value={totalWithdrawn.toLocaleString()} accent="bg-purple-500/15 text-purple-400" />
        </div>

        {/* Users table */}
        <div className="mb-8">
          <SectionHeader title="Users" count={allUsers.length} />
          {allUsers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-loot-border bg-loot-card/50 p-8 text-center text-sm text-gray-500">
              No users registered yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-loot-border bg-loot-card">
              <table className="w-full min-w-[500px] text-left text-sm">
                <thead className="border-b border-loot-border text-xs text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Username</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Cash</th>
                    <th className="px-4 py-3 font-medium">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((u, i) => (
                    <tr key={u.email} className={i % 2 === 1 ? 'bg-white/[0.02]' : ''}>
                      <td className="px-4 py-3 font-medium text-white">{u.username}</td>
                      <td className="px-4 py-3 text-gray-400">{u.email}</td>
                      <td className="px-4 py-3 font-semibold text-loot-orange">{u.balance.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDate(u.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Tasks table */}
        <div className="mb-8">
          <SectionHeader title="Completed Tasks" count={tasks.length} />
          {tasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-loot-border bg-loot-card/50 p-8 text-center text-sm text-gray-500">
              No tasks completed yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-loot-border bg-loot-card">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="border-b border-loot-border text-xs text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Task</th>
                    <th className="px-4 py-3 font-medium">Company</th>
                    <th className="px-4 py-3 font-medium">Cash</th>
                    <th className="px-4 py-3 font-medium">Downloaded</th>
                    <th className="px-4 py-3 font-medium">Completed</th>
                    <th className="px-4 py-3 font-medium">Credited</th>
                    <th className="px-4 py-3 font-medium">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t, i) => (
                    <tr key={t.id} className={i % 2 === 1 ? 'bg-white/[0.02]' : ''}>
                      <td className="px-4 py-3 font-medium text-white">{t.username}</td>
                      <td className="px-4 py-3 text-gray-300">{t.taskName}</td>
                      <td className="px-4 py-3 text-gray-400">{t.company}</td>
                      <td className="px-4 py-3 font-semibold text-loot-orange">{t.cash.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDate(t.downloadedAt)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDate(t.completedAt)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDate(t.creditedAt)}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{duration(t.downloadedAt, t.creditedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Postback Log */}
        <div className="mb-8">
          <SectionHeader title="Postback Log" count={postbacks.length} />
          {postbacks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-loot-border bg-loot-card/50 p-8 text-center text-sm text-gray-500">
              No postback requests received yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-loot-border bg-loot-card">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="border-b border-loot-border text-xs text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date & Time</th>
                    <th className="px-4 py-3 font-medium">User ID</th>
                    <th className="px-4 py-3 font-medium">Click ID</th>
                    <th className="px-4 py-3 font-medium">Cash</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {postbacks.map((p: PostbackEntry, i: number) => (
                    <tr key={p.id} className={i % 2 === 1 ? 'bg-white/[0.02]' : ''}>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDate(p.received_at)}</td>
                      <td className="px-4 py-3 text-gray-300">{p.user_id || '—'}</td>
                      <td className="px-4 py-3 text-gray-400">{p.click_id || '—'}</td>
                      <td className="px-4 py-3 font-semibold text-loot-orange">{p.cash?.toLocaleString() ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                          p.status === 'success'
                            ? 'bg-green-500/15 text-green-400 border-green-500/30'
                            : 'bg-red-500/15 text-red-400 border-red-500/30'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{p.reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Withdrawals table */}
        <div className="mb-8">
          <SectionHeader title="Withdrawals" count={withdrawals.length} />
          {withdrawals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-loot-border bg-loot-card/50 p-8 text-center text-sm text-gray-500">
              No withdrawal requests yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-loot-border bg-loot-card">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-loot-border text-xs text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Amount (Cash)</th>
                    <th className="px-4 py-3 font-medium">Amount (USD)</th>
                    <th className="px-4 py-3 font-medium">Method</th>
                    <th className="px-4 py-3 font-medium">Wallet Address</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Requested</th>
                    <th className="px-4 py-3 font-medium">Processed</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w, i) => (
                    <tr key={w.id} className={i % 2 === 1 ? 'bg-white/[0.02]' : ''}>
                      <td className="px-4 py-3 font-medium text-white">{w.username}</td>
                      <td className="px-4 py-3 font-semibold text-loot-orange">{w.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-300">{(w.amount / 1000).toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-400">{w.method}</td>
                      <td className="px-4 py-3"><CopyableCell text={w.walletAddress} /></td>
                      <td className="px-4 py-3"><StatusBadge status={w.status} /></td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDate(w.requestedAt)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDate(w.processedAt)}</td>
                      <td className="px-4 py-3">
                        {w.status === 'pending' ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateWithdrawalStatus(w.id, 'paid')}
                              className="flex items-center gap-1 rounded-lg border border-green-500/30 bg-green-500/10 px-2.5 py-1.5 text-xs font-semibold text-green-400 transition-colors hover:bg-green-500/20"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Mark as Paid
                            </button>
                            <button
                              onClick={() => updateWithdrawalStatus(w.id, 'rejected')}
                              className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20"
                            >
                              <X className="h-3.5 w-3.5" />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-gray-600">
                            <Clock className="h-3.5 w-3.5" />
                            Processed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pending summary */}
        {pendingWithdrawals.length > 0 && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-loot-orange/30 bg-loot-orange/5 p-4">
            <Clock className="h-5 w-5 text-loot-orange" />
            <p className="text-sm text-gray-300">
              <span className="font-semibold text-loot-orange">{pendingWithdrawals.length}</span> pending withdrawal{pendingWithdrawals.length > 1 ? 's' : ''} awaiting your action.
            </p>
          </div>
        )}

        <button
          onClick={() => navigate('home')}
          className="text-sm text-gray-500 transition-colors hover:text-white"
        >
          ← Back to site
        </button>
      </div>
    </div>
  );
}

// ─── Export with gate ────────────────────────────────────

export default function Admin() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem(ADMIN_SESSION_KEY);
    if (session === 'true') {
      setAuthed(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setAuthed(false);
  };

  if (!authed) return <PasswordGate onSuccess={() => setAuthed(true)} />;
  return <AdminDashboard onLogout={handleLogout} />;
}
