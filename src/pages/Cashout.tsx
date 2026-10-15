import { useState } from 'react';
import { Wallet, AlertCircle, History, Check, X, ChevronRight } from 'lucide-react';
import { useApp, type Withdrawal } from '@/context/AppContext';

const MIN_WITHDRAW = 100;

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function HistoryRow({ w }: { w: Withdrawal }) {
  const statusConfig: Record<Withdrawal['status'], { label: string; bg: string; text: string; icon: string }> = {
    pending: {
      label: 'Pending - Waiting for approval',
      bg: 'bg-loot-orange/10 border-loot-orange/30',
      text: 'text-loot-orange',
      icon: '\u23F3',
    },
    paid: {
      label: 'Paid - Amount has been sent',
      bg: 'bg-green-500/10 border-green-500/30',
      text: 'text-green-400',
      icon: '\u2705',
    },
    rejected: {
      label: 'Rejected - Please contact support',
      bg: 'bg-red-500/10 border-red-500/30',
      text: 'text-red-400',
      icon: '\u274C',
    },
  };

  const cfg = statusConfig[w.status];

  return (
    <div className="rounded-xl border border-loot-border bg-loot-card p-4">
      <div className="flex items-center justify-between">
        <span className="font-display text-lg font-bold text-white">{w.amount.toLocaleString()} Cash</span>
        <span className="text-xs text-gray-500">= {(w.amount / 1000).toFixed(2)} USD</span>
      </div>

      <div className={`mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 ${cfg.bg}`}>
        <span className="text-sm">{cfg.icon}</span>
        <span className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</span>
      </div>

      <div className="mt-3 flex justify-between text-xs text-gray-500">
        <div>
          <p className="text-gray-600">Requested</p>
          <p className="text-gray-400">{formatDate(w.requestedAt)}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-600">Processed</p>
          <p className="text-gray-400">{formatDate(w.processedAt)}</p>
        </div>
      </div>
    </div>
  );
}

