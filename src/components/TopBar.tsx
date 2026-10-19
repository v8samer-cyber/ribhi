import { useApp } from '../context/AppContext';
import { User } from 'lucide-react'; // تأكد من وجود مكتبة الأيقونات

export default function TopBar() {
  const { user } = useApp();

  return (
    <div className="bg-[#0f172a] text-white w-full">
      {/* الشريط العلوي */}
      <div className="flex justify-between items-center px-4 py-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-orange-500 tracking-wide">LOOTEARN</h1>
          <span className="text-gray-400">•</span>
          {/* هنا قمنا بقسمة الرصيد على 1000 ووضع علامة الدولار */}
          <span className="text-orange-400 font-bold">
            ${((user?.balance || 0) / 1000).toFixed(2)}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-300">Lv.0</span>
          <div className="w-8 h-8 rounded-full border border-gray-600 flex items-center justify-center bg-gray-800 text-gray-400">
             <User size={16} />
          </div>
        </div>
      </div>

      {/* شريط الأخبار المتحرك (تم تغيير faucetpay إلى Binance) */}
      <div className="bg-black py-1.5 px-4 overflow-hidden flex items-center gap-6 border-y border-gray-800">
        <div className="flex items-center gap-2">
          <span className="bg-blue-500 text-white font-bold px-1.5 py-0.5 rounded text-xs">F</span>
          <span className="text-gray-300 text-sm whitespace-nowrap">Binance <span className="font-bold text-red-500">USDT LE 338.00</span></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-blue-500 text-white font-bold px-1.5 py-0.5 rounded text-xs">F</span>
          <span className="text-gray-300 text-sm whitespace-nowrap">Binance <span className="font-bold text-red-500">USDT LE 150.00</span></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-blue-500 text-white font-bold px-1.5 py-0.5 rounded text-xs">F</span>
          <span className="text-gray-300 text-sm whitespace-nowrap">Binance <span className="font-bold text-red-500">USDT LE 97.00</span></span>
        </div>
      </div>
    </div>
  );
}