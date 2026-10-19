import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../supabaseClient';
import { 
  LogOut, Globe, Award, DollarSign, ListChecks, 
  ChevronDown, ChevronUp, Clock, ArrowUpRight 
} from 'lucide-react';

export default function Profile() {
  const { user, logout } = useApp();
  
  // حالات التبويبات (Offers, Surveys, Cashout)
  const [activeTab, setActiveTab] = useState<'offers' | 'surveys' | 'cashout'>('offers');
  
  // البيانات الحقيقية
  const [offers, setOffers] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // حالة فتح وإغلاق السهم (Accordion)
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // جلب البيانات من قاعدة البيانات عند فتح الصفحة
  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        // 1. جلب العروض المكتملة (postback_log)
        const { data: offersData } = await supabase
          .from('postback_log')
          .select('*')
          .eq('ml_sub1', user.email) // بناءً على تقريرك، الإيميل يُحفظ في ml_sub1
          .order('created_at', { ascending: false });

        // 2. جلب طلبات السحب (withdrawals)
        const { data: withdrawalsData } = await supabase
          .from('withdrawals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        setOffers(offersData || []);
        setWithdrawals(withdrawalsData || []);
        setLoading(false);
      };
      fetchData();
    }
  }, [user]);

  if (!user) return <div className="text-white text-center mt-20">Please Sign In first.</div>;

  // حساب الإحصائيات الحقيقية
  const totalEarned = offers.reduce((sum, offer) => sum + (Number(offer.payout_decimal) || 0), 0);
  const offersCount = offers.length;

  // دالة لتبديل السهم (فتح/إغلاق)
  const toggleDetails = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // اسم المستخدم الحقيقي أو الإيميل
  const displayName = user.username || user.email.split('@')[0];
  // علم الدولة (إذا لم يتم إضافته يظهر علم أمريكا افتراضياً)
  const countryCode = (user.country_code || 'US').toUpperCase();
  const flagEmoji = countryCode.replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));

  return (
    <div className="min-h-screen bg-[#0f1115] flex flex-col items-center pt-6 pb-28 px-4 text-white font-sans">
      
      {/* 1. بطاقة المستخدم */}
      <div className="w-full max-w-sm flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full border-2 border-red-500 overflow-hidden bg-gray-800">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} alt="avatar" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{displayName}</h2>
            <div className="flex items-center gap-1 text-sm text-gray-400">
              <span>{flagEmoji}</span>
              <span>{user.country_code || 'UNITED STATES'}</span>
            </div>
          </div>
        </div>
        <button onClick={logout} className="bg-gray-800 p-2.5 rounded-lg hover:bg-gray-700 transition">
          <LogOut size={20} className="text-white" />
        </button>
      </div>

      {/* 2. الإحصائيات (Offers & Surveys) */}
      <div className="w-full max-w-sm bg-[#181a20] rounded-2xl p-5 mb-6 border border-gray-800 relative overflow-hidden">
        <div className="grid grid-cols-2 gap-y-6 gap-x-4 relative z-10">
          <div>
            <p className="text-sm text-gray-400 mb-1 flex items-center gap-2"><ListChecks size={16} className="text-orange-500"/> Offers Completed</p>
            <p className="text-2xl font-bold">{offersCount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1 flex items-center gap-2"><DollarSign size={16} className="text-orange-500"/> Total Earned</p>
            <p className="text-2xl font-bold">{totalEarned.toFixed(2)} LE</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1 flex items-center gap-2"><ListChecks size={16} className="text-orange-500"/> Surveys Completed</p>
            <p className="text-2xl font-bold">0</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1 flex items-center gap-2"><Clock size={16} className="text-orange-500"/> Surveys Earned</p>
            <p className="text-2xl font-bold">0.00 LE</p>
          </div>
        </div>
      </div>

      {/* 3. التبويبات (Offers / Surveys / Cashout) */}
      <div className="w-full max-w-sm flex justify-around border-b border-gray-800 mb-4">
        {['offers', 'surveys', 'cashout'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`pb-3 px-4 capitalize font-medium transition ${activeTab === tab ? 'text-white border-b-2 border-orange-500' : 'text-gray-500 hover:text-gray-300'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 4. محتوى التبويبات */}
      <div className="w-full max-w-sm space-y-3">
        
        {/* تبويب العروض */}
        {activeTab === 'offers' && (
          loading ? <p className="text-center text-gray-500">Loading offers...</p> :
          offers.length === 0 ? <p className="text-center text-gray-500">No offers completed yet.</p> :
          offers.map((offer) => (
            <div key={offer.id} className="bg-[#181a20] rounded-xl border border-gray-800 overflow-hidden">
              {/* رأس البطاقة */}
              <div onClick={() => toggleDetails(offer.id)} className="p-4 flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center font-bold text-xl">
                    {offer.network ? offer.network.charAt(0) : 'C'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm line-clamp-1">{offer.offer_name || 'Offer Completed'}</h4>
                    <p className="text-xs text-gray-400">{offer.network || 'Network'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">{Number(offer.payout_decimal).toFixed(2)} LE</span>
                  {expandedId === offer.id ? <ChevronUp size={18} className="text-orange-500" /> : <ChevronDown size={18} className="text-gray-500" />}
                </div>
              </div>
              
              {/* التفاصيل المنسدلة */}
              {expandedId === offer.id && (
                <div className="px-4 pb-4 text-sm text-gray-400 border-t border-gray-800 pt-3">
                  <div className="flex justify-between mb-2"><span>Reward</span> <span className="text-white">{Number(offer.payout_decimal).toFixed(2)} LE</span></div>
                  <div className="flex justify-between mb-2"><span>Transaction ID</span> <span className="text-white text-xs">{offer.transaction_id}</span></div>
                  <div className="flex justify-between"><span>Date</span> <span className="text-white">{new Date(offer.created_at).toLocaleDateString()}</span></div>
                </div>
              )}
            </div>
          ))
        )}

        {/* تبويب السحب */}
        {activeTab === 'cashout' && (
          loading ? <p className="text-center text-gray-500">Loading cashouts...</p> :
          withdrawals.length === 0 ? <p className="text-center text-gray-500">No cashouts requested yet.</p> :
          withdrawals.map((w) => (
            <div key={w.id} className="bg-[#181a20] rounded-xl border border-gray-800 overflow-hidden">
              <div onClick={() => toggleDetails(w.id)} className="p-4 flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center font-bold text-xl text-white">
                    B
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Binance Cashout</h4>
                    <p className="text-xs text-gray-400">{w.status === 'pending' ? 'Pending' : 'Completed'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">{Number(w.amount).toFixed(2)} LE</span>
                  {expandedId === w.id ? <ChevronUp size={18} className="text-orange-500" /> : <ChevronDown size={18} className="text-gray-500" />}
                </div>
              </div>

              {/* التفاصيل المنسدلة */}
              {expandedId === w.id && (
                <div className="px-4 pb-4 text-sm text-gray-400 border-t border-gray-800 pt-3">
                  <div className="flex justify-between mb-2"><span>Status</span> <span className={`font-bold ${w.status === 'pending' ? 'text-yellow-500' : 'text-green-500'}`}>{w.status.toUpperCase()}</span></div>
                  <div className="flex justify-between mb-2"><span>Wallet</span> <span className="text-white text-xs line-clamp-1">{w.wallet_address}</span></div>
                  <div className="flex justify-between"><span>Date</span> <span className="text-white">{new Date(w.created_at).toLocaleDateString()}</span></div>
                </div>
              )}
            </div>
          ))
        )}

        {/* تبويب الاستبيانات (فارغ حالياً) */}
        {activeTab === 'surveys' && (
          <p className="text-center text-gray-500 py-10">No surveys available yet.</p>
        )}

      </div>
    </div>
  );
}