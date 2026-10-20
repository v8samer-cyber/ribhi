import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import { Check, X, Users, Wallet, ArrowLeft, History, Calendar } from 'lucide-react';

export default function Admin() {
  const { navigate } = useApp();
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'users'>('withdrawals');
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // حالة عرض تفاصيل مستخدم معين
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userOffers, setUserOffers] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    // جلب السحوبات
    const { data: wData } = await supabase.from('withdrawals').select('*').order('created_at', { ascending: false });
    if (wData) setWithdrawals(wData);

    // جلب المستخدمين
    const { data: uData } = await supabase.from('app_users').select('*').order('created_at', { ascending: false });
    if (uData) setUsers(uData);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // دالة الموافقة على السحب
  const handleApprove = async (id: string) => {
    await supabase.from('withdrawals').update({ status: 'Completed' }).eq('id', id);
    fetchData();
  };

  // دالة رفض السحب (مع إرجاع المبلغ للرصيد)
  const handleReject = async (withdrawal: any) => {
    await supabase.from('withdrawals').update({ status: 'Rejected' }).eq('id', withdrawal.id);
    
    const { data: user } = await supabase.from('app_users').select('balance').eq('id', withdrawal.user_id).single();
    if (user) {
      const newBalance = (user.balance || 0) + withdrawal.amount;
      await supabase.from('app_users').update({ balance: newBalance }).eq('id', withdrawal.user_id);
    }
    fetchData();
  };

  // دالة عرض تفاصيل المستخدم وعروضه
  const handleUserClick = async (user: any) => {
    setSelectedUser(user);
    const { data } = await supabase
      .from('postback_log')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data) setUserOffers(data);
  };

  // ---------------- شاشة تفاصيل المستخدم (إذا تم اختيار مستخدم) ----------------
  if (selectedUser) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-6 pb-10">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setSelectedUser(null)} className="p-2 bg-[#161616] rounded-xl text-gray-400 hover:text-white transition">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-orange-500">User Details</h1>
        </div>

        <div className="bg-[#161616] p-5 rounded-2xl border border-gray-800 mb-6">
          <p className="text-lg font-bold text-white mb-2">{selectedUser.email}</p>
          <div className="flex justify-between text-sm py-2 border-b border-gray-800">
            <span className="text-gray-400">Role:</span>
            <span className="text-blue-400 font-bold">{selectedUser.role || 'user'}</span>
          </div>
          <div className="flex justify-between text-sm py-2 border-b border-gray-800">
            <span className="text-gray-400">Balance:</span>
            <span className="text-orange-500 font-bold">{selectedUser.balance} LE</span>
          </div>
          <div className="flex justify-between text-sm py-2">
            <span className="text-gray-400">Joined:</span>
            <span className="text-gray-300">{new Date(selectedUser.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <History size={20} className="text-orange-500" /> Offer History
        </h2>
        
        <div className="space-y-3">
          {userOffers.length === 0 ? (
            <p className="text-gray-500 text-sm">This user has not completed any offers yet.</p>
          ) : (
            userOffers.map((offer) => (
              <div key={offer.id} className="bg-[#161616] border border-gray-800 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm text-white">{offer.provider || 'Offer'}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Calendar size={12} /> {new Date(offer.created_at).toLocaleString()}
                  </p>
                </div>
                <span className="font-bold text-orange-500">+{offer.amount} LE</span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // ---------------- الشاشة الرئيسية للوحة التحكم ----------------
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 pb-10">
      
      {/* الهيدر مع زر الرجوع */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('profile')} className="p-2 bg-[#161616] rounded-xl text-gray-400 hover:text-white transition">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-orange-500">Admin Dashboard</h1>
      </div>

      {/* التبويبات */}
      <div className="flex gap-4 mb-6">
        <button onClick={() => setActiveTab('withdrawals')} className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition ${activeTab === 'withdrawals' ? 'bg-orange-500 text-white' : 'bg-[#161616] text-gray-400'}`}>
          <Wallet className="h-5 w-5" /> Withdrawals
        </button>
        <button onClick={() => setActiveTab('users')} className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition ${activeTab === 'users' ? 'bg-orange-500 text-white' : 'bg-[#161616] text-gray-400'}`}>
          <Users className="h-5 w-5" /> Users
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 mt-10">Loading data...</p>
      ) : activeTab === 'withdrawals' ? (
        // قسم السحوبات
        <div className="space-y-4">
          {withdrawals.length === 0 && <p className="text-gray-500 text-center">No withdrawals found.</p>}
          {withdrawals.map((w) => (
            <div key={w.id} className="bg-[#161616] border border-gray-800 p-4 rounded-2xl flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-lg text-white">{w.amount} LE</p>
                  <p className="text-xs text-gray-400">User ID: {w.user_id.slice(0, 8)}...</p>
                  <p className="text-xs text-gray-500 mt-1">Wallet: {w.wallet_address}</p>
                  <p className="text-xs text-gray-600 mt-1">{new Date(w.created_at).toLocaleString()}</p>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${w.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : w.status === 'Completed' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                  {w.status}
                </span>
              </div>
              
              {w.status === 'pending' && (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => handleApprove(w.id)} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl flex items-center justify-center gap-2 font-bold text-sm">
                    <Check size={18} /> Approve
                  </button>
                  <button onClick={() => handleReject(w)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl flex items-center justify-center gap-2 font-bold text-sm">
                    <X size={18} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        // قسم المستخدمين
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} onClick={() => handleUserClick(u)} className="bg-[#161616] border border-gray-800 p-4 rounded-xl flex justify-between items-center cursor-pointer hover:bg-[#1a1a1a] transition">
              <div>
                <p className="font-bold text-sm text-white">{u.email}</p>
                <p className="text-xs text-gray-400">Role: <span className={u.role === 'admin' ? 'text-red-500' : 'text-gray-500'}>{u.role || 'user'}</span></p>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Calendar size={12} /> Joined: {new Date(u.created_at).toLocaleDateString()}
                </p>
              </div>
              <p className="font-bold text-orange-500">{u.balance} LE</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}