import { Trophy, Wallet, Gamepad2, Users, User as UserIcon } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function BottomNav() {
  const { page, navigate, user } = useApp();

  if (!user) return null;

  const items = [
    { id: 'leaderboard' as const, label: 'Ranks', icon: Trophy },
    { id: 'cashout' as const, label: 'Cashout', icon: Wallet },
    { id: 'earn' as const, label: 'Earn', icon: Gamepad2, center: true },
    { id: 'affiliates' as const, label: 'Refer', icon: Users },
    { id: 'profile' as const, label: 'Profile', icon: UserIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-loot-border bg-loot-black/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-end justify-around px-2 pb-2 pt-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = page === item.id;

          if (item.center) {
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className="flex flex-col items-center gap-1 -mt-6"
              >
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-full border-2 border-loot-orange bg-loot-orange transition-transform ${
                    isActive ? 'scale-110 shadow-lg shadow-loot-orange/40' : 'hover:scale-105'
                  }`}
                >
                  <Icon className="h-6 w-6 text-white" strokeWidth={2.5} />
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'text-loot-orange' : 'text-gray-500'}`}>
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className="flex flex-1 flex-col items-center gap-1 py-1 transition-colors"
            >
              <Icon
                className={`h-5 w-5 transition-colors ${isActive ? 'text-loot-orange' : 'text-gray-500'}`}
                strokeWidth={2}
              />
              <span className={`text-[10px] font-medium ${isActive ? 'text-loot-orange' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
