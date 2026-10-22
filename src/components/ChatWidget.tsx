import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { MessageCircle, X, Send, Bell, Ban, ArrowRight, ArrowLeft, User } from 'lucide-react';
import { ProfanityFilter } from "@nzrm/text-shield";

const filter = new ProfanityFilter({ languages: ["en", "ar"] });

export default function ChatWidget() {
  const { user } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  
  // التبويبات: 'public' (العامة), 'requests' (الطلبات), 'private_list' (قائمة الأصدقاء), 'private_chat' (المحادثة نفسها)
  const [view, setView] = useState<'public' | 'requests' | 'private_list' | 'private_chat'>('public');
  
  const [publicMessages, setPublicMessages] = useState<any[]>([]);
  const [privateMessages, setPrivateMessages] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]); // قائمة الأصدقاء
  
  const [newMessage, setNewMessage] = useState('');
  const [activeChat, setActiveChat] = useState<string | null>(null); // إيميل الشخص الذي نتحدث معه
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const ADMIN_EMAIL = "v8samer@gmail.com"; // تأكد أن هذا إيميلك
  const isAdmin = user?.email === ADMIN_EMAIL;

  // 1. جلب الرسائل العامة
  useEffect(() => {
    if (!isOpen) return;
    const fetchPublic = async () => {
      const { data } = await supabase.from('public_chat').select('*').order('created_at', { ascending: true }).limit(50);
      if (data) setPublicMessages(data);
    };
    fetchPublic();

    const sub = supabase.channel('public_chat').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'public_chat' }, (payload) => {
      setPublicMessages((prev) => {
        if (prev.some(m => m.id === payload.new.id)) return prev;
        return [...prev, payload.new];
      });
    }).subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [isOpen]);

  // 2. جلب الطلبات وقائمة الأصدقاء
  useEffect(() => {
    if (!user?.email) return;
    
    // جلب الطلبات المعلقة
    const fetchRequests = async () => {
      const { data } = await supabase.from('chat_requests').select('*').eq('receiver_email', user.email).eq('status', 'pending');
      if (data) setRequests(data);
    };
    fetchRequests();

    // جلب قائمة الأصدقاء (الذين تم قبول طلباتهم)
    const fetchFriends = async () => {
      const { data } = await supabase
        .from('chat_requests')
        .select('sender_email, sender_profile:app_users!chat_requests_sender_email_fkey(username, avatar_url)')
        .eq('receiver_email', user.email)
        .eq('status', 'accepted');
      
      if (data) {
        // تنسيق البيانات لتناسب العرض
        const formattedFriends = data.map((f: any) => ({
          email: f.sender_email,
          username: f.sender_profile?.username || f.sender_email.split('@')[0],
          avatar: f.sender_profile?.avatar_url
        }));
        setFriends(formattedFriends);
      }
    };
    fetchFriends();

    // الاستماع للتحديثات
    const sub = supabase.channel('chat_requests').on('postgres_changes', { event: '*', schema: 'public', table: 'chat_requests' }, (payload) => {
      if (payload.new && payload.new.receiver_email === user.email) {
        if (payload.new.status === 'pending') {
          setRequests(prev => prev.some(r => r.id === payload.new.id) ? prev : [...prev, payload.new]);
        } else if (payload.new.status === 'accepted') {
          // تحديث قائمة الأصدقاء عند القبول
          fetchFriends();
          setRequests(prev => prev.filter(r => r.id !== payload.new.id));
        }
      }
    }).subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [user]);

  // 3. جلب الرسائل الخاصة للمحادثة النشطة
  useEffect(() => {
    if (!isOpen || view !== 'private_chat' || !activeChat || !user?.email) return;
    
    const fetchPrivate = async () => {
      const { data } = await supabase.from('private_messages').select('*').or(`and(sender_email.eq.${user.email},receiver_email.eq.${activeChat}),and(sender_email.eq.${activeChat},receiver_email.eq.${user.email})`).order('created_at', { ascending: true });
      if (data) setPrivateMessages(data);
    };
    fetchPrivate();

    const sub = supabase.channel('private_messages').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'private_messages' }, (payload) => {
      const msg = payload.new;
      if ((msg.sender_email === user.email && msg.receiver_email === activeChat) || (msg.sender_email === activeChat && msg.receiver_email === user.email)) {
        setPrivateMessages((prev) => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    }).subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [view, activeChat, user, isOpen]);

  // النزول التلقائي لآخر رسالة
  useEffect(() => {
    if (isOpen) {
      const timeout = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [publicMessages, privateMessages, view, isOpen]);

  // دالة الإرسال
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user?.email) return;
    const cleanMessage = filter.clean(newMessage);
    const messageToSend = cleanMessage;
    setNewMessage('');

    if (view === 'public') {
      const displayName = user?.username || user?.email.split('@')[0];
      const tempMsg = { id: Date.now(), user_email: user.email, username: displayName, message: messageToSend, created_at: new Date().toISOString() };
      setPublicMessages(prev => [...prev, tempMsg]);
      await supabase.from('public_chat').insert([{ user_email: user.email, username: displayName, message: messageToSend }]);
    } else if (view === 'private_chat' && activeChat) {
      const tempMsg = { id: Date.now(), sender_email: user.email, receiver_email: activeChat, message: messageToSend, created_at: new Date().toISOString() };
      setPrivateMessages(prev => [...prev, tempMsg]);
      await supabase.from('private_messages').insert([{ sender_email: user.email, receiver_email: activeChat, message: messageToSend }]);
    }
  };

  const requestChat = async (receiverEmail: string) => {
    if (receiverEmail === user?.email) return;
    await supabase.from('chat_requests').insert([{ sender_email: user.email, receiver_email: receiverEmail, status: 'pending' }]);
    alert("تم إرسال طلب دردشة.");
  };

  const handleRequest = async (requestId: number, senderEmail: string, status: 'accepted' | 'rejected') => {
    await supabase.from('chat_requests').update({ status }).eq('id', requestId);
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    if (status === 'accepted') {
      // إضافة الشخص للقائمة فوراً (سيتم تحديثها من السيرفر أيضاً)
      setFriends(prev => [...prev, { email: senderEmail, username: senderEmail.split('@')[0], avatar: null }]);
    }
  };

  const banUser = async (emailToBan: string) => {
    if (!isAdmin) return;
    const confirmBan = window.confirm(`هل أنت متأكد من حظر ${emailToBan}؟`);
    if (confirmBan) {
      await supabase.from('banned_users').insert([{ email: emailToBan }]);
      setPublicMessages((prev) => prev.filter(m => m.user_email !== emailToBan));
      alert("تم حظر المستخدم.");
    }
  };

  const hasNewRequests = requests.length > 0;

  return (
    <div className="fixed bottom-20 right-2 sm:right-4 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="bg-[#161616] w-[95vw] sm:w-[380px] h-[75vh] sm:h-[500px] border border-gray-700 rounded-2xl shadow-2xl flex flex-col mb-4 overflow-hidden animate-in fade-in slide-in-from-bottom-5">
          
          {/* الهيدر (يتغير حسب التبويب) */}
          <div className="bg-teal-600 p-3 flex justify-between items-center text-white shrink-0">
            <div className="flex items-center gap-2">
              {view === 'private_chat' && (
                <button onClick={() => setView('private_list')} className="hover:bg-teal-700 p-1 rounded">
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <h3 className="font-bold text-sm">
                {view === 'public' && 'Live Chat'}
                {view === 'requests' && 'Chat Requests'}
                {view === 'private_list' && 'My Messages'}
                {view === 'private_chat' && `Chat with ${activeChat?.split('@')[0]}`}
              </h3>
            </div>
            
            <div className="flex gap-2 items-center">
              {/* الجرس الأصفر (فقط للطلبات) */}
              {hasNewRequests && view !== 'requests' && (
                <button onClick={() => setView('requests')} className="relative bg-teal-700 px-2 py-1 rounded flex items-center gap-1 animate-pulse">
                  <Bell className="h-4 w-4 text-yellow-300 fill-yellow-300" />
                  <span className="text-xs font-bold text-yellow-300">{requests.length}</span>
                </button>
              )}
              
              {/* زر التبديل بين العام والخاص */}
              {view === 'public' && (
                <button onClick={() => setView('private_list')} className="text-xs bg-teal-700 px-2 py-1 rounded">Private</button>
              )}
              {view === 'private_list' && (
                <button onClick={() => setView('public')} className="text-xs bg-teal-700 px-2 py-1 rounded">Public</button>
              )}

              <button onClick={() => setIsOpen(false)} className="hover:bg-teal-700 p-1 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* منطقة المحتوى */}
          <div className="flex-1 overflow-y-auto bg-[#0a0a0a] flex flex-col [overflow-anchor:none]">
            
            {/* 1. الدردشة العامة */}
            {view === 'public' && (
              <div className="p-3 flex flex-col gap-3">
                {publicMessages.map((msg, index) => {
                  const isMe = msg.user_email === user?.email;
                  const senderName = isMe ? 'You' : (msg.username || msg.user_email.split('@')[0]);
                  return (
                    <div key={index} className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className={`text-[10px] ${isMe ? 'text-gray-500' : 'text-teal-400 cursor-pointer hover:underline'}`} onClick={() => !isMe && requestChat(msg.user_email)}>
                          {senderName}
                        </span>
                        {isAdmin && !isMe && (
                          <button onClick={() => banUser(msg.user_email)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Ban className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <div className={`px-3 py-1.5 rounded-xl max-w-[85%] text-sm ${isMe ? 'bg-teal-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none'}`}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* 2. الطلبات (قبول/رفض) */}
            {view === 'requests' && (
              <div className="p-3 flex flex-col gap-3">
                {requests.length === 0 ? <p className="text-center text-gray-500 text-xs mt-5">No pending requests.</p> : null}
                {requests.map((req) => (
                  <div key={req.id} className="bg-gray-800 p-3 rounded-xl border border-gray-700">
                    <p className="text-xs text-white mb-2">User <strong>{req.sender_email.split('@')[0]}</strong> wants to chat.</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleRequest(req.id, req.sender_email, 'accepted')} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1.5 rounded text-xs font-bold transition-colors">Accept</button>
                      <button onClick={() => handleRequest(req.id, req.sender_email, 'rejected')} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 rounded text-xs font-bold transition-colors">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 3. قائمة المحادثات الخاصة (الأصدقاء) */}
            {view === 'private_list' && (
              <div className="flex flex-col">
                {friends.length === 0 ? <p className="text-center text-gray-500 text-xs mt-10">No friends yet. Send a request from public chat.</p> : null}
                {friends.map((friend, index) => (
                  <div 
                    key={index} 
                    onClick={() => { setActiveChat(friend.email); setView('private_chat'); }}
                    className="flex items-center gap-3 p-3 hover:bg-gray-800 cursor-pointer border-b border-gray-800/50 transition-colors"
                  >
                    {/* الصورة الرمزية */}
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                      {friend.avatar ? (
                        <img src={friend.avatar} alt={friend.username} className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    {/* اسم المستخدم */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">{friend.username}</h4>
                      <p className="text-[10px] text-gray-500 truncate">Tap to open chat</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 4. المحادثة الخاصة الفعلية */}
            {view === 'private_chat' && (
              <div className="p-3 flex flex-col gap-3">
                {privateMessages.map((msg, index) => {
                  const isMe = msg.sender_email === user?.email;
                  return (
                    <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-[9px] text-gray-500 mb-0.5">{isMe ? 'You' : activeChat?.split('@')[0]}</span>
                      <div className={`px-3 py-1.5 rounded-xl max-w-[85%] text-sm ${isMe ? 'bg-teal-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none'}`}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* حقل الإرسال (يختفي في الطلبات وقائمة الأصدقاء) */}
          {(view === 'public' || view === 'private_chat') && (
            <form onSubmit={sendMessage} className="p-2 bg-[#161616] border-t border-gray-800 flex gap-2 shrink-0">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
              />
              <button type="submit" className="bg-teal-500 hover:bg-teal-600 text-white p-2 rounded-lg transition-colors">
                <Send className="h-5 w-5" />
              </button>
            </form>
          )}
        </div>
      )}

      {/* الزر العائم */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (hasNewRequests && !isOpen) setView('requests');
        }}
        className={`relative ${hasNewRequests && !isOpen ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-teal-500 hover:bg-teal-600'} text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105`}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        
        {hasNewRequests && !isOpen && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-yellow-500 border-2 border-[#0a0a0a]"></span>
          </span>
        )}
      </button>
    </div>
  );
}