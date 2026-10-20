import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { LogOut, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';

export default function Profile() {
  const { user, setUser, navigate } = useApp();
  const [activeTab, setActiveTab] = useState<'offers' | 'surveys' | 'cashout'>('offers');
  const [offers, setOffers] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // جلب البيانات الحقيقية
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: offersData } = await supabase.from('postback_log').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (offersData) setOffers(offersData);
      const { data: withdrawalsData } = await supabase.from('withdrawals').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (withdrawalsData) setWithdrawals(withdrawalsData);
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('loot_user');
    localStorage.removeItem('loot_page');
    setUser(null);
    navigate('home');
  };

  const toggleExpand = (id: string) => setExpandedId(expandedId === id ? null : id);
  const username = user?.email ? user.email.split('@')[0] : 'User';
  const getIconLetter = (provider: string) => provider ? provider.charAt(0).toUpperCase() : 'O';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 pb-24">
      {/* كرت المستخدم */}
      <div className="bg-[#161616] p-6 rounded-3xl border border-gray-800 flex flex-col items-center mb-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-red-500 p-1 mb-4">
          <div className="w-full h-full bg-[#161616] rounded-full flex items-center justify-center text-3xl font-bold text-orange-500">
            {username.charAt(0).toUpperCase()}
          </div>
        </div>
        <h2 className="text-xl font-bold">{username}</h2>
        <p className="text-gray-400 text-sm">{user?.email}</p>
        {user?.role === 'admin' && <span className="mt-2 bg-red-500 text-white text-xs px-2 py-1 rounded">ADMIN</span>}
      </div>

      {/* التبويبات */}
      <div className="flex justify-around bg-[#161616] rounded-xl p-1 mb-6 border border-gray-800">
        {['offers', 'surveys', 'cashout'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-2 text-sm font-bold capitalize rounded-lg transition ${activeTab === tab ? 'bg-orange-500 text-white' : 'text-gray-400'}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {/* العروض */}
        {activeTab === 'offers' && (
          offers.length === 0 ? <p className="text-center text-gray-500 mt-10">No offers completed yet.</p> :
          offers.map((offer) => (
            <div key={offer.id} className="bg-[#161616] border border-gray-800 rounded-2xl overflow-hidden">
              <div onClick={() => toggleExpand(offer.id)} className="p-4 flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center text-xl font-bold">{getIconLetter(offer.provider)}</div>
                  <div><p className="font-bold text-sm">{offer.provider || 'Offer'}</p><p className="text-xs text-gray-400">{offer.status}</p></div>
                </div>
                <div className="flex items-center gap-3"><span className="font-bold text-orange-500">{offer.amount} LE</span>{expandedId === offer.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
              </div>
              {expandedId === offer.id && (
                <div className="px-4 pb-4 border-t border-gray-800 pt-3 text-sm">
                  <div className="flex justify-between py-1"><span className="text-gray-400">Transaction ID</span><span className="font-mono text-xs">{offer.transaction_id || 'N/A'}</span></div>
                  <div className="flex justify-between py-1"><span className="text-gray-400">Date</span><span>{new Date(offer.created_at).toLocaleString()}</span></div>
                </div>
              )}
            </div>
          ))
        )}

        {/* الاستبيانات */}
        {activeTab === 'surveys' && <p className="text-center text-gray-500 mt-10">No surveys available at the moment.</p>}

        {/* السحوبات */}
        {activeTab === 'cashout' && (
          withdrawals.length === 0 ? <p className="text-center text-gray-500 mt-10">No withdrawals yet.</p> :
          withdrawals.map((w) => (
            <div key={w.id} className="bg-[#161616] border border-gray-800 rounded-2xl overflow-hidden">
              <div onClick={() => toggleExpand(w.id)} className="p-4 flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-xl font-bold">B</div>
                  <div><p className="font-bold text-sm">Binance</p><p className="text-xs text-gray-400">Cashout</p></div>
                </div>
                <div className="flex items-center gap-3"><span className="font-bold text-orange-500">{w.amount} LE</span>{expandedId === w.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
              </div>
              {expandedId === w.id && (
                <div className="px-4 pb-4 border-t border-gray-800 pt-3 text-sm">
                  <div className="flex justify-between py-1"><span className="text-gray-400">Status</span><span className="text-yellow-500 uppercase">{w.status}</span></div>
                  <div className="flex justify-between py-1"><span className="text-gray-400">Date</span><span>{new Date(w.created_at).toLocaleString()}</span></div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* زر لوحة التحكم (يطلع بس للأدمن) */}
      {(user?.role === 'admin' || user?.email === 'v8samer@gmail.com') && (
        <button onClick={() => navigate('admin')} className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition flex items-center justify-center gap-2">
          <ShieldAlert className="h-5 w-5" /> Admin Dashboard
        </button>
      )}

      {/* زر الخروج */}
      <button onClick={handleLogout} className="mt-4 w-full bg-[#161616] border border-red-500/30 text-red-500 font-bold py-4 rounded-2xl hover:bg-red-500/10 transition flex items-center justify-center gap-2">
        <LogOut className="h-5 w-5" /> Logout
      </button>
    </div>
  );
}