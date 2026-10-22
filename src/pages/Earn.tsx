import { useApp } from '@/context/AppContext';
import { Star, Flame, ExternalLink } from 'lucide-react';

export default function Earn() {
  const { user } = useApp();
  
  // ناخذ إيميل المستخدم ونمرره للشركات عشان تعرف لمين تضيف النقاط
  const userId = user ? encodeURIComponent(user.email) : '';

  // ⚠️ هنا تحط رابط Qufay اللي نسخته (السطر هذا)
  const qufayUrl = `https://qufay.com/wall/pub_9Xk7YC5L1zGS1t8XYRjGsuI7?subid=${userId}`;
  
  // رابط MyLead
  const myleadUrl = `https://reward-me.eu/79f91f34-cd91-11f1-9b11-129a1c289511sub1=${userId}`;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 pb-24">
      <div className="flex items-center gap-2 mb-6 mt-2">
        <span className="text-2xl">👔</span>
        <h1 className="text-xl font-bold">Offer Partners</h1>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* بطاقة MyLead */}
        <a
          href={myleadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative bg-[#161616] border border-blue-500/40 rounded-2xl p-6 flex flex-col items-center justify-center h-48 hover:bg-[#1a1a1a] transition cursor-pointer"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 85% 100%, 0 100%)' }}
        >
          <div className="absolute top-3 right-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
            HOT <Flame className="h-3 w-3" />
          </div>
          <div className="text-4xl font-bold mb-2 text-blue-400">M</div>
          <h3 className="text-sm font-bold mb-1">MyLead</h3>
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-yellow-500 text-yellow-500" />
            ))}
          </div>
        </a>

        {/* بطاقة Qufay */}
        <a
          href={`${qufayUrl}${qufayUrl.includes('?') ? '&' : '?'}subid=${userId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="relative bg-[#161616] border border-orange-500/40 rounded-2xl p-6 flex flex-col items-center justify-center h-48 hover:bg-[#1a1a1a] transition cursor-pointer"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 85% 100%, 0 100%)' }}
        >
          <div className="absolute top-3 right-3 bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
            VIP <Flame className="h-3 w-3" />
          </div>
          <div className="text-4xl font-bold mb-2 text-orange-400">Q</div>
          <h3 className="text-sm font-bold mb-1">Qufay</h3>
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-yellow-500 text-yellow-500" />
            ))}
          </div>
        </a>
      </div>
    </div>
  );
}