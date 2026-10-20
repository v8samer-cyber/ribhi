import { useApp } from '@/context/AppContext';

export default function Profile() {
  const { user, setUser, navigate } = useApp();

  const handleLogout = () => {
    // نمسح بيانات المستخدم من الذاكرة
    localStorage.removeItem('loot_user');
    localStorage.removeItem('loot_page');
    // نرجع المستخدم لصفحة البداية
    setUser(null);
    navigate('home');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 pb-24">
      <h1 className="text-2xl font-bold mb-6 mt-2">Profile</h1>
      
      {/* كرت البروفايل */}
      <div className="bg-[#161616] p-6 rounded-2xl border border-gray-800 mb-6 relative overflow-hidden text-center">
        <div className="w-20 h-20 bg-pink-200 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl border-2 border-orange-500 text-orange-500">
          {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
        </div>
        
        <h2 className="text-xl font-bold mb-1">{user?.email ? user.email.split('@')[0] : 'User'}</h2>
        <p className="text-gray-500 text-xs mb-6">{user?.email || 'No email'}</p>
        
        {/* الإحصائيات */}
        <div className="grid grid-cols-2 gap-4 text-left">
          <div className="bg-black p-3 rounded-xl border border-gray-800 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">Offer Completed</p>
              <p className="font-bold text-white mt-1">0</p>
            </div>
            <span className="text-gray-600">🎯</span>
          </div>
          
          <div className="bg-black p-3 rounded-xl border border-gray-800 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">Total Earned</p>
              <p className="font-bold text-orange-500 mt-1">{Number(user?.balance || 0).toFixed(2)} LE</p>
            </div>
            <span className="text-gray-600">💰</span>
          </div>

          <div className="bg-black p-3 rounded-xl border border-gray-800 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">Total Withdrawn</p>
              <p className="font-bold text-white mt-1">0.00 LE</p>
            </div>
            <span className="text-gray-600">💸</span>
          </div>

          <div className="bg-black p-3 rounded-xl border border-gray-800 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">Current Balance</p>
              <p className="font-bold text-white mt-1">{Number(user?.balance || 0).toFixed(2)} LE</p>
            </div>
            <span className="text-gray-600">🏦</span>
          </div>
        </div>
      </div>

      {/* زر الخروج */}
      <button 
        onClick={handleLogout} 
        className="w-full bg-red-500/10 text-red-500 border border-red-500/30 font-bold py-3 rounded-xl hover:bg-red-500/20 transition"
      >
        Logout
      </button>
    </div>
  );
}