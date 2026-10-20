import { useApp } from '@/context/AppContext';

export default function TopBar() {
  const { user } = useApp();
  
  // هذي هي الأرقام اللي طلبتها (مرتبة)
  const withdrawals = [
    { name: 'usdt', amount: 'LE 100.00', icon: 'B' },
    { name: 'usdt', amount: 'LE 300.00', icon: 'B' },
    { name: 'usdt', amount: 'LE 500.00', icon: 'B' },
    { name: 'usdt', amount: 'LE 1000.00', icon: 'B' },
    { name: 'usdt', amount: 'LE 2000.00', icon: 'B' },
    { name: 'usdt', amount: 'LE 300.00', icon: 'B' },
    { name: 'usdt', amount: 'LE 800.00', icon: 'B' },
    { name: 'usdt', amount: 'LE 400.00', icon: 'B' },
  ];

  // نكرر المصفوفة عشان الحركة تكون مستمرة
  const tickerItems = [...withdrawals, ...withdrawals];

  return (
    <div className="bg-[#0a0a0a] text-white pb-3 border-b border-gray-800">
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center gap-1">
          <span className="text-xl font-black text-orange-500 tracking-tighter">
            LOOT<span className="text-white">EARN</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#1a1a1a] px-3 py-1.5 rounded-lg border border-gray-800">
            <span className="text-yellow-500 text-xs">●</span>
            <span className="font-bold text-sm">{Number(user?.balance || 0).toFixed(2)} LE</span>
          </div>
          
          <div className="flex items-center gap-1 bg-[#1a1a1a] px-3 py-1.5 rounded-lg border border-gray-800">
            <span className="text-gray-400 text-xs">☆</span>
            <span className="font-bold text-sm">Lv.0</span>
          </div>

          <div className="w-8 h-8 rounded-full bg-red-900/50 border border-red-500 flex items-center justify-center text-red-200 text-xs">
            U
          </div>
        </div>
      </div>

      {/* الشريط المتحرك */}
      <div className="overflow-hidden w-full bg-[#0a0a0a]">
        <div className="flex gap-2 w-max animate-marquee">
          {tickerItems.map((item, index) => (
            <div key={index} className="flex items-center gap-3 bg-[#1a1a1a] p-2 rounded-xl border border-gray-800 min-w-[140px]">
              <div className="bg-yellow-500 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg text-black">
                {item.icon}
              </div>
              <div>
                <p className="text-[10px] text-gray-400 leading-tight">Binance</p>
                <p className="text-xs font-bold text-white">{item.name} <span className="text-red-500 ml-1">{item.amount}</span></p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}