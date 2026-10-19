import { useApp } from '@/context/AppContext';
import { Trophy, Wallet, HandCoins, Users, User } from 'lucide-react';

export default function BottomNav() {
  const { page, navigate } = useApp();

  const tabs = [
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'cashout', label: 'Cashout', icon: Wallet },
    { id: 'earn', label: 'Earn', icon: HandCoins },
    { id: 'affiliates', label: 'Affiliates', icon: Users },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 w-full bg-[#0a0a0a] border-t border-gray-800 flex justify-around items-center pb-safe pt-2 h-16 z-50">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = page === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.id)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              isActive ? 'text-orange-500' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Icon className={`h-6 w-6 ${isActive ? 'fill-orange-500/20' : ''}`} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}