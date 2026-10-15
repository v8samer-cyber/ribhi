import { LogOut, Mail, User as UserIcon, Wallet, ClipboardList } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function Profile() {
  const { user, logout, navigate } = useApp();

  if (!user) return null;

  const initial = user.username.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-loot-black pb-24">
      <div className="mx-auto max-w-md px-4 pt-6">
        {/* Avatar + info */}
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full border-2 border-loot-orange bg-loot-card font-display text-4xl font-bold text-loot-orange">
            {initial}
          </div>
          <h2 className="font-display text-xl font-bold text-white">{user.username}</h2>
          <p className="mt-1 text-sm text-gray-500">{user.email}</p>
        </div>

        {/* Balance card */}
        <div className="mb-4 overflow-hidden rounded-2xl border border-loot-border bg-gradient-to-br from-loot-card to-loot-dark p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-loot-orange/15">
                <Wallet className="h-5 w-5 text-loot-orange" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Balance</p>
                <p className="font-display text-lg font-bold text-white">{user.balance.toLocaleString()} Cash</p>
              </div>
            </div>
            <span className="text-sm text-gray-500">= {(user.balance / 1000).toFixed(2)} USD</span>
          </div>
        </div>

        {/* Info rows */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-3 rounded-xl border border-loot-border bg-loot-card p-4">
            <UserIcon className="h-5 w-5 text-gray-500" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">Username</p>
              <p className="text-sm font-medium text-white">{user.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-loot-border bg-loot-card p-4">
            <Mail className="h-5 w-5 text-gray-500" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm font-medium text-white">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('tasks')}
            className="flex w-full items-center gap-3 rounded-xl border border-loot-border bg-loot-card p-4 text-left transition-colors hover:bg-loot-border/30"
          >
            <ClipboardList className="h-5 w-5 text-gray-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Tasks History</p>
              <p className="text-xs text-gray-500">View your completed tasks</p>
            </div>
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-3.5 font-semibold text-red-400 transition-all hover:bg-red-500/20 active:scale-[0.98]"
        >
          <LogOut className="h-5 w-5" />
          Log Out
        </button>
      </div>
    </div>
  );
}
