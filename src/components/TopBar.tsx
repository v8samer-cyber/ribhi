import { useApp } from '@/context/AppContext';
import Logo from './Logo';

export default function TopBar() {
  const { user, navigate } = useApp();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-loot-border bg-loot-black/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
        <button onClick={() => navigate('earn')}>
          <Logo size="sm" />
        </button>
        <div className="flex items-center gap-2 rounded-full bg-loot-card px-3 py-1.5">
          <span className="text-sm font-semibold text-loot-orange">{user.balance.toLocaleString()}</span>
          <span className="text-xs text-gray-400">Cash</span>
        </div>
      </div>
    </header>
  );
}
