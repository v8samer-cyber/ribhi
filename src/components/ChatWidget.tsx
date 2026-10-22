import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { MessageCircle, X, Send, Bell, Ban, ArrowLeft, User } from 'lucide-react';
import { ProfanityFilter } from "@nzrm/text-shield";

const filter = new ProfanityFilter({ languages: ["en", "ar"] });

export default function ChatWidget() {
  const { user } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  
  // التبويبات: 'public' (العامة), 'private' (الخاصة)
  const [activeTab, setActiveTab] = useState<'public' | 'private'>('public');
  
  const [publicMessages, setPublicMessages] = useState<any[]>([]);
  const [privateMessages, setPrivateMessages] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]); // قائمة الأصدقاء الذين تم قبولهم
  
  const [newMessage, setNewMessage] = useState('');
  const [activeChat, setActiveChat] = useState<any | null>(null); // الشخص الذي نتحدث معه
  const [showRequestsMenu, setShowRequestsMenu] = useState(false); // قائمة الطلبات المنسدلة من الجرس
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const ADMIN_EMAIL = "v8samer@gmail.com"; // تأكد أن هذا إيميلك
  const isAdmin = user?.email === ADMIN_EMAIL;

  // 1. جلب الرسائل العامة
  useEffect(() => {
    if (!isOpen || activeTab !== 'public' || activeChat) return;
    const fetchPublic = async () => {
      const { data } = await supabase.from('public_chat').select('*').order('created_at', { ascending: true }).limit(50);
      if (data) setPublicMessages(data);
    };
    fetchPublic();

    const sub = supabase.channel('public_chat_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'public_chat' }, (payload) => {
        setPublicMessages((prev) => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
      }).subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [isOpen, activeTab, activeChat]);

  // 2. جلب طلبات الدردشة والأصدقاء
  useEffect(() => {
    if (!user?.email) return;
    
    // جلب الطلبات المعلقة
    const fetchRequests = async () => {
      const { data } = await supabase.from('chat_requests').select('*').eq('receiver_email', user.email).eq('status', 'pending');
      if (data) setRequests(data);
    };
    fetchRequests();

    // جلب قائمة الأصدقاء (المقبولين)
    const fetchFriends = async () => {
      const { data } = await supabase.from('chat_requests').select('*').eq('receiver_email', user.email).eq('status', 'accepted');
      if (data) setFriends(data);
    };
    fetchFriends();

    // الاستماع للتحديثات
    const sub = supabase.channel('chat_requests_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_requests' }, (payload) => {
        if (payload.new && payload.new.receiver_email === user.email) {
          if (payload.new.status === 'pending') {
            setRequests(prev => prev.some(r => r.id === payload.new.id) ? prev : [...prev, payload.new]);
          } else if (payload.new.status === 'accepted') {
            fetchFriends();
            setRequests(prev => prev.filter(r => r.id !== payload.new.id));
          }
        }
      }).subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [user]);

  // 3. جلب الرسائل الخاصة
  useEffect(() => {
    if (!isOpen || !activeChat || !user?.email) return;
    
    const fetchPrivate = async () => {
      const { data } = await supabase.from('private_messages').select('*')
        .or(`and(sender_email.eq.${user.email},receiver_email.eq.${activeChat.sender_email}),and(sender_email.eq.${activeChat.sender_email},receiver_email.eq.${user.email})`)
        .order('created_at', { ascending: true });
      if (data) setPrivateMessages(data);
    };
    fetchPrivate();

    const sub = supabase.channel('private_messages_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'private_messages' }, (payload) => {
        const msg = payload.new;
        if ((msg.sender_email === user.email && msg.receiver_email === activeChat.sender_email) || 
            (msg.sender_email === activeChat.sender_email && msg.receiver_email === user.email)) {
          setPrivateMessages((prev) => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      }).subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [activeChat, user, isOpen]);

  // النزول لآخر رسالة
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [publicMessages, privateMessages, activeChat, isOpen]);

  // دالة إرسال الرسائل
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user?.email) return;

    const messageToSend = filter.clean(newMessage);
    setNewMessage('');

    if (!activeChat) {
      // إرسال للعامة
      const displayName = user?.username || user?.email.split('@')[0];
      const tempMsg = { id: Date.now(), user_email: user.email, username: displayName, message: messageToSend, created_at: new Date().toISOString() };
      setPublicMessages(prev => [...prev, tempMsg]);
      const { error } = await supabase.from('public_chat').insert([{ user_email: user.email, username: displayName, message: messageToSend }]);
      if (error) alert("خطأ في الإرسال: " + error.message);
    } else {
      // إرسال للخاص
      const tempMsg = { id: Date.now(), sender_email: user.email, receiver_email: activeChat.sender_email, message: messageToSend, created_at: new Date().toISOString() };
      setPrivateMessages(prev => [...prev, tempMsg]);
      const { error } = await supabase.from('private_messages').insert([{ sender_email: user.email, receiver_email: activeChat.sender_email, message: messageToSend }]);
      if (error) alert("خطأ في الإرسال: " + error.message);
    }
  };

  // طلب دردشة خاصة
  const requestChat = async (receiverEmail: string) => {
    if (receiverEmail === user?.email) return;
    const { error } = await supabase.from('chat_requests').insert([{ sender_email: user.email, receiver_email: receiverEmail, status: 'pending' }]);
    if (error) alert("حدث خطأ أو تم إرسال طلب مسبقاً.");
    else alert("تم إرسال الطلب بنجاح.");
  };

  // قبول أو رفض الطلب
  const handleRequest = async (requestId: number, senderEmail: string, status: 'accepted' | 'rejected') => {
    await supabase.from('chat_requests').update({ status }).eq('id', requestId);
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    if (status === 'accepted') {
      setFriends(prev => [...prev, { sender_email: senderEmail, id: requestId }]);
      setShowRequestsMenu(false);
      setActiveTab('private');
    }
  };

  // حظر مستخدم (للأدمن)
  const banUser = async (emailToBan: string) => {
    if (!isAdmin) return;
    if (window.confirm(`حظر ${emailToBan}؟`)) {
      await supabase.from('banned_users').insert([{ email: emailToBan }]);
      setPublicMessages((prev) => prev.filter(m => m.user_email !== emailToBan));
    }
  };

  const hasNewRequests = requests.length > 0;

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end">
      
      {/* 🔔 الجرس الأصفر العائم (يظهر فقط عند وجود طلبات) */}
      {hasNewRequests && !isOpen && (
        <button 
          onClick={() => { setIsOpen(true); setShowRequestsMenu(true); }}
          className="mb-4 bg-yellow-500 text-white p-3 rounded-full shadow-lg animate-bounce"
        >
          <Bell className="h-6 w-6" />
        </button>
      )}

      {/* نافذة الدردشة */}
      {isOpen && (
        <div className="bg-[#161616] w-[95vw] sm:w-[380px] h-[75vh] sm:h-[500px] border border-gray-700 rounded-2xl shadow-2xl flex flex-col mb-4 overflow-hidden relative">
          
          {/* الهيدر */}
          <div className="bg-teal-600 p-3 flex justify-between items-center text-white shrink-0">
            <div className="flex items-center gap-2">
              {activeChat && (
                <button onClick={() => setActiveChat(null)} className="hover:bg-teal-700 p-1 rounded">
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <h3 className="font-bold text-sm">
                {activeChat ? `Chat with ${activeChat.sender_email.split('@')[0]}` : (activeTab === 'public' ? 'Public Chat' : 'My Friends')}
              </h3>
            </div>
            
            <div className="flex gap-2 items-center">
              {/* زر الجرس داخل الهيدر */}
              <button onClick={() => setShowRequestsMenu(!showRequestsMenu)} className="relative p-1">
                <Bell className={`h-5 w-5 ${hasNewRequests ? 'text-yellow-300 fill-yellow-300' : 'text-white'}`} />
                {hasNewRequests && <span className="absolute top-0 right-0 bg-red-500 text-[8px] h-3 w-3 rounded-full flex items-center justify-center">{requests.length}</span>}
              </button>
              <button onClick={() => { setIsOpen(false); setActiveChat(null); }} className="hover:bg-teal-700 p-1 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* التبويبات (تظهر فقط إذا لم نكن داخل محادثة) */}
          {!activeChat && (
            <div className="flex bg-[#0a0a0a] border-b border-gray-800">
              <button onClick={() => setActiveTab('public')} className={`flex-1 py-2 text-xs font-bold ${activeTab === 'public' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-gray-500'}`}>Public</button>
              <button onClick={() => setActiveTab('private')} className={`flex-1 py-2 text-xs font-bold ${activeTab === 'private' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-gray-500'}`}>Private</button>
            </div>
          )}

          {/* قائمة الطلبات المنسدلة (عند الضغط على الجرس) */}
          {showRequestsMenu && (
            <div className="absolute top-14 left-0 w-full bg-[#1a1a1a] border-b border-gray-700 z-50 max-h-48 overflow-y-auto shadow-lg">
              {requests.length === 0 ? <p className="text-center text-gray-500 text-xs p-4">No requests</p> : null}
              {requests.map((req) => (
                <div key={req.id} className="p-3 border-b border-gray-800 flex justify-between items-center">
                  <span className="text-xs text-white">{req.sender_email.split('@')[0]}</span>
                  <div className="flex gap-1">
                    <button onClick={() => handleRequest(req.id, req.sender_email, 'accepted')} className="bg-green-600 text-white px-2 py-1 rounded text-[10px] font-bold">Accept</button>
                    <button onClick={() => handleRequest(req.id, req.sender_email, 'rejected')} className="bg-red-600 text-white px-2 py-1 rounded text-[10px] font-bold">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* منطقة المحتوى */}
          <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-3 bg-[#0a0a0a] [overflow-anchor:none]">
            
            {/* 1. الدردشة العامة */}
            {!activeChat && activeTab === 'public' && publicMessages.map((msg, index) => {
              const isMe = msg.user_email === user?.email;
              return (
                <div key={index} className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className={`text-[10px] ${isMe ? 'text-gray-500' : 'text-teal-400 cursor-pointer hover:underline'}`} onClick={() => !isMe && requestChat(msg.user_email)}>
                      {isMe ? 'You' : (msg.username || msg.user_email.split('@')[0])}
                    </span>
                    {isAdmin && !isMe && (
                      <button onClick={() => banUser(msg.user_email)} className="text-red-500 opacity-0 group-hover:opacity-100"><Ban className="h-3 w-3" /></button>
                    )}
                  </div>
                  <div className={`px-3 py-1.5 rounded-xl max-w-[85%] text-sm ${isMe ? 'bg-teal-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none'}`}>{msg.message}</div>
                </div>
              );
            })}

            {/* 2. قائمة الأصدقاء (الخاص) */}
            {!activeChat && activeTab === 'private' && (
              <div className="flex flex-col">
                {friends.length === 0 ? <p className="text-center text-gray-500 text-xs mt-5">No friends yet. Request from public chat.</p> : null}
                {friends.map((friend, index) => (
                  <div key={index} onClick={() => setActiveChat(friend)} className="flex items-center gap-3 p-3 hover:bg-gray-800 cursor-pointer border-b border-gray-800/50">
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center"><User className="h-5 w-5 text-gray-300" /></div>
                    <div className="flex-1"><h4 className="text-sm font-bold text-white">{friend.sender_email.split('@')[0]}</h4></div>
                  </div>
                ))}
              </div>
            )}

            {/* 3. المحادثة الخاصة */}
            {activeChat && privateMessages.map((msg, index) => {
              const isMe = msg.sender_email === user?.email;
              return (
                <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-[9px] text-gray-500 mb-0.5">{isMe ? 'You' : activeChat.sender_email.split('@')[0]}</span>
                  <div className={`px-3 py-1.5 rounded-xl max-w-[85%] text-sm ${isMe ? 'bg-teal-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none'}`}>{msg.message}</div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* حقل الإرسال */}
          {(!activeChat || activeChat) && (
            <form onSubmit={sendMessage} className="p-2 bg-[#161616] border-t border-gray-800 flex gap-2 shrink-0">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
              />
              <button type="submit" className="bg-teal-500 hover:bg-teal-600 text-white p-2 rounded-lg"><Send className="h-5 w-5" /></button>
            </form>
          )}
        </div>
      )}

      {/* الزر العائم الرئيسي (الدردشة) */}
      <button
        onClick={() => { setIsOpen(!isOpen); if (isOpen) setActiveChat(null); }}
        className="bg-teal-500 hover:bg-teal-600 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}