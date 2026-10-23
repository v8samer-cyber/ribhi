import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Star, Flame, PlayCircle, Video, Zap, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase'; 

export default function Earn() {
  const { user } = useApp();
  const userId = user ? encodeURIComponent(user.email) : '';
  const [activeTab, setActiveTab] = useState<'offers' | 'videos'>('offers');
  const [isWatching, setIsWatching] = useState(false);

  // تحميل سكريبت OnClicka عند فتح الصفحة
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://js.onclckmn.com/static/onclicka.js";
    script.async = true;
    script.setAttribute('data-admpid', '469516');
    document.body.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[data-admpid="469516"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  // دالة مشاهدة الإعلان وإضافة النقاط
  const handleWatchAd = async () => {
    if (!user?.email) return;
    
    setIsWatching(true);
    
    // محاكاة وقت مشاهدة الفيديو (مثلاً 10 ثوانٍ)
    setTimeout(async () => {
      try {
        const { data, error } = await supabase.rpc('claim_video_reward', {
          p_email: user.email
        });

        if (error) throw error;
        
        alert("تمت إضافة 1 LE إلى رصيدك! شكراً لمشاهدتك.");
      } catch (err: any) {
        alert("حدث خطأ: " + err.message);
      } finally {
        setIsWatching(false);
      }
    }, 10000); // 10 ثوانٍ (يمكنك تغييرها لاحقاً)
  };

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
      
      {/* العنوان الرئيسي */}
      <div className="flex items-center gap-2 mb-6 mt-2">
        <span className="text-2xl">💰</span>
        <h1 className="text-xl font-bold">Earn Money</h1>
      </div>

      {/* التبويبات المتوهجة */}
      <div className="flex p-1 bg-[#161616] rounded-2xl border border-gray-800 w-full max-w-md mx-auto mb-6 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] relative z-10">
        <button
          onClick={() => setActiveTab('offers')}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'offers'
              ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-[0_0_20px_rgba(20,184,166,0.6)]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Zap className="h-4 w-4" />
          OFFERS
        </button>
        <button
          onClick={() => setActiveTab('videos')}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'videos'
              ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.6)]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Video className="h-4 w-4" />
          WATCH & EARN
        </button>
      </div>

      {/* ================= تبويب العروض (OFFERS) ================= */}
      {activeTab === 'offers' && (
        <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in duration-300">
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
      )}

      {/* ================= تبويب الفيديوهات (WATCH & EARN) ================= */}
      {activeTab === 'videos' && (
        <div className="animate-in fade-in zoom-in duration-300 w-full max-w-md mx-auto">
          <div className="relative bg-[#161616] border border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.2)] rounded-2xl p-8 flex flex-col items-center justify-center overflow-hidden">
            
            {/* توهج خلفي */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-purple-500/20 blur-[60px] pointer-events-none"></div>

            <div className="text-6xl mb-4 text-purple-400 drop-shadow-[0_0_25px_rgba(168,85,247,0.8)]">
              <PlayCircle className="h-20 w-20 animate-pulse" />
            </div>
            
            <h2 className="text-xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-purple-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">Watch & Earn</h2>
            <p className="text-gray-400 text-center text-sm mb-6">
              Watch short video ads and earn <strong>1 LE</strong> instantly for each complete video.
            </p>

            <button 
              onClick={handleWatchAd}
              disabled={isWatching}
              className={`w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white py-4 rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all flex items-center justify-center gap-2 ${isWatching ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isWatching ? (
                <><Loader2 className="h-6 w-6 animate-spin" /> Watching Ad...</>
              ) : (
                <><PlayCircle className="h-6 w-6" /> Start Watching</>
              )}
            </button>

            <div className="mt-4 flex items-center gap-2 text-xs text-purple-300 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
              <Zap className="h-3 w-3" />
              Limit: 20 videos / 24 hours
            </div>
          </div>
        </div>
      )}

    </div>
  );
}