import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // تأكد أن المسار صحيح

// 1. تعريف أنواع البيانات
export interface User {
  id: string;
  email: string;
  password?: string;
  balance: number;
}

export interface Withdrawal {
  id: string;
  username: string;
  email: string;
  amount: number;
  method: string;
  walletAddress: string;
  status: 'pending' | 'paid' | 'rejected';
  requestedAt: string;
  processedAt: string | null;
}

// 2. إنشاء الـ Context
const AppContext = createContext<any>(null);

// 3. إنشاء المزود (Provider)
export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  
  // جلب المستخدم من الذاكرة المحلية (localStorage) عند فتح الموقع
  const [user, setUser] = useState<any>(() => {
    const savedUser = localStorage.getItem('lootearn_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [page, setPage] = useState('home');
  const [postbacks, setPostbacks] = useState([]);

  // 4. كود التحديث الفوري (Realtime) من Supabase
  useEffect(() => {
    const subscription = supabase
      .channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'app_users' },
        (payload) => {
          console.log('تم استلام تحديث من السيرفر:', payload.new);
          
          setUser((prevUser: any) => {
            if (prevUser && prevUser.email === payload.new.email) {
              const updatedUser = { ...prevUser, balance: payload.new.balance };
              // حفظ الرصيد الجديد في المتصفح لكي لا يختفي
              localStorage.setItem('lootearn_user', JSON.stringify(updatedUser));
              return updatedUser;
            }
            return prevUser;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // دالة التنقل بين الصفحات
  const navigate = (path: string) => {
    setPage(path);
  };

  // دالة تسجيل الخروج (يمكنك استدعاؤها من أي مكان)
  const logout = () => {
    localStorage.removeItem('lootearn_user');
    setUser(null);
    navigate('home');
  };

  return (
    <AppContext.Provider value={{ user, setUser, page, setPage, navigate, postbacks, setPostbacks, logout }}>
      {children}
    </AppContext.Provider>
  );
};

// 5. تصدير الهوك
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};