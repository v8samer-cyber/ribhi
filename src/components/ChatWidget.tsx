import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase'; // تأكد من مسار ملف supabase الخاص بك
import { MessageCircle, X, Send, Bell, User, ShieldAlert, ArrowRight, Check, Ban } from 'lucide-react';
import { ProfanityFilter } from '@nzrm/text-shield';

// إنشاء فلتر الكلمات النابية (عربي وإنجليزي)
const filter = new ProfanityFilter({ languages: ['en', 'ar'] });

export default function ChatWidget() {
  const { user } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'public' | 'requests' | 'private'>('public');
  
  // الحالات (States)
  const [publicMessages, setPublicMessages] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [privateMessages, setPrivateMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeChatUser, setActiveChatUser] = useState<string | null>(null); // إيميل الشخص الذي نتحدث معه
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAdmin = user?.email === 'v8samer@gmail.com'; // ⚠️ ضع إيميل الأدمن هنا

  // التمرير للأسفل تلقائياً
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [publicMessages, privateMessages, activeTab]);

  // 1. جلب الرسائل العامة والاستماع للجديد
  useEffect(() => {
    if (!isOpen) return;

    const fetchPublic = async () => {
      const { data } = await supabase.from('public_chat').select('*').order('created_at', { ascending: true }).limit(50);
      if (data) setPublicMessages(data);
    };
    fetchPublic();

    const sub = supabase.channel('public_chat_rt').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'public_chat' }, (payload) => {
      setPublicMessages((prev) => [...prev, payload.new]);
    }).subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [isOpen]);

  // 2. جلب طلبات الدردشة (الجرس الأصفر)
  useEffect(() => {
    if (!isOpen || !user?.email) return;

    const fetchRequests = async () => {
      const { data } = await supabase.from('chat_requests').select('*').eq('receiver_email', user.email).eq('status', 'pending');
      if (data) setRequests(data);
    };
    fetchRequests();

    const sub = supabase.channel('requests_rt').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_requests' }, (payload) => {
      if (payload.new.receiver_email === user.email) {
        setRequests((prev) => [...prev, payload.new]);
      }
    }).subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [isOpen, user?.email]);

  // 3. جلب الرسائل الخاصة والاستماع للجديد
  useEffect(() => {
    if (!isOpen || !user?.email || activeTab !== 'private' || !activeChatUser) return;

    const fetchPrivate = async () => {
      const { data } = await supabase.from('private_messages').select('*')
        .or(`and(sender_email.eq.${user.email},receiver_email.eq.${activeChatUser}),and(sender_email.eq.${activeChatUser},receiver_email.eq.${user.email})`)
        .order('created_at', { ascending: true });
      if (data) setPrivateMessages(data);
    };
    fetchPrivate();

    const sub = supabase.channel('private_rt').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'private_messages' }, (payload) => {
      const msg = payload.new;
      if ((msg.sender_email === user.email && msg.receiver_email === activeChatUser) || 
          (msg.sender_email === activeChatUser && msg.receiver_email === user.email)) {
        setPrivateMessages((prev) => [...prev, msg]);
      }
    }).subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [isOpen, user?.email, activeTab, activeChatUser]);

  // إرسال رسالة عامة (مع الفلتر)
  const sendPublicMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user?.email) return;
    
    const cleanMsg = filter.clean(newMessage); // فلترة الكلام الفاحش
    setNewMessage('');
    
    await supabase.from('public_chat').insert([{ 
      user_email: user.email, 
      username: user.email.split('@')[0], // سيأخذ أول الإيميل كاسم افتراضي
      message: cleanMsg 
    }]);
  };

  // إرسال رسالة خاصة (مع الفلتر)
  const sendPrivateMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user?.email || !activeChatUser) return;

    const cleanMsg = filter.clean(newMessage);
    setNewMessage('');

    await supabase.from('private_messages').insert([{ 
      sender_email: user.email, 
      receiver_email: activeChatUser, 
      message: cleanMsg 
    }]);
  };

  // إرسال طلب دردشة خاصة
  const sendChatRequest = async (targetEmail: string) => {
    if (!user?.email || targetEmail === user.email) return;
    
    // التحقق إذا كان هناك طلب سابق
    const { data } = await supabase.from('chat_requests').select('*')
      .or(`and(sender_email.eq.${user.email},receiver_email.eq.${targetEmail}),and(sender_email.eq.${targetEmail},receiver_email.eq.${user.email})`)
      .single();

    if (data && data.status === 'accepted') {
      // إذا كان مقبولاً مسبقاً، افتح الدردشة مباشرة
      setActiveChatUser(targetEmail);
      setActiveTab('private');
    } else if (!data) {
      // إرسال طلب جديد
      await supabase.from('chat_requests').insert([{ sender_email: user.email, receiver_email: targetEmail }]);
      alert('تم إرسال طلب الدردشة. بانتظار الموافقة.');
    } else {
      alert('يوجد طلب معلق بالفعل.');
    }
  };

  // قبول أو رفض الطلب
  const handleRequest = async (requestId: number, senderEmail: string, status: 'accepted' | 'rejected') => {
    await supabase.from('chat_requests').update({ status }).eq('id', requestId);
    setRequests((prev) => prev.filter(r => r.id !== requestId));
    
    if (status === 'accepted') {
      setActiveChatUser(senderEmail);
      setActiveTab('private');
    }
  };

  // حظر مستخدم (للأدمن فقط)
  const handleBan = async (targetEmail: string) => {
    if (!isAdmin || !window.confirm(`هل أنت متأكد من حظر ${targetEmail}؟`)) return;
    
    await supabase.from('banned_users').insert([{ email: targetEmail }]);
    alert('تم حظر المستخدم بنجاح.');
    // إخفاء رسائله من الشاشة
    setPublicMessages((prev) => prev.filter(msg => msg.user_email !== targetEmail));
  };

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="bg-[#161616] w-[320px] sm:w-[380px] h-[500px] border border-gray-700 rounded-2xl shadow-2xl flex flex-col mb-4 overflow-hidden animate-in fade-in slide-in-from-bottom-5">
          
          {/* شريط علوي */}
          <div className="bg-teal-600 p-3 flex justify-between items-center text-white">
            <div className="flex gap-4 text-sm font-bold">
              <button onClick={() => { setActiveTab('public'); setActiveChatUser(null); }} className={`${activeTab === 'public' ? 'text-white' : 'text-teal-200'}`}>Public</button>
              <button onClick={() => setActiveTab('requests')} className={`flex items-center gap-1 ${activeTab === 'requests' ? 'text-white' : 'text-teal-200'}`}>
                Requests
                {requests.length > 0 && <span className="bg-yellow-400 text-black text-[10px] px-1.5 rounded-full">{requests.length}</span>}
              </button>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-teal-700 p-1 rounded">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* --- قسم الدردشة العامة --- */}
          {activeTab === 'public' && (
            <>
              <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-3 bg-[#0a0a0a]">
                {publicMessages.map((msg, index) => {
                  const isMe = msg.user_email === user?.email;
                  return (
                    <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1 mb-1">
                        <span 
                          className="text-[10px] text-teal-400 font-bold cursor-pointer hover:underline"
                          onClick={() => sendChatRequest(msg.user_email)}
                        >
                          {isMe ? 'You' : msg.username || msg.user_email.split('@')[0]}
                        </span>
                        {isAdmin && !isMe && (
                          <button onClick={() => handleBan(msg.user_email)} className="text-red-500 hover:text-red-400 ml-1" title="حظر">
                            <Ban className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <div className={`px-3 py-2 rounded-xl max-w-[85%] text-xs ${isMe ? 'bg-teal-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none'}`}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={sendPublicMessage} className="p-2 bg-[#161616] border-t border-gray-800 flex gap-2">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500" />
                <button type="submit" className="bg-teal-500 hover:bg-teal-600 text-white p-2 rounded-lg"><Send className="h-4 w-4" /></button>
              </form>
            </>
          )}

          {/* --- قسم طلبات الدردشة --- */}
          {activeTab === 'requests' && (
            <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-3 bg-[#0a0a0a]">
              {requests.length === 0 ? (
                <p className="text-gray-500 text-center text-xs mt-10">No pending requests.</p>
              ) : (
                requests.map((req) => (
                  <div key={req.id} className="bg-[#161616] p-3 rounded-xl border border-gray-800 flex flex-col gap-2">
                    <p className="text-xs text-gray-300">المستخدم <strong className="text-teal-400">{req.sender_email.split('@')[0]}</strong> يريد مراسلتك.</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleRequest(req.id, req.sender_email, 'accepted')} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1.5 rounded-lg text-xs flex items-center justify-center gap-1">
                        <Check className="h-3 w-3" /> قبول
                      </button>
                      <button onClick={() => handleRequest(req.id, req.sender_email, 'rejected')} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 rounded-lg text-xs flex items-center justify-center gap-1">
                        <X className="h-3 w-3" /> رفض
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* --- قسم الدردشة الخاصة --- */}
          {activeTab === 'private' && activeChatUser && (
            <>
              <div className="bg-[#1f1f1f] p-2 flex items-center text-xs text-gray-300 border-b border-gray-800">
                <button onClick={() => { setActiveTab('public'); setActiveChatUser(null); }} className="flex items-center gap-1 hover:text-white">
                  <ArrowRight className="h-4 w-4" /> رجوع
                </button>
                <span className="mx-auto">محادثة مع: <strong className="text-teal-400">{activeChatUser.split('@')[0]}</strong></span>
              </div>
              <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-3 bg-[#0a0a0a]">
                {privateMessages.map((msg, index) => {
                  const isMe = msg.sender_email === user?.email;
                  return (
                    <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`px-3 py-2 rounded-xl max-w-[85%] text-xs ${isMe ? 'bg-teal-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none'}`}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={sendPrivateMessage} className="p-2 bg-[#161616] border-t border-gray-800 flex gap-2">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a private message..." className="flex-1 bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500" />
                <button type="submit" className="bg-teal-500 hover:bg-teal-600 text-white p-2 rounded-lg"><Send className="h-4 w-4" /></button>
              </form>
            </>
          )}
        </div>
      )}

      {/* الزر العائم مع الجرس الأصفر */}
      <button onClick={() => setIsOpen(!isOpen)} className="relative bg-teal-500 hover:bg-teal-600 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105">
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        
        {/* إشعار الجرس الأصفر */}
        {!isOpen && requests.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-yellow-500 text-black text-[10px] font-bold items-center justify-center">
              <Bell className="h-3 w-3" />
            </span>
          </span>
        )}
      </button>
    </div>
  );
}