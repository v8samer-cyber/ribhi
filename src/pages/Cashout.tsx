import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../supabaseClient';

export default function Cashout() {
  const { user, setUser, navigate } = useApp();
  const [wallet, setWallet] = useState('');
  const [loading, setLoading] = useState(false);

  const MIN_WITHDRAWAL = 100; 

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert("يجب تسجيل الدخول أولاً");
      navigate('signin');
      return;
    }

    if (user.balance < MIN_WITHDRAWAL) {
      alert(`الحد الأدنى للسحب هو ${MIN_WITHDRAWAL} نقطة. رصيدك لا يكفي.`);
      return;
    }

    if (!wallet.trim()) {
      alert("يرجى إدخال إيميل أو حساب Binance");
      return;
    }

    setLoading(true);

    const withdrawAmount = MIN_WITHDRAWAL; 
    const newBalance = user.balance - withdrawAmount;

    const { error: updateError } = await supabase
      .from('app_users')
      .update({ balance: newBalance })
      .eq('id', user.id);

    if (updateError) {
      alert("حدث خطأ أثناء خصم الرصيد: " + updateError.message);
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from('withdrawals')
      .insert([{
        user_id: user.id,
        email: user.email,
        amount: withdrawAmount / 1000,
        wallet_address: wallet,
        status: 'pending'
      }]);

    if (insertError) {
      alert("حدث خطأ أثناء تسجيل الطلب: " + insertError.message);
      setLoading(false);
      return;
    }

    const updatedUser = { ...user, balance: newBalance };
    setUser(updatedUser);
    localStorage.setItem('lootearn_user', JSON.stringify(updatedUser));

    alert(`تم تقديم طلب السحب بنجاح! سيتم تحويل 0.10 دولار إلى حسابك.`);
    setWallet('');
    setLoading(false);
  };

  if (!user) {
    return <div className="text-white text-center mt-20">Please Sign In first.</div>;
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center pt-10 pb-28 px-4 text-white">
      
      {/* العنوان أصبح أبيض بدون أي كلام برتقالي تحته */}
      <h1 className="text-3xl font-bold text-white mb-6">Withdraw Funds</h1>

      <div className="bg-[#1e293b] p-6 rounded-xl w-full max-w-sm border border-gray-700 relative z-50">
        
        {/* هنا: الرصيد الأخضر، وبجانبه مباشرة عبارة الحد الأدنى */}
        <div className="mb-8 text-center flex flex-col items-center">
          <p className="text-gray-400 text-sm mb-2">Your Balance</p>
          <div className="flex items-center gap-3">
             <p className="text-3xl font-bold text-green-400">${(user.balance / 1000).toFixed(2)}</p>
             <span className="text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded border border-gray-600">
               Min: 100 Pts
             </span>
          </div>
          <p className="text-gray-500 text-xs mt-2">({user.balance} Points)</p>
        </div>

        <form onSubmit={handleWithdraw} className="space-y-6 relative z-50">
          <div>
            {/* خانة الإيميل أصبحت نظيفة وواضحة */}
            <label className="block text-sm font-medium text-gray-300 mb-2">Binance Account / Email</label>
            <input 
              type="text" 
              value={wallet} 
              onChange={(e) => setWallet(e.target.value)} 
              placeholder="Enter your Binance email or wallet"
              className="w-full p-3 rounded-lg bg-black text-white border border-gray-600 focus:outline-none focus:border-blue-500 relative z-50"
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || user.balance < MIN_WITHDRAWAL} 
            className={`w-full p-3 rounded-lg font-bold transition relative z-50 ${
              user.balance < MIN_WITHDRAWAL 
                ? 'bg-gray-600 cursor-not-allowed text-gray-400' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? 'Processing...' : user.balance < MIN_WITHDRAWAL ? 'Not Enough Balance' : 'Request Withdrawal'}
          </button>
        </form>
      </div>
    </div>
  );
}