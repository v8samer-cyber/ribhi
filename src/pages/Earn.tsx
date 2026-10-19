import { useApp } from '@/context/AppContext';
import { Star, Flame } from 'lucide-react';

export default function Earn() {
  const { user } = useApp();
  
  // ناخذ إيميل المستخدم ونمرره لشركة MyLead عشان تعرف لمين تضيف النقاط
  const userId = user ? encodeURIComponent(user.email) : '';

  // الروابط الحقيقية (MyLead و OfferToro)
  const partners = [
    {
      name: 'MyLead',
      logo: 'M',
      badge: 'HOT',
      badgeIcon: Flame,
      stars: 5,
      color: 'text-blue-400',
      url: `https://reward-me.eu/b1334694-c8d4-11f1-a264-8a5fb7be40ea?ml_sub1=${userId}`,
      desc: 'Complete offers & surveys'
    },
    {
      name: 'OfferToro',
      logo: 'OT',
      badge: 'VIP',
      badgeIcon: Flame,
      stars: 5,
      color: 'text-purple-400',
      url: `https://offertoro.com`, // (تقدر تبدل هذا برابط العرض الخاص بك من OfferToro)
      desc: 'Earn cash for playing games'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 pb-24">
      <div className="flex items-center gap-2 mb-6 mt-2">
        <span className="text-2xl">👔</span>
        <h1 className="text-xl font-bold">Offer Partners</h1>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {partners.map((partner, index) => (
          // البطاقة صارت رابط <a> عشان تفتح الشركة الحقيقية
          <a
            key={index}
            href={partner.url}
            target="_blank"
            rel="noopener noreferrer"
            className="relative bg-[#161616] border border-orange-500/40 rounded-2xl p-6 flex flex-col items-center justify-center h-48 hover:bg-[#1a1a1a] transition cursor-pointer"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 85% 100%, 0 100%)' }}
          >
            {/* شارة HOT و VIP */}
            <div className="absolute top-3 right-3 bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
              {partner.badge}
              <partner.badgeIcon className="h-3 w-3" />
            </div>

            {/* شعار الشركة */}
            <div className={`text-4xl font-bold mb-2 ${partner.color}`}>
              {partner.logo}
            </div>

            {/* اسم الشركة والوصف */}
            <h3 className="text-sm font-bold mb-1">{partner.name}</h3>
            <p className="text-[10px] text-gray-500 text-center mb-2">{partner.desc}</p>

            {/* النجوم */}
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-3 w-3 ${i < partner.stars ? 'fill-yellow-500 text-yellow-500' : 'fill-gray-700 text-gray-700'}`} 
                />
              ))}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}