import { useEffect } from 'react';
import { useApp, AppProvider } from '@/context/AppContext';
import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';
import Home from '@/pages/Home';
import SignIn from '@/pages/SignIn';
import SignUp from '@/pages/SignUp';
import Earn from '@/pages/Earn';
import Cashout from '@/pages/Cashout';
import Affiliates from '@/pages/Affiliates';
import Profile from '@/pages/Profile';
import TasksHistory from '@/pages/TasksHistory';
import Admin from '@/pages/Admin';
import ChatWidget from '@/components/ChatWidget';
import QuizGame from '@/pages/QuizGame';
import NotificationHandler from '@/components/NotificationHandler';
import { supabase } from '@/lib/supabase'; // تأكد من مسار Supabase

function Pages() {
  const { page, user } = useApp();

  switch (page) {
    case 'home': return <Home />;
    case 'signin': return <SignIn />;
    case 'signup': return <SignUp />;
    case 'earn': return user ? <Earn /> : <SignIn />;
    case 'cashout': return user ? <Cashout /> : <SignIn />;
    case 'games': return user ? <QuizGame /> : <SignIn />;
    case 'affiliates': return user ? <Affiliates /> : <SignIn />;
    case 'profile': return user ? <Profile /> : <SignIn />;
    case 'tasks': return user ? <TasksHistory /> : <SignIn />;
    case 'admin': 
      return (user && user.role === 'admin') ? <Admin /> : <Home />;
    default: return <Home />;
  }
}

function Shell() {
  const { page, user } = useApp(); 
  const isAdminPage = page === 'admin';
  const showNav = !isAdminPage;

  // 1. أكواد الإعلانات الخاصة بك
  useEffect(() => {
    if (!document.querySelector('script[src*="abscloud.org"]')) {
      const popunder = document.createElement('script');
      popunder.type = 'text/javascript';
      popunder.async = true;
      popunder.setAttribute('data-cfasync', 'false');
      popunder.src = 'https://abscloud.org/1/90857fbb25850f303e91f9efef63067e';
      document.body.appendChild(popunder);
    }
    if (!document.querySelector('script[src*="bauval.org"]')) {
      const socialBar = document.createElement('script');
      socialBar.type = 'text/javascript';
      socialBar.async = true;
      socialBar.setAttribute('data-cfasync', 'false');
      socialBar.src = 'https://bauval.org/14/e8ad20e34ee6c1d7e3b5d27174c8b1d9';
      document.body.appendChild(socialBar);
    }
  }, []);

  // 👇 2. كود الطرد التلقائي بعد ساعتين من الخمول 👇
  useEffect(() => {
    if (!user) return; // إذا لم يكن هناك مستخدم مسجل، لا تفعل شيئاً

    let timeoutId: NodeJS.Timeout;

    // دالة تسجيل الخروج
    const handleLogout = async () => {
      await supabase.auth.signOut();
      localStorage.removeItem('loot_user'); // تأكد من اسم المتغير الذي تستخدمه
      localStorage.removeItem('loot_page');
      window.location.reload(); // إعادة تحميل الصفحة لطرد المستخدم
    };

    // إعادة ضبط المؤقت (تحدث عند حركة الماوس أو الكتابة)
    const resetTimer = () => {
      clearTimeout(timeoutId);
      // 2 * 60 * 60 * 1000 تعني ساعتين (يمكنك تغيير 2 إلى 1 لساعة واحدة)
      timeoutId = setTimeout(handleLogout, 2 * 60 * 60 * 1000); 
    };

    // الأحداث التي تعني أن المستخدم نشط
    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    
    // إضافة المستمعين
    events.forEach(event => window.addEventListener(event, resetTimer));
    
    // بدء المؤقت لأول مرة
    resetTimer();

    // تنظيف الأحداث عند الخروج
    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-black text-white">
      {showNav && <TopBar />}
      <main className={showNav ? "pb-16 pt-16" : ""}>
        <Pages />
      </main>
      {showNav && <BottomNav />}
      {showNav && user && <ChatWidget />}
      {showNav && user && <NotificationHandler />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}