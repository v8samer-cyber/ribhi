import { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';

export default function NotificationHandler() {
  const { user } = useApp();

  // 1. طلب الإذن من المستخدم عند تحميل الصفحة (مرة واحدة فقط)
  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }
  }, []);

  // 2. الاستماع لقاعدة البيانات لإظهار الإشعار عند إضافة نقاط
  useEffect(() => {
    if (!user?.email) return;

    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'postback_log',
          filter: `user_id=eq.${user.email}`, // 👈 نرسل الإشعار فقط إذا كان السجل يخص هذا المستخدم
        },
        (payload) => {
          if (Notification.permission === "granted") {
            // نأخذ عدد النقاط من السجل الجديد (تأكد من اسم العمود في جدولك، غالباً amount أو payout)
            const earnedPoints = payload.new.amount || payload.new.payout || "New";
            
            new Notification("LootEarn 🎉", {
              body: `Success! You earned ${earnedPoints} LE. Your balance has been updated.`,
              icon: "/favicon.ico", // تأكد أن لديك أيقونة في مجلد public
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return null; // هذا الملف لا يظهر أي شيء في التصميم، يعمل في الخلفية فقط
}