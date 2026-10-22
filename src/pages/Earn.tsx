import { useApp } from '@/context/AppContext';
import { Star, Flame } from 'lucide-react';

export default function Earn() {
  const { user } = useApp();
  const userId = user ? encodeURIComponent(user.email) : '';

  const partners = [
    {
      name: 'Qufay',
      logo: 'Q',
      badge: 'TOP',
      badgeIcon: Flame,
      stars: 5,
      color: 'text-teal-400',
      url: `https://qufay.com/wall/pub_qEIcQ5lJS4a4fGfkwDkHURkY?subid=${userId}`,
      desc: 'Fast tasks & surveys'
    },
    {
      name: 'Wallunex',
      logo: 'W',
      badge: 'NEW',
      badgeIcon: Flame,
      stars: 4,
      color: 'text-green-400',
      // 👇 ركز هنا فقط 👇
      url: `https://wallunex.com/wall?apiKey=bjfJ1dcewxjxHjkaZFQdYud688PjyiON&userId=${userId}`,
      desc: 'More tasks & surveys'
    },
    {
      name: 'MyLead',
      logo: 'M',
      badge: 'HOT',
      badgeIcon: Flame,
      stars: 5,
      color: 'text-blue-400',
      url: `https://reward-me.eu/79f91f34-cd91-11f1-9b11-129a1c289511?ml_sub1=${userId}`,
      desc: 'Complete offers & surveys'
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
          <a
            key={index}
            href={partner.url}
            target="_blank"
            rel="noopener noreferrer"
            className="relative bg-[#161616] border border-orange-500/40 rounded-2xl p-6 flex flex-col items-center justify-center h-48 hover:bg-[#1a1a1a] transition cursor-pointer"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 85% 100%, 0 100%)' }}
          >
            <div className="absolute top-3 right-3 bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
              {partner.badge}
              <partner.badgeIcon className="h-3 w-3" />
            </div>

            <div className={`text-4xl font-bold mb-2 ${partner.color}`}>
              {partner.logo}
            </div>

            <h3 className="text-sm font-bold mb-1">{partner.name}</h3>
            <p className="text-[10px] text-gray-500 text-center mb-2">{partner.desc}</p>

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