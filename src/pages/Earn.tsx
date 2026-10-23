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

  // تم إزالة سكريبت OnClicka لحماية الموقع من الشاشة السوداء

  return (
    <div className="min-h-screen bg-black text-white">
      {showNav && <TopBar />}
      <main className={showNav ? "pb-16 pt-16" : ""}>
        <Pages />
      </main>
      {showNav && <BottomNav />}
      {showNav && user && <ChatWidget />}
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