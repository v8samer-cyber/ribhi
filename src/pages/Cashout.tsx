import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';

export default function Cashout() {
  const { user, setUser } = useApp();
  const [wallet, setWallet] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const currentBalance = user?.balance || 0;
  const minWithdrawCash = 1000; 
  const canWithdraw = currentBalance >= Number(amount) && Number(amount) >= minWithdrawCash;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWithdraw || !user) return;

    setLoading(true);

    try {
      // 1. تسجيل السحب في جدول السحوبات
      const { error: withdrawError } = await supabase
        .from('withdrawals')
        .insert([{
          user_id: user.id,
          amount: Number(amount),
          wallet_address: wallet,
          status: 'pending'
        }]);

      if (withdrawError) throw withdrawError;

      // 2. خصم المبلغ من رصيد المستخدم
      const newBalance = currentBalance - Number(amount);
      const { error: updateError } = await supabase
        .from('app_users')
        .update({ balance: newBalance })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 3. تحديث الواجهة
      setUser({ ...user, balance: newBalance });
      setAmount('');
      setWallet('');
      alert(`Withdrawal request of ${amount} LE to Binance submitted successfully!`);

    } catch (error) {
      console.error(error);
      alert('Failed to process withdrawal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 pb-24">
      <h1 className="text-2xl font-bold mb-6 mt-2">Cashout</h1>
      
      <div className="bg-[#161616] p-6 rounded-2xl border border-gray-800 text-center mb-6">
        <p className="text-gray-400 mb-2">Available Balance</p>
        <p className="text-4xl font-bold text-orange-500">{currentBalance} LE</p>
        <p className="text-gray-400 text-sm mt-2">Every 1000 Cash = $1.00 USD</p>
      </div>

      <form onSubmit={handleWithdraw} className="bg-[#161616] p-6 rounded-2xl border border-gray-800 space-y-4">
        <h2 className="text-lg font-bold mb-2">Withdraw to Binance</h2>
        
        <div>
          <label className="block text-sm text-gray-400 mb-1">Binance Wallet Address (BEP20)</label>
          <input 
            type="text" 
            value={wallet} 
            onChange={(e) => setWallet(e.target.value)} 
            required 
            className="w-full bg-black border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-orange-500" 
            placeholder="Enter your Binance address" 
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Amount (Min 1000 LE)</label>
          <input 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
            required 
            min={minWithdrawCash}
            className="w-full bg-black border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-orange-500" 
            placeholder="1000" 
          />
        </div>

        <button 
          type="submit" 
          disabled={!canWithdraw || loading}
          className={`w-full font-bold py-3 rounded-xl mt-2 transition ${
            !canWithdraw || loading ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600'
          }`}
        >
          {loading ? 'Processing...' : canWithdraw ? 'Request Withdrawal' : 'Insufficient Balance'}
        </button>
      </form>
    </div>
  );
}