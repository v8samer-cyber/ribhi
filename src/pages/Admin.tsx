import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, X, Users, Wallet } from 'lucide-react';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'users'>('withdrawals');
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    fetchData(); // تحديث القائمة
  };

  // دالة رفض السحب (مع إرجاع المبلغ للرصيد)
  const handleReject = async (withdrawal: any) => {
    // 1. تحديث حالة السحب
    await supabase.from('withdrawals').update({ status: 'Rejected' }).eq('id', withdrawal.id);
    
    // 2. إرجاع المبلغ للمستخدم
    const { data: user } = await supabase.from('app_users').select('balance').eq('id', withdrawal.user_id).single();
    if (user) {
      const newBalance = (user.balance || 0) + withdrawal.amount;
      await supabase.from('app_users').update({ balance: newBalance }).eq('id', withdrawal.user_id);
    }
    
    fetchData(); // تحديث القائمة
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <h1 className="text-2xl font-bold mb-6 text-orange-500">Admin Dashboard</h1>

      {/* التبويبات */}
      <div className="flex gap-4 mb-6">
        <button onClick={() => setActiveTab('withdrawals')} className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold ${activeTab === 'withdrawals' ? 'bg-orange-500 text-white' : 'bg-[#161616] text-gray-400'}`}>
          <Wallet className="h-5 w-5" /> Withdrawals
        </button>
        <button onClick={() => setActiveTab('users')} className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold ${activeTab === 'users' ? 'bg-orange-500 text-white' : 'bg-[#161616] text-gray-400'}`}>
          <Users className="h-5 w-5" /> Users
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-500">Loading data...</p>
      ) : activeTab === 'withdrawals' ? (
        <div className="space-y-4">
          {withdrawals.length === 0 && <p className="text-gray-500">No withdrawals found.</p>}
          {withdrawals.map((w) => (
            <div key={w.id} className="bg-[#161616] border border-gray-800 p-4 rounded-2xl flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-lg">{w.amount} LE</p>
                  <p className="text-xs text-gray-400">User ID: {w.user_id.slice(0, 8)}...</p>
                  <p className="text-xs text-gray-500 mt-1">Wallet: {w.wallet_address}</p>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${w.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : w.status === 'Completed' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                  {w.status}
                </span>
              </div>
              
              {w.status === 'pending' && (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => handleApprove(w.id)} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl flex items-center justify-center gap-2 font-bold">
                    <Check size={18} /> Approve
                  </button>
                  <button onClick={() => handleReject(w)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl flex items-center justify-center gap-2 font-bold">
                    <X size={18} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className="bg-[#161616] border border-gray-800 p-4 rounded-xl flex justify-between items-center">
              <div>
                <p className="font-bold">{u.email}</p>
                <p className="text-xs text-gray-400">Role: {u.role || 'user'}</p>
              </div>
              <p className="font-bold text-orange-500">{u.balance} LE</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}