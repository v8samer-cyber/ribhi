import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ─── Types ───────────────────────────────────────────────

export interface User {
  username: string;
  email: string;
  balance: number;
  createdAt: string;
}

export interface Withdrawal {
  id: string;
  username: string;
  email: string;
  amount: number;          // in Cash
  method: string;          // e.g. "Binance"
  walletAddress: string;   // Binance wallet address
  status: 'pending' | 'paid' | 'rejected';
  requestedAt: string;     // ISO timestamp
  processedAt: string | null;
}

export interface TaskRecord {
  id: string;
  username: string;
  taskName: string;
  company: string;
  cash: number;
  downloadedAt: string;
  completedAt: string;
  creditedAt: string;
}

export interface PostbackEntry {
  id: string;
  user_id: string | null;
  click_id: string | null;
  cash: number | null;
  status: string;
  reason: string | null;
  received_at: string;
}

type Page =
  | 'home' | 'signin' | 'signup'
  | 'earn' | 'cashout' | 'leaderboard' | 'affiliates'
  | 'profile' | 'tasks'
  | 'admin';

interface AppContextType {
  user: User | null;
  page: Page;
  navigate: (page: Page) => void;
  login: (email: string, _password: string) => void;
  signup: (username: string, email: string, _password: string) => void;
  logout: () => void;
  // shared data
  withdrawals: Withdrawal[];
  allUsers: User[];
  tasks: TaskRecord[];
  postbacks: PostbackEntry[];
  requestWithdrawal: (amount: number, method: string, walletAddress: string) => boolean;
  updateWithdrawalStatus: (id: string, status: 'paid' | 'rejected') => void;
}

const supabase: SupabaseClient = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

function userIdFor(user: User): string {
  return user.email;
}

async function syncUserToSupabase(user: User) {
  try {
    await supabase
      .from('app_users')
      .upsert({
        user_id: userIdFor(user),
        username: user.username,
        email: user.email,
        balance: user.balance,
      }, { onConflict: 'user_id' });
  } catch {
 // best-effort sync
  }
}

// ─── Storage helpers ─────────────────────────────────────

