import { useApp, AppProvider } from '@/context/AppContext';
import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';
import Home from '@/pages/Home';
import SignIn from '@/pages/SignIn';
import SignUp from '@/pages/SignUp';
import Earn from '@/pages/Earn';
import Cashout from '@/pages/Cashout';
import Leaderboard from '@/pages/Leaderboard';
import Affiliates from '@/pages/Affiliates';
import Profile from '@/pages/Profile';
import TasksHistory from '@/pages/TasksHistory';
import Admin from '@/pages/Admin';

function Pages() {
  const { page, user } = useApp();

  switch (page) {
    case 'home':
      return <Home />;
    case 'signin':
      return <SignIn />;
    case 'signup':
      return <SignUp />;
    case 'earn':
      return user ? <Earn /> : <SignIn />; // يطلب تسجيل دخول
    case 'cashout':
      return user ? <Cashout /> : <SignIn />;
    case 'leaderboard':
      return user ? <Leaderboard /> : <SignIn />;
    case 'affiliates':
      return user ? <Affiliates /> : <SignIn />;
    case 'profile':
      return user ? <Profile /> : <SignIn />;
    case 'tasks':
      return user ? <TasksHistory /> : <SignIn />;
    case 'admin':
      return <Admin />;
    default:
      return <Home />;
  }
}

function Shell() {
  const { page } = useApp();
  const isAdmin = page === 'admin';
  const showChrome = !isAdmin;

  return (
    <div className="min-h-screen bg-black text-white">
      {showChrome && <TopBar />}
      <main className={showChrome ? "pb-16 pt-16" : ""}>
        <Pages />
      </main>
      {showChrome && <BottomNav />}
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