function WithdrawModal({
  balance, onClose, onSubmit,
}: {
  balance: number;
  onClose: () => void;
  onSubmit: (walletAddress: string) => void;
}) {
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    setError('');
    if (!address.trim()) {
      setError('Please enter your Binance wallet address.');
      return;
    }
    if (address.trim().length < 20) {
      setError('Wallet address must be at least 20 characters.');
      return;
    }
    onSubmit(address.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
      <div className="animate-slide-up w-full max-w-md rounded-t-3xl border border-loot-border bg-loot-dark p-6 sm:rounded-3xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-white">Enter your Binance Wallet Address</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-loot-border hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Balance display */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-loot-border bg-loot-card p-3 text-center">
            <p className="text-xs text-gray-500">Balance</p>
            <p className="font-display text-lg font-bold text-loot-orange">{balance.toLocaleString()}</p>
            <p className="text-[10px] text-gray-600">Cash</p>
          </div>
          <div className="rounded-xl border border-loot-border bg-loot-card p-3 text-center">
            <p className="text-xs text-gray-500">You receive</p>
            <p className="font-display text-lg font-bold text-white">{(balance / 1000).toFixed(2)}</p>
            <p className="text-[10px] text-gray-600">USD</p>
          </div>
        </div>

        {/* Input */}
        <div className="mb-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-300">Binance Wallet Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter your wallet address (min 20 chars)"
            autoFocus
            className="w-full rounded-xl border border-loot-border bg-loot-black px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-colors focus:border-loot-orange"
          />
        </div>

        {error && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-loot-border bg-loot-card py-3.5 font-semibold text-gray-300 transition-colors hover:bg-loot-border"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={balance < MIN_WITHDRAW}
            className="flex-[2] rounded-xl bg-loot-orange py-3.5 font-bold text-white transition-all hover:bg-loot-orange-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            Request Withdrawal
          </button>
        </div>

        {balance < MIN_WITHDRAW && (
          <p className="mt-3 text-center text-xs text-gray-600">
            Minimum withdrawal is {MIN_WITHDRAW} Cash
          </p>
        )}
      </div>
    </div>
  );
}

export default function Cashout() {
  const { user, withdrawals, requestWithdrawal } = useApp();
  const balance = user?.balance ?? 0;
  const progress = Math.min((balance / MIN_WITHDRAW) * 100, 100);

  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const myWithdrawals = withdrawals.filter((w) => w.email === user?.email);

  const handleWithdraw = (walletAddress: string) => {
    setError('');
    setSuccess('');

    if (balance < MIN_WITHDRAW) {
      setError('Minimum withdrawal is 100 Cash');
      setShowModal(false);
      return;
    }

    const ok = requestWithdrawal(balance, 'Binance', walletAddress);
    if (ok) {
      setSuccess('Withdrawal request submitted successfully');
      setShowModal(false);
    } else {
      setError('Failed to create withdrawal request. Please try again.');
      setShowModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-loot-black pb-24">
      {showModal && (
        <WithdrawModal
          balance={balance}
          onClose={() => setShowModal(false)}
          onSubmit={handleWithdraw}
        />
      )}

      <div className="mx-auto max-w-md px-4 pt-6">
        {/* Balance */}
        <div className="mb-6 rounded-2xl border border-loot-border bg-gradient-to-br from-loot-card to-loot-dark p-5 text-center">
          <p className="text-sm text-gray-400">You Have</p>
          <div className="mt-1 flex items-baseline justify-center gap-2">
            <span className="font-display text-4xl font-bold text-white">{balance.toLocaleString()}</span>
            <span className="text-sm text-gray-500">Cash</span>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            = {(balance / 1000).toFixed(2)} USD
          </p>
        </div>

        {/* Next payout progress */}
        <div className="mb-6 rounded-2xl border border-loot-border bg-loot-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-300">Next Payout On</p>
            <span className="font-display text-lg font-bold text-loot-orange">{MIN_WITHDRAW} Cash</span>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-loot-dark">
            <div
              className="h-full rounded-full bg-gradient-to-r from-loot-orange-dark to-loot-orange transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {balance >= MIN_WITHDRAW
              ? 'You can cash out now!'
              : `${(MIN_WITHDRAW - balance).toLocaleString()} Cash until you can withdraw`}
          </p>
        </div>

        {/* Error / Success messages */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400">
            <Check className="h-4 w-4 shrink-0" />
            {success}
          </div>
        )}

        {/* Withdrawal method */}
        <div className="mb-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-300">Withdraw To</h3>

          <button
            onClick={() => {
              setError('');
              setSuccess('');
              setShowModal(true);
            }}
            className="flex w-full items-center gap-4 rounded-2xl border border-loot-border bg-loot-card p-5 transition-colors hover:bg-loot-border/30"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F0B90B]/15">
              <span className="font-display text-lg font-bold text-[#F0B90B]">B</span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-white">Binance</p>
              <p className="text-xs text-gray-500">Min withdraw: {MIN_WITHDRAW} Cash</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Withdrawal History */}
        <div className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <History className="h-5 w-5 text-loot-orange" />
            <h3 className="font-display text-lg font-bold text-white">Withdrawal History</h3>
          </div>

          {myWithdrawals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-loot-border bg-loot-card/50 p-8 text-center text-sm text-gray-500">
              No withdrawals yet. Your withdrawal history will appear here.
            </div>
          ) : (
            <div className="space-y-3">
              {myWithdrawals.map((w) => (
                <HistoryRow key={w.id} w={w} />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-loot-border bg-loot-card/50 p-4">
          <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-loot-orange" />
          <div className="text-xs leading-relaxed text-gray-400">
            <p>Minimum withdrawal: {MIN_WITHDRAW} Cash (0.01 USD)</p>
            <p className="mt-1">1 USD = 1,000 Cash</p>
          </div>
        </div>
      </div>
    </div>
  );
}
