import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '../supabaseClient'; // تم استدعاء قاعدة البيانات

export default function SignUp() {
  const { navigate, setUser } = useApp();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    // إرسال البيانات الحقيقية إلى Supabase
    const { data, error } = await supabase
      .from('app_users')
      .insert([
        { email: email, password: password, balance: 0 } // إضافة الإيميل والباسورد
      ])
      .select()
      .single();

    setLoading(false);

    if (error) {
      console.error(error);
      setErrorMsg("حدث خطأ: " + error.message);
      return;
    }

    // إذا نجح الحفظ، يتم تسجيل الدخول ونقله للعروض
    setUser(data); 
    navigate('earn'); 
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center p-6 text-white pb-20">
      <h1 className="text-3xl font-bold mb-8 text-orange-500">Create Account</h1>
      
      {errorMsg && (
        <div className="bg-red-500 text-white p-3 rounded mb-4 text-sm w-full max-w-sm">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSignUp} className="w-full max-w-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-orange-500" placeholder="johndoe" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-orange-500" placeholder="you@example.com" />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-orange-500" placeholder="••••••••" />
        </div>
        
        <button type="submit" disabled={loading} className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl mt-4 hover:bg-orange-600 transition">
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>

      <p className="mt-6 text-gray-400">
        Already have an account?{' '}
        <button onClick={() => navigate('signin')} className="text-orange-500 font-bold hover:underline">Sign In</button>
      </p>
    </div>
  );
}