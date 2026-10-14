import { AppProvider, useApp } from '@/context/AppContext';
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
      return user ? <Earn /> : <Home />;
    case 'cashout':
      return user ? <Cashout /> : <Home />;
    case 'leaderboard':
      return user ? <Leaderboard /> : <Home />;
    case 'affiliates':
      return user ? <Affiliates /> : <Home />;
    case 'profile':
      return user ? <Profile /> : <Home />;
    case 'tasks':
      return user ? <TasksHistory /> : <Home />;
    case 'admin':
      return <Admin />;
    default:
      return <Home />;
  }
}

function Shell() {
  const { page, user } = useApp();
  const isAdmin = page === 'admin';
  const showChrome = !isAdmin && user && !['home', 'signin', 'signup'].includes(page);

  return (
    <div className="min-h-screen bg-loot-black">
      {showChrome && <TopBar />}
      <main key={page} className="animate-fade-in">
        <Pages />
      </main>
      {showChrome && <BottomNav />}
      {showChrome && <div className="h-20" />}
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
