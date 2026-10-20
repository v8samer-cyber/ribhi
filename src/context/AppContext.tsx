import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const AppContext = createContext<any>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  // 1. نقرأ المستخدم من ذاكرة المتصفح أول ما يفتح الموقع
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('loot_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [page, setPage] = useState('home');
  const [postbacks, setPostbacks] = useState([]);

  // 2. كل ما يتغير المستخدم (تسجيل دخول أو خروج)، نحدث ذاكرة المتصفح
  useEffect(() => {
    if (user) {
      localStorage.setItem('loot_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('loot_user');
    }
  }, [user]);

  // الاستماع لتحديثات الرصيد من قاعدة البيانات (Real-time)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'app_users', filter: `email=eq.${user.email}` },
        (payload) => {
          console.log('Balance updated from server!', payload.new);
          setUser((prev: any) => ({ ...prev, balance: payload.new.balance }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.email]);

  const navigate = (path: string) => {
    setPage(path);
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('email', email)
      .single();
      
    if (data) {
      setUser(data); // هنا راح تنحفظ البيانات أوتوماتيك بفضل الـ useEffect
      setPage('earn');
      return true;
    }
    return false;
  };

  const signup = async (username: string, email: string, password: string) => {
    const { data, error } = await supabase
      .from('app_users')
      .insert([{ username, email, password, balance: 0 }])
      .select()
      .single();

    if (data) {
      setUser(data); // هنا راح تنحفظ البيانات أوتوماتيك بفضل الـ useEffect
      setPage('earn');
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