const USER_KEY = 'lootearn_user';
const USERS_KEY = 'lootearn_users';
const WITHDRAWALS_KEY = 'lootearn_withdrawals';
const TASKS_KEY = 'lootearn_tasks';

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── Context ─────────────────────────────────────────────

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState<Page>('home');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [postbacks, setPostbacks] = useState<PostbackEntry[]>([]);

  // ── Initial load ──
  useEffect(() => {
    setUser(loadJSON<User | null>(USER_KEY, null));
    setAllUsers(loadJSON<User[]>(USERS_KEY, []));
    setWithdrawals(loadJSON<Withdrawal[]>(WITHDRAWALS_KEY, []));
    setTasks(loadJSON<TaskRecord[]>(TASKS_KEY, []));

    // Load postback log from Supabase
    (async () => {
      try {
        const { data } = await supabase
          .from('postback_log')
          .select('*')
          .order('received_at', { ascending: false })
          .limit(100);
        if (data) setPostbacks(data as PostbackEntry[]);
      } catch {
        // best-effort
      }
    })();

    // Hash-based routing for secret admin page
    if (window.location.hash === '#admin') {
      setPage('admin');
    }
  }, []);

  // Listen for hash changes (e.g. user manually types #admin)
  useEffect(() => {
    const onHash = () => {
      if (window.location.hash === '#admin') {
        setPage('admin');
      }
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // ── Cross-tab / same-tab sync for withdrawals ──
  // When the admin page writes to localStorage, the user's cashout page
  // picks up the change via the storage event (cross-tab) or a manual
  // refresh trigger (same-tab).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === WITHDRAWALS_KEY) {
        setWithdrawals(loadJSON<Withdrawal[]>(WITHDRAWALS_KEY, []));
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // expose a way for same-tab updates to propagate
  useEffect(() => {
    const onWithdrawalsChanged = () => {
      setWithdrawals(loadJSON<Withdrawal[]>(WITHDRAWALS_KEY, []));
    };
    window.addEventListener('lootearn-withdrawals-changed', onWithdrawalsChanged);
    return () => window.removeEventListener('lootearn-withdrawals-changed', onWithdrawalsChanged);
  }, []);

  const navigate = useCallback((next: Page) => {
    setPage(next);
    if (next === 'admin') {
      window.location.hash = 'admin';
    } else if (window.location.hash === '#admin') {
      history.replaceState(null, '', window.location.pathname);
    }
    window.scrollTo(0, 0);
  }, []);

  // ── Auth ──
  const persistUser = (u: User) => {
    setUser(u);
    saveJSON(USER_KEY, u);
    setAllUsers((prev) => {
      const exists = prev.some((p) => p.email === u.email);
      const next = exists ? prev.map((p) => (p.email === u.email ? u : p)) : [...prev, u];
      saveJSON(USERS_KEY, next);
      return next;
    });
    syncUserToSupabase(u);
  };

  const login = (email: string, _password: string) => {
    const username = email.split('@')[0] || 'User';
    const now = new Date().toISOString();
    const existing = allUsers.find((u) => u.email === email);
    const newUser: User = existing ?? { username, email, balance: 0, createdAt: now };
    persistUser(newUser);
    navigate('earn');
  };

  const signup = (username: string, email: string, _password: string) => {
    const now = new Date().toISOString();
    const newUser: User = { username, email, balance: 0, createdAt: now };
    persistUser(newUser);
    navigate('earn');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
    navigate('home');
  };

  // ── Withdrawals ──
  const requestWithdrawal = (amount: number, method: string, walletAddress: string): boolean => {
    if (!user) return false;
    if (amount < 100) return false;
    if (user.balance < amount) return false;
    if (!walletAddress || walletAddress.length < 20) return false;

    const w: Withdrawal = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      username: user.username,
      email: user.email,
      amount,
      method,
      walletAddress,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      processedAt: null,
    };

    const next = [w, ...withdrawals];
    setWithdrawals(next);
    saveJSON(WITHDRAWALS_KEY, next);
    window.dispatchEvent(new Event('lootearn-withdrawals-changed'));

    // deduct from user balance
    const updated: User = { ...user, balance: user.balance - amount };
    persistUser(updated);

    return true;
  };

  const updateWithdrawalStatus = (id: string, status: 'paid' | 'rejected') => {
    const next = withdrawals.map((w) =>
      w.id === id ? { ...w, status, processedAt: new Date().toISOString() } : w,
    );
    setWithdrawals(next);
    saveJSON(WITHDRAWALS_KEY, next);
    window.dispatchEvent(new Event('lootearn-withdrawals-changed'));

    // If rejected, refund the user's balance
    if (status === 'rejected') {
      const w = withdrawals.find((x) => x.id === id);
      if (w) {
        setAllUsers((prev) => {
          const updatedUsers = prev.map((u) =>
            u.email === w.email ? { ...u, balance: u.balance + w.amount } : u,
          );
          saveJSON(USERS_KEY, updatedUsers);
          return updatedUsers;
        });
        // also update current user if it's them
        if (user && user.email === w.email) {
          const refunded: User = { ...user, balance: user.balance + w.amount };
          persistUser(refunded);
        }
      }
    }
  };

  // Poll Supabase for postback credits (every 15s when logged in)
  useEffect(() => {
    if (!user) return;

    const poll = async () => {
      try {
        const { data } = await supabase
          .from('app_users')
          .select('balance')
          .eq('user_id', userIdFor(user))
          .maybeSingle();

        if (data && data.balance !== undefined && data.balance !== user.balance) {
          const updated: User = { ...user, balance: data.balance as number };
          setUser(updated);
          saveJSON(USER_KEY, updated);
          setAllUsers((prev) => {
            const next = prev.map((u) => (u.email === user.email ? updated : u));
            saveJSON(USERS_KEY, next);
            return next;
          });
        }

        // Also refresh postback log
        const { data: pbData } = await supabase
          .from('postback_log')
          .select('*')
          .order('received_at', { ascending: false })
          .limit(100);
        if (pbData) setPostbacks(pbData as PostbackEntry[]);
      } catch {
        // best-effort
      }
    };

    poll();
    const interval = setInterval(poll, 15000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <AppContext.Provider
      value={{
        user, page, navigate, login, signup, logout,
        withdrawals, allUsers, tasks, postbacks,
        requestWithdrawal, updateWithdrawalStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
