import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import { Check, X, Users, Wallet, ArrowLeft, History, Calendar, Search, Trash2, Copy } from 'lucide-react';

export default function Admin() {
  const { navigate } = useApp();
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'users'>('withdrawals');
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // تفاصيل المستخدم
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userOffers, setUserOffers] = useState<any[]>([]);

  // البحث والتحديد للمستخدمين
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserSelectionMode, setIsUserSelectionMode] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const userPressTimer = useRef<any>(null);

  // التحديد للسحوبات
  const [isWithdrawalSelectionMode, setIsWithdrawalSelectionMode] = useState(false);
  const [selectedWithdrawalIds, setSelectedWithdrawalIds] = useState<string[]>([]);
  const withdrawalPressTimer = useRef<any>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data: wData } = await supabase.from('withdrawals').select('*').order('created_at', { ascending: false });
    if (wData) setWithdrawals(wData);

    const { data: uData } = await supabase.from('app_users').select('*').order('created_at', { ascending: false });
    if (uData) setUsers(uData);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- دوال السحوبات ---
  const handleApprove = async (id: string) => {
    await supabase.from('withdrawals').update({ status: 'Completed' }).eq('id', id);
    fetchData();
  };

  const handleReject = async (withdrawal: any) => {
    await supabase.from('withdrawals').update({ status: 'Rejected' }).eq('id', withdrawal.id);
    const { data: user } = await supabase.from('app_users').select('balance').eq('id', withdrawal.user_id).single();
    if (user) {
      const newBalance = (user.balance || 0) + withdrawal.amount;
      await supabase.from('app_users').update({ balance: newBalance }).eq('id', withdrawal.user_id);
    }
    fetchData();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied: ' + text);
  };

  const startWithdrawalPress = (id: string) => {
    withdrawalPressTimer.current = setTimeout(() => {
      setIsWithdrawalSelectionMode(true);
      setSelectedWithdrawalIds([id]);
    }, 500);
  };

  const cancelWithdrawalPress = () => {
    if (withdrawalPressTimer.current) clearTimeout(withdrawalPressTimer.current);
  };

  const toggleSelectWithdrawal = (id: string) => {
    setSelectedWithdrawalIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAllWithdrawals = () => {
    if (selectedWithdrawalIds.length === withdrawals.length) {
      setSelectedWithdrawalIds([]);
    } else {
      setSelectedWithdrawalIds(withdrawals.map(w => w.id));
    }
  };

  const handleDeleteWithdrawals = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedWithdrawalIds.length} withdrawal record(s)?`)) return;
    setLoading(true);
    const { error } = await supabase.from('withdrawals').delete().in('id', selectedWithdrawalIds);
    if (error) alert("Error: " + error.message);
    else {
      setSelectedWithdrawalIds([]);
      setIsWithdrawalSelectionMode(false);
      await fetchData();
    }
    setLoading(false);
  };

  // --- دوال المستخدمين ---
  const handleUserClick = async (user: any) => {
    if (isUserSelectionMode) {
      toggleSelectUser(user.id);
      return;
    }
    setSelectedUser(user);
    const { data } = await supabase.from('postback_log').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setUserOffers(data);
  };

  const startUserPress = (userId: string) => {
    userPressTimer.current = setTimeout(() => {
      setIsUserSelectionMode(true);
      setSelectedUserIds([userId]);
    }, 500);
  };

  const cancelUserPress = () => {
    if (userPressTimer.current) clearTimeout(userPressTimer.current);
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map(u => u.id));
    }
  };

  const handleDeleteUsers = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedUserIds.length} user(s)?`)) return;
    setLoading(true);
    const { error } = await supabase.from('app_users').delete().in('id', selectedUserIds);
    if (error) alert("Error: " + error.message);
    else {
      setSelectedUserIds([]);
      setIsUserSelectionMode(false);
      await fetchData();
    }
    setLoading(false);
  };

  const filteredUsers = users.filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase()));

  // ---------------- شاشة تفاصيل المستخدم ----------------
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

  // ---------------- الشاشة الرئيسية ----------------
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 pb-10">
      
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('profile')} className="p-2 bg-[#161616] rounded-xl text-gray-400 hover:text-white transition">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-orange-500">Admin Dashboard</h1>
      </div>

      <div className="flex gap-4 mb-6">
        <button onClick={() => { setActiveTab('withdrawals'); setIsUserSelectionMode(false); setIsWithdrawalSelectionMode(false); }} className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition ${activeTab === 'withdrawals' ? 'bg-orange-500 text-white' : 'bg-[#161616] text-gray-400'}`}>
          <Wallet className="h-5 w-5" /> Withdrawals
        </button>
        <button onClick={() => { setActiveTab('users'); setIsUserSelectionMode(false); setIsWithdrawalSelectionMode(false); }} className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition ${activeTab === 'users' ? 'bg-orange-500 text-white' : 'bg-[#161616] text-gray-400'}`}>
          <Users className="h-5 w-5" /> Users
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 mt-10">Loading data...</p>
      ) : activeTab === 'withdrawals' ? (
        
        // ================= قسم السحوبات =================
        <div>
          {isWithdrawalSelectionMode ? (
            <div className="flex items-center justify-between bg-[#1a1a1a] p-3 rounded-xl border border-gray-700 mb-4">
              <div className="flex items-center gap-3">
                <button onClick={() => { setIsWithdrawalSelectionMode(false); setSelectedWithdrawalIds([]); }} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
                <span className="font-bold text-orange-500">{selectedWithdrawalIds.length} Selected</span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={selectAllWithdrawals} className="text-sm font-bold text-blue-400 hover:text-blue-300">
                  {selectedWithdrawalIds.length === withdrawals.length ? 'Deselect All' : 'Select All'}
                </button>
                <button 
                  onClick={handleDeleteWithdrawals} 
                  disabled={selectedWithdrawalIds.length === 0}
                  className={`p-2 rounded-lg transition ${selectedWithdrawalIds.length > 0 ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-gray-800 text-gray-500'}`}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500 mb-2 text-center">Long press on any withdrawal to select and delete.</p>
          )}

          <div className="space-y-4">
            {withdrawals.length === 0 && <p className="text-gray-500 text-center">No withdrawals found.</p>}
            {withdrawals.map((w) => {
              const isSelected = selectedWithdrawalIds.includes(w.id);
              
              return (
                <div 
                  key={w.id} 
                  onTouchStart={() => startWithdrawalPress(w.id)}
                  onTouchEnd={cancelWithdrawalPress}
                  onMouseDown={() => startWithdrawalPress(w.id)}
                  onMouseUp={cancelWithdrawalPress}
                  onMouseLeave={cancelWithdrawalPress}
                  onClick={() => { if(isWithdrawalSelectionMode) toggleSelectWithdrawal(w.id); }}
                  className={`bg-[#161616] border p-4 rounded-2xl flex flex-col gap-3 transition-all ${
                    isSelected ? 'border-orange-500 bg-[#1f1a16]' : 'border-gray-800'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                       {isWithdrawalSelectionMode && (
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-orange-500 border-orange-500' : 'border-gray-600'}`}>
                          {isSelected && <Check size={14} className="text-white" />}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-lg text-white">{w.amount} LE</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-400">User ID: {w.user_id.slice(0, 8)}...</p>
                          <button onClick={(e) => { e.stopPropagation(); copyToClipboard(w.user_id); }} className="text-gray-500 hover:text-white">
                            <Copy size={12} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-500">Wallet: {w.wallet_address}</p>
                          <button onClick={(e) => { e.stopPropagation(); copyToClipboard(w.wallet_address); }} className="text-gray-500 hover:text-white">
                            <Copy size={12} />
                          </button>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{new Date(w.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${w.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : w.status === 'Completed' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                      {w.status}
                    </span>
                  </div>
                  
                  {w.status === 'pending' && !isWithdrawalSelectionMode && (
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
              );
            })}
          </div>
        </div>

      ) : (
        
        // ================= قسم المستخدمين =================
        <div>
          {isUserSelectionMode ? (
            <div className="flex items-center justify-between bg-[#1a1a1a] p-3 rounded-xl border border-gray-700 mb-4">
              <div className="flex items-center gap-3">
                <button onClick={() => { setIsUserSelectionMode(false); setSelectedUserIds([]); }} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
                <span className="font-bold text-orange-500">{selectedUserIds.length} Selected</span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={selectAllUsers} className="text-sm font-bold text-blue-400 hover:text-blue-300">
                  {selectedUserIds.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
                </button>
                <button 
                  onClick={handleDeleteUsers} 
                  disabled={selectedUserIds.length === 0}
                  className={`p-2 rounded-lg transition ${selectedUserIds.length > 0 ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-gray-800 text-gray-500'}`}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ) : (
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Search users by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#161616] border border-gray-800 text-white rounded-xl pl-10 p-3 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          )}

          <div className="space-y-3">
            {filteredUsers.length === 0 && <p className="text-gray-500 text-center mt-4">No users found.</p>}
            {filteredUsers.map((u) => {
              const isSelected = selectedUserIds.includes(u.id);
              return (
                <div 
                  key={u.id} 
                  onTouchStart={() => startUserPress(u.id)}
                  onTouchEnd={cancelUserPress}
                  onMouseDown={() => startUserPress(u.id)}
                  onMouseUp={cancelUserPress}
                  onMouseLeave={cancelUserPress}
                  onClick={() => handleUserClick(u)} 
                  className={`bg-[#161616] border p-4 rounded-xl flex justify-between items-center cursor-pointer transition-all ${
                    isSelected ? 'border-orange-500 bg-[#1f1a16]' : 'border-gray-800 hover:bg-[#1a1a1a]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isUserSelectionMode && (
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-orange-500 border-orange-500' : 'border-gray-600'}`}>
                        {isSelected && <Check size={14} className="text-white" />}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-white">{u.email}</p>
                        <button onClick={(e) => { e.stopPropagation(); copyToClipboard(u.email); }} className="text-gray-500 hover:text-white">
                          <Copy size={12} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-400">Role: <span className={u.role === 'admin' ? 'text-red-500' : 'text-gray-500'}>{u.role || 'user'}</span></p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Calendar size={12} /> Joined: {new Date(u.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-orange-500">{u.balance} LE</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}