import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { Target, Coins, Wallet, LogOut } from 'lucide-react';

export default function Profile() {
  const { user, setUser, navigate } = useApp();
  const [offers, setOffers] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  // جلب البيانات الحقيقية من قاعدة البيانات
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // جلب العروض
      const { data: offersData } = await supabase
        .from('postback_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (offersData) setOffers(offersData);

      // جلب السحوبات
      const { data: withdrawalsData } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (withdrawalsData) setWithdrawals(withdrawalsData);
    };

    fetchData();
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('loot_user');
    localStorage.removeItem('loot_page');
    setUser(null);
    navigate('home');
  };

  const username = user?.email ? user.email.split('@')[0] : 'User';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 pb-24">
      <h1 className="text-2xl font-bold mb-6 mt-2">Profile</h1>
      
      {/* كرت المستخدم */}
      <div className="bg-[#161616] p-6 rounded-3xl border border-gray-800 flex flex-col items-center mb-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-red-500 p-1 mb-4">
          <div className="w-full h-full bg-[#161616] rounded-full flex items-center justify-center text-4xl font-bold text-orange-500">
            {username.charAt(0).toUpperCase()}
          </div>
        </div>
        <h2 className="text-xl font-bold">{username}</h2>
        <p className="text-gray-400 text-sm mb-4">{user?.email}</p>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[#161616] p-4 rounded-2xl border border-gray-800">
          <div className="flex justify-between items-start mb-2">
            <span className="text-gray-400 text-xs font-medium">Offer Completed</span>
            <Target className="h-4 w-4 text-red-500" />
          </div>
          <p className="text-xl font-bold">{offers.length}</p>
        </div>

        <div className="bg-[#161616] p-4 rounded-2xl border border-gray-800">
          <div className="flex justify-between items-start mb-2">
            <span className="text-gray-400 text-xs font-medium">Current Balance</span>
            <Coins className="h-4 w-4 text-yellow-500" />
          </div>
          <p className="text-xl font-bold text-orange-500">{Number(user?.balance || 0).toFixed(2)} LE</p>
        </div>
      </div>

      {/* سجل العروض */}
      <div className="bg-[#161616] p-5 rounded-2xl border border-gray-800 mb-6">
        <h2 className="text-lg font-bold mb-4">Offer History</h2>
        {offers.length === 0 ? (
          <p className="text-gray-500 text-sm text-center">No offers completed yet.</p>
        ) : (
          <div className="space-y-3">
            {offers.map((offer) => (
              <div key={offer.id} className="flex justify-between items-center bg-black p-3 rounded-xl border border-gray-800">
                <div>
                  <p className="font-bold text-sm">{offer.provider || 'Offer'}</p>
                  <p className="text-xs text-gray-500">{new Date(offer.created_at).toLocaleString()}</p>
                </div>
                <span className="text-green-500 font-bold">+{offer.amount} LE</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* سجل السحوبات */}
      <div className="bg-[#161616] p-5 rounded-2xl border border-gray-800 mb-6">
        <h2 className="text-lg font-bold mb-4">Withdrawal History</h2>
        {withdrawals.length === 0 ? (
          <p className="text-gray-500 text-sm text-center">No withdrawals yet.</p>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((w) => (
              <div key={w.id} className="flex justify-between items-center bg-black p-3 rounded-xl border border-gray-800">
                <div>
                  <p className="font-bold text-sm">Binance Withdrawal</p>
                  <p className="text-xs text-gray-500">{new Date(w.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span className="text-red-500 font-bold block">-{w.amount} LE</span>
                  <span className="text-[10px] text-yellow-500 uppercase">{w.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button 
        onClick={handleLogout} 
        className="w-full bg-[#161616] border border-red-500/30 text-red-500 font-bold py-4 rounded-2xl hover:bg-red-500/10 transition flex items-center justify-center gap-2"
      >
        <LogOut className="h-5 w-5" />
        Logout
      </button>
    </div>
  );
}