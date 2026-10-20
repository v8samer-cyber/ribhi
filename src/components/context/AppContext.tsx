import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const AppContext = createContext<any>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('loot_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [page, setPage] = useState(() => {
    const savedPage = localStorage.getItem('loot_page');
    return savedPage ? savedPage : 'home';
  });
  
  const [postbacks, setPostbacks] = useState([]);

  // جلب بيانات المستخدم كاملة (مع الرتبة) من السيرفر
  useEffect(() => {
    if (!user?.email) return;

    const fetchFullUserData = async () => {
      const { data } = await supabase
        .from('app_users')
        .select('*') // هنا نطلب كل شي (الرصيد والرتبة)
        .eq('email', user.email)
        .single();
      
      if (data) {
        setUser(data); 
        localStorage.setItem('loot_user', JSON.stringify(data));
      }
    };

    fetchFullUserData(); // نجيبها أول ما يفتح الموقع

    const interval = setInterval(fetchFullUserData, 5000); // ونجيبها كل 5 ثواني
    return () => clearInterval(interval);
  }, [user?.email]);

  useEffect(() => {
    if (user) localStorage.setItem('loot_user', JSON.stringify(user));
    else localStorage.removeItem('loot_user');
  }, [user]);

  useEffect(() => {
    localStorage.setItem('loot_page', page);
  }, [page]);

  const navigate = (path: string) => {
    setPage(path);
  };

  const login = async (email: string, password: string) => {
    const { data } = await supabase.from('app_users').select('*').eq('email', email).single();
    if (data) {
      setUser(data);
      navigate('earn');
      return true;
    }
    return false;
  };

  const signup = async (username: string, email: string, password: string) => {
    const { data } = await supabase.from('app_users').insert([{ username, email, password, balance: 0, role: 'user' }]).select().single();
    if (data) {
      setUser(data);
      navigate('earn');
      return true;
    }
    return false;
  };

  return (
    <AppContext.Provider value={{ user, setUser, page, setPage, navigate, postbacks, setPostbacks, login, signup }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};