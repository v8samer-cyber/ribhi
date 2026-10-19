import { useState } from 'react';
import { useApp } from '../context/AppContext'; // تأكد من المسار
import { supabase } from '../supabaseClient'; // تأكد من المسار

export default function SignIn() {
  const { navigate, setUser } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // البحث عن المستخدم في قاعدة البيانات
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('email', email)
      .single();

    setLoading(false);

    if (error || !data) {
      alert("الإيميل غير مسجل في الموقع! تأكد من الإيميل أو قم بإنشاء حساب جديد.");
      return;
    }

    if (data.password !== password) {
      alert("كلمة المرور غير صحيحة!");
      return;
    }

    // إذا كان كل شيء صحيح، سجل الدخول
    setUser(data);
    // حفظ بيانات المستخدم في المتصفح لكي يتذكرك
    localStorage.setItem('lootearn_user', JSON.stringify(data)); 
    navigate('earn');
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center p-4">
      <h1 className="text-3xl font-bold mb-8 text-orange-500">Welcome Back</h1>
      
      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="w-full p-3 rounded bg-gray-900 text-white border border-gray-700 focus:outline-none focus:border-orange-500"
            required 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="w-full p-3 rounded bg-gray-900 text-white border border-gray-700 focus:outline-none focus:border-orange-500"
            required 
          />
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-orange-500 text-white p-3 rounded font-bold hover:bg-orange-600 transition"
        >
          {loading ? 'Checking...' : 'Sign In'}
        </button>
      </form>

      <p className="mt-6 text-gray-400">
        Don't have an account?{' '}
        <button onClick={() => navigate('signup')} className="text-orange-500 font-bold hover:underline">
          Sign Up
        </button>
      </p>
    </div>
  );
}