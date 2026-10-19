import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // تأكد أن المسار صحيح

// 1. تعريف أنواع البيانات (Types)
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

// 2. إنشاء الـ Context
const AppContext = createContext<any>(null);

// 3. إنشاء المزود (Provider)
export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
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
            // تحديث الرصيد فقط إذا كان التحديث يخص المستخدم الحالي
            if (prevUser && prevUser.email === payload.new.email) {
              return { ...prevUser, balance: payload.new.balance };
            }
            return prevUser;
          });
        }
      )
      .subscribe();

    // تنظيف الاتصال عند إغلاق التطبيق
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // دالة التنقل بين الصفحات
  const navigate = (path: string) => {
    setPage(path);
  };

  return (
    <AppContext.Provider value={{ user, setUser, page, setPage, navigate, postbacks, setPostbacks }}>
      {children}
    </AppContext.Provider>
  );
};

// 5. تصدير هوك مخصص لاستخدام الـ Context بسهولة
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};