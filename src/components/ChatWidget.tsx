import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { MessageCircle, X, Send, Bell, Ban, ArrowLeft, User, UserPlus, ShieldAlert, Trash2, Clock } from 'lucide-react';
import { ProfanityFilter } from "@nzrm/text-shield";

const filter = new ProfanityFilter({ languages: ["en", "ar"] });

const translations = {
  en: {
    publicChat: 'Public Chat', myFriends: 'My Friends', public: 'Public', private: 'Private',
    chatWith: 'Chat with', typeMessage: 'Type a message...', cancel: 'Cancel', block: 'Block',
    delete: 'Delete', deleteFriend: 'Delete', blockedList: 'Blocked (Last 10)', unblock: 'Unblock',
    close: 'Close', chatRequests: 'Chat Requests', accept: 'Accept', reject: 'Reject',
    sendRequest: 'Send Request', noRequests: 'No requests', noFriends: 'No friends yet.',
    noBlocked: 'No blocked users.', blockedReason: 'You have been blocked (Not sent)',
    iBlockedReason: 'You blocked this user (Not sent)', you: 'You', blockConfirm: 'Block',
    blockConfirmMsg: 'Are you sure you want to block'
  },
  ar: {
    publicChat: 'الدردشة العامة', myFriends: 'أصدقائي', public: 'عام', private: 'خاص',
    chatWith: 'محادثة مع', typeMessage: 'اكتب رسالة...', cancel: 'إلغاء', block: 'حظر',
    delete: 'حذف', deleteFriend: 'حذف الصديق', blockedList: 'المحظورين (آخر 10)', unblock: 'إلغاء الحظر',
    close: 'إغلاق', chatRequests: 'طلبات الدردشة', accept: 'قبول', reject: 'رفض',
    sendRequest: 'إرسال طلب', noRequests: 'لا توجد طلبات', noFriends: 'لا يوجد أصدقاء بعد.',
    noBlocked: 'لا يوجد محظورين.', blockedReason: 'تم حظرك (لم يتم الإرسال)',
    iBlockedReason: 'أنت حظرت هذا المستخدم (لم يتم الإرسال)', you: 'أنت', blockConfirm: 'حظر',
    blockConfirmMsg: 'هل أنت متأكد من حظر'
  }
};

export default function ChatWidget() {
  const { user } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'public' | 'private'>('public');
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const t = translations[lang];

  const [publicMessages, setPublicMessages] = useState<any[]>([]);
  const [privateMessages, setPrivateMessages] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  
  const [blockedEmails, setBlockedEmails] = useState<string[]>([]);
  const [blockedByEmails, setBlockedByEmails] = useState<string[]>([]); 
  
  const [showBlockedList, setShowBlockedList] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false); 
  
  const [friendToDelete, setFriendToDelete] = useState<any | null>(null); 
  const pressTimer = useRef<any>(null); 
  
  const [newMessage, setNewMessage] = useState('');
  const [activeChat, setActiveChat] = useState<any | null>(null); 
  
  const [showRequestsMenu, setShowRequestsMenu] = useState(false);
  const [requestPopupUser, setRequestPopupUser] = useState<any | null>(null); 
  
  const [hasUnreadPrivate, setHasUnreadPrivate] = useState(false);
  const [unreadSenders, setUnreadSenders] = useState<{[key: string]: boolean}>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeChatRef = useRef<any>(null);
  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

  const pendingQueue = useRef<any[]>([]);

  // 👇 الحل الجذري: إخفاء شريط التنقل السفلي وقفل الشاشة عند فتح الدردشة 👇
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'; // منع تمرير الصفحة الخلفية
      document.body.classList.add('chat-is-open');
    } else {
      document.body.style.overflow = 'auto';
      document.body.classList.remove('chat-is-open');
    }

    // إضافة كود CSS يخفي شريط التنقل السفلي (Bottom Nav)
    const style = document.createElement('style');
    style.innerHTML = `
      body.chat-is-open nav, 
      body.chat-is-open .bottom-nav,
      body.chat-is-open div[class*="bottom-nav"] {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.body.style.overflow = 'auto';
      document.body.classList.remove('chat-is-open');
      document.head.removeChild(style);
    };
  }, [isOpen]);

  const fetchData = async () => {
    if (!user?.email) return;
    
    const { data: pub } = await supabase.from('public_chat').select('*').order('created_at', { ascending: false }).limit(50);
    if (pub) setPublicMessages(pub.reverse());

    const { data: req } = await supabase.from('chat_requests').select('*').eq('receiver_email', user.email).eq('status', 'pending');
    if (req) setRequests(req);

    const { data: friendData } = await supabase
      .from('chat_requests').select('*').or(`receiver_email.eq.${user.email},sender_email.eq.${user.email}`).eq('status', 'accepted');

    if (friendData) {
      const formattedFriends = friendData.map(row => {
        const isReceiver = row.receiver_email === user.email;
        const otherEmail = isReceiver ? row.sender_email : row.receiver_email;
        return { id: row.id, email: otherEmail, username: otherEmail.split('@')[0] };
      });
      const uniqueFriends = Array.from(new Map(formattedFriends.map(item => [item.email, item])).values());
      setFriends(uniqueFriends);
    }

    const { data: blocks } = await supabase.from('user_blocks').select('blocked_email').eq('blocker_email', user.email).order('created_at', { ascending: false }).limit(10); 
    if (blocks) setBlockedEmails(blocks.map(b => b.blocked_email));

    const { data: blocksBy } = await supabase.from('user_blocks').select('blocker_email').eq('blocked_email', user.email);
    if (blocksBy) setBlockedByEmails(blocksBy.map(b => b.blocker_email));
  };

  useEffect(() => {
    if (!activeChat || !user?.email) return;
    
    const fetchPrivate = async () => {
      const { data } = await supabase.from('private_messages').select('*')
        .or(`and(sender_email.eq.${user.email},receiver_email.eq.${activeChat.email}),and(sender_email.eq.${activeChat.email},receiver_email.eq.${user.email})`)
        .order('created_at', { ascending: false }).limit(50);
      if (data) setPrivateMessages(data.reverse());
    };
    fetchPrivate();
  }, [activeChat?.email, user?.email]);

  useEffect(() => {
    if (!user?.email) return;
    fetchData();

    const publicChannel = supabase.channel('realtime_public_chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'public_chat' }, (payload) => {
        setPublicMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
      }).subscribe();

    const privateChannel = supabase.channel('realtime_private_chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'private_messages' }, (payload) => {
        const msg = payload.new;
        if (msg.receiver_email === user.email) {
          setUnreadSenders(prev => ({ ...prev, [msg.sender_email]: true }));
          if (!isOpen || activeTab !== 'private' || !activeChatRef.current) setHasUnreadPrivate(true);
        }
        if (activeChatRef.current && (msg.sender_email === activeChatRef.current.email || msg.receiver_email === activeChatRef.current.email)) {
          setPrivateMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      }).subscribe();

    const pollInterval = setInterval(async () => {
      if (!navigator.onLine) return;

      const { data: pub } = await supabase.from('public_chat').select('*').order('created_at', { ascending: false }).limit(50);
      if (pub) {
        const sortedPub = pub.reverse();
        setPublicMessages(prev => {
          const pendingMsgs = prev.filter(m => m.isPending);
          const merged = [...sortedPub];
          pendingMsgs.forEach(pm => {
            if (!merged.some(m => m.message === pm.message && m.user_email === pm.user_email)) merged.push(pm);
          });
          return merged;
        });
      }

      if (activeChatRef.current) {
        const { data: priv } = await supabase.from('private_messages').select('*')
          .or(`and(sender_email.eq.${user.email},receiver_email.eq.${activeChatRef.current.email}),and(sender_email.eq.${activeChatRef.current.email},receiver_email.eq.${user.email})`)
          .order('created_at', { ascending: false }).limit(50);
        if (priv) {
          const sortedPriv = priv.reverse();
          setPrivateMessages(prev => {
            const pendingMsgs = prev.filter(m => m.isPending);
            const merged = [...sortedPriv];
            pendingMsgs.forEach(pm => {
              if (!merged.some(m => m.message === pm.message && m.sender_email === pm.sender_email)) merged.push(pm);
            });
            return merged;
          });
        }
      }
    }, 3000);

    return () => {
      supabase.removeChannel(publicChannel);
      supabase.removeChannel(privateChannel);
      clearInterval(pollInterval);
    };
  }, [user?.email, isOpen, activeTab]); 

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!navigator.onLine || pendingQueue.current.length === 0) return;

      const item = pendingQueue.current[0];
      let error = null;
      let data = null;

      if (item.type === 'public') {
        const res = await supabase.from('public_chat').insert([{ 
          user_email: item.msg.user_email, username: item.msg.username, message: item.msg.message 
        }]).select().single();
        error = res.error; data = res.data;
        if (!error && data) setPublicMessages(prev => prev.map(m => m.id === item.msg.id ? { ...data, isPending: false } : m));
      } else {
        const res = await supabase.from('private_messages').insert([{ 
          sender_email: item.msg.sender_email, receiver_email: item.msg.receiver_email, message: item.msg.message 
        }]).select().single();
        error = res.error; data = res.data;
        if (!error && data) setPrivateMessages(prev => prev.map(m => m.id === item.msg.id ? { ...data, isPending: false } : m));
      }

      if (!error) pendingQueue.current.shift();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [publicMessages, privateMessages, activeChat, isOpen]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user?.email) return;

    const messageToSend = filter.clean(newMessage);
    setNewMessage(''); 

    if (activeChat) {
      const iBlockedThem = blockedEmails.includes(activeChat.email);
      const theyBlockedMe = blockedByEmails.includes(activeChat.email);

      if (iBlockedThem || theyBlockedMe) {
        const blockedMsg = {
          id: `temp-${Date.now()}`, sender_email: user.email, receiver_email: activeChat.email, message: messageToSend,
          created_at: new Date().toISOString(), isBlockedMsg: true,
          blockReason: theyBlockedMe ? t.blockedReason : t.iBlockedReason
        };
        setPrivateMessages(prev => [...prev, blockedMsg]);
        return; 
      }

      const tempId = `temp-${Date.now()}`;
      const tempMsg = { id: tempId, sender_email: user.email, receiver_email: activeChat.email, message: messageToSend, created_at: new Date().toISOString(), isPending: true };
      setPrivateMessages(prev => [...prev, tempMsg]);
      
      pendingQueue.current.push({ type: 'private', msg: tempMsg });
      
    } else {
      const tempId = `temp-${Date.now()}`;
      const tempMsg = { id: tempId, user_email: user.email, username: user.email.split('@')[0], message: messageToSend, created_at: new Date().toISOString(), isPending: true };
      setPublicMessages(prev => [...prev, tempMsg]);

      pendingQueue.current.push({ type: 'public', msg: tempMsg });
    }
  };

  const openChat = (friend: any) => {
    setActiveChat(friend);
    setUnreadSenders(prev => ({ ...prev, [friend.email]: false }));
    setHasUnreadPrivate(false);
  };

  const sendFriendRequest = async () => {
    if (!requestPopupUser) return;
    await supabase.from('chat_requests').insert([{ sender_email: user.email, receiver_email: requestPopupUser.email, status: 'pending' }]);
    alert(`${t.sendRequest}: ${requestPopupUser.username}`);
    setRequestPopupUser(null);
  };

  const blockUser = async (emailToBlock: string) => {
    if (!user?.email) return;
    const { error } = await supabase.from('user_blocks').insert([{ blocker_email: user.email, blocked_email: emailToBlock }]);
    if (!error) {
      setBlockedEmails(prev => [emailToBlock, ...prev].slice(0, 10));
      setShowBlockConfirm(false);
      setActiveChat(null); 
    }
  };

  const unblockUser = async (emailToUnblock: string) => {
    await supabase.from('user_blocks').delete().eq('blocker_email', user.email).eq('blocked_email', emailToUnblock);
    setBlockedEmails(prev => prev.filter(e => e !== emailToUnblock));
  };

  const handleRequest = async (id: number, senderEmail: string, status: 'accepted' | 'rejected') => {
    await supabase.from('chat_requests').update({ status }).eq('id', id);
    setRequests(prev => prev.filter(r => r.id !== id));
    if (status === 'accepted') { fetchData(); setActiveTab('private'); }
  };

  const deleteFriend = async (id: number) => {
    await supabase.from('chat_requests').delete().eq('id', id);
    setFriends(prev => prev.filter(f => f.id !== id));
    setFriendToDelete(null);
  };

  const handlePressStart = (friend: any) => { pressTimer.current = setTimeout(() => { setFriendToDelete(friend); }, 800); };
  const handlePressEnd = () => { if (pressTimer.current) clearTimeout(pressTimer.current); };

  const hasNewRequests = requests.length > 0;
  const showYellowBadge = !isOpen && (hasNewRequests || hasUnreadPrivate);

  const visiblePublicMessages = publicMessages.filter(m => !blockedEmails.includes(m.user_email));
  const visibleFriends = friends.filter(f => !blockedEmails.includes(f.email));

  return (
    // الزر العائم تم وضعه في مكانه الصحيح
    <div className="fixed bottom-24 right-0 sm:right-4 z-50 flex flex-col items-end w-full sm:w-auto px-2 sm:px-0 pointer-events-none">
      
      {requestPopupUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 pointer-events-auto" onClick={() => setRequestPopupUser(null)}>
          <div className="bg-[#1a1a1a] p-5 rounded-xl border border-gray-700 shadow-2xl flex flex-col items-center w-64" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mb-3"><User className="h-6 w-6 text-gray-300" /></div>
            <h4 className="text-white font-bold mb-4">{requestPopupUser.username}</h4>
            <button onClick={sendFriendRequest} className="w-full bg-teal-500 hover:bg-teal-600 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2">
              <UserPlus className="h-4 w-4" /> {t.sendRequest}
            </button>
          </div>
        </div>
      )}

      {showBlockConfirm && activeChat && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 pointer-events-auto" onClick={() => setShowBlockConfirm(false)}>
          <div className="bg-[#1a1a1a] p-5 rounded-xl border border-gray-700 shadow-2xl flex flex-col items-center w-64" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-900/50 rounded-full flex items-center justify-center mb-3"><Ban className="h-6 w-6 text-red-500" /></div>
            <h4 className="text-white font-bold mb-1 text-center">{t.blockConfirmMsg} {activeChat.username}?</h4>
            <div className="flex gap-2 w-full mt-4">
              <button onClick={() => setShowBlockConfirm(false)} className="flex-1 bg-gray-700 text-white py-2 rounded-lg text-xs">{t.cancel}</button>
              <button onClick={() => blockUser(activeChat.email)} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-xs font-bold">{t.block}</button>
            </div>
          </div>
        </div>
      )}

      {friendToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 pointer-events-auto" onClick={() => setFriendToDelete(null)}>
          <div className="bg-[#1a1a1a] p-5 rounded-xl border border-gray-700 shadow-2xl flex flex-col items-center w-64" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-900/50 rounded-full flex items-center justify-center mb-3"><Trash2 className="h-6 w-6 text-red-500" /></div>
            <h4 className="text-white font-bold mb-1 text-center">{t.deleteFriend} {friendToDelete.username}?</h4>
            <div className="flex gap-2 w-full mt-4">
              <button onClick={() => setFriendToDelete(null)} className="flex-1 bg-gray-700 text-white py-2 rounded-lg text-xs">{t.cancel}</button>
              <button onClick={() => deleteFriend(friendToDelete.id)} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-xs font-bold">{t.delete}</button>
            </div>
          </div>
        </div>
      )}

      {showBlockedList && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 pointer-events-auto" onClick={() => setShowBlockedList(false)}>
          <div className="bg-[#1a1a1a] p-5 rounded-xl border border-gray-700 shadow-2xl w-[80vw] sm:w-72 max-h-[60vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-bold mb-4 flex items-center gap-2 border-b border-gray-700 pb-2"><ShieldAlert className="h-5 w-5 text-red-500" /> {t.blockedList}</h3>
            <div className="flex-1 overflow-y-auto min-h-0">
              {blockedEmails.length === 0 ? <p className="text-gray-500 text-xs text-center py-4">{t.noBlocked}</p> : 
                blockedEmails.map(email => (
                  <div key={email} className="flex items-center justify-between bg-gray-800 p-2 rounded mb-2">
                    <span className="text-xs text-white truncate max-w-[120px]">{email.split('@')[0]}</span>
                    <button onClick={() => unblockUser(email)} className="text-teal-400 text-[10px] bg-teal-500/20 px-2 py-1 rounded hover:bg-teal-500/40">{t.unblock}</button>
                  </div>
                ))
              }
            </div>
            <button onClick={() => setShowBlockedList(false)} className="mt-4 w-full bg-gray-700 text-white py-2 rounded text-xs">{t.close}</button>
          </div>
        </div>
      )}

      {showRequestsMenu && (
        <>
          <div className="fixed inset-0 z-40 pointer-events-auto" onClick={() => setShowRequestsMenu(false)}></div>
          <div className="absolute bottom-[70px] right-4 w-[300px] sm:w-[380px] bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden pointer-events-auto">
            <div className="p-3 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-white font-bold text-sm">{t.chatRequests}</h3>
              <button onClick={() => setShowRequestsMenu(false)} className="text-gray-400 hover:text-white"><X className="h-4 w-4"/></button>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {requests.length === 0 ? <p className="text-center text-gray-500 text-xs p-4">{t.noRequests}</p> : null}
              {requests.map((req) => (
                <div key={req.id} className="p-3 border-b border-gray-800 flex justify-between items-center">
                  <span className="text-xs text-white">{req.sender_email.split('@')[0]}</span>
                  <div className="flex gap-1">
                    <button onClick={() => handleRequest(req.id, req.sender_email, 'accepted')} className="bg-green-600 text-white px-2 py-1 rounded text-[10px] font-bold">{t.accept}</button>
                    <button onClick={() => handleRequest(req.id, req.sender_email, 'rejected')} className="bg-red-600 text-white px-2 py-1 rounded text-[10px] font-bold">{t.reject}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {isOpen && (
        // 👇 تصميم الدردشة: عرض 96%، ارتفاع 75%، ومثبتة في الأسفل لكي لا يتحرك الزر 👇
        <div className="bg-[#161616] w-[96vw] sm:w-[380px] h-[75dvh] sm:h-[500px] border border-gray-700 rounded-2xl shadow-2xl flex flex-col mb-4 overflow-hidden relative pointer-events-auto" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          
          <div className="bg-teal-600 p-3 flex justify-between items-center text-white shrink-0">
            <div className="flex items-center gap-2">
              {activeChat && (
                <button onClick={() => setActiveChat(null)} className={`hover:bg-teal-700 p-1 rounded ${lang === 'ar' ? 'rotate-180' : ''}`}>
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <h3 className="font-bold text-sm flex items-center gap-2">
                {activeChat ? (
                  <>
                    {t.chatWith} {activeChat.username}
                    <button onClick={() => setShowBlockConfirm(true)} className="text-white hover:scale-110 p-1 bg-red-600 rounded-full transition-transform" title={t.block}>
                      <User className="h-4 w-4" />
                    </button>
                  </>
                ) : (activeTab === 'public' ? t.publicChat : t.myFriends)}
              </h3>
            </div>
            
            <div className="flex gap-2 items-center">
              <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="text-xs bg-teal-700 hover:bg-teal-800 px-2 py-1 rounded font-bold transition-colors">
                {lang === 'en' ? 'AR' : 'EN'}
              </button>

              {!activeChat && activeTab === 'private' && (
                <button onClick={() => setShowBlockedList(true)} className="hover:bg-teal-700 p-1 rounded text-red-200">
                  <ShieldAlert className="h-5 w-5" />
                </button>
              )}
              <button onClick={() => setShowRequestsMenu(!showRequestsMenu)} className="relative p-1">
                <Bell className={`h-5 w-5 ${hasNewRequests ? 'text-yellow-300 fill-yellow-300' : 'text-white'}`} />
                {hasNewRequests && <span className="absolute top-0 right-0 bg-red-500 text-[8px] h-3 w-3 rounded-full flex items-center justify-center">{requests.length}</span>}
              </button>
              <button onClick={() => { setIsOpen(false); setActiveChat(null); }} className="hover:bg-teal-700 p-1 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {!activeChat && (
            <div className="flex bg-[#0a0a0a] border-b border-gray-800 shrink-0">
              <button onClick={() => setActiveTab('public')} className={`flex-1 py-2 text-xs font-bold ${activeTab === 'public' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-gray-500'}`}>{t.public}</button>
              <button onClick={() => setActiveTab('private')} className={`flex-1 py-2 text-xs font-bold ${activeTab === 'private' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-gray-500'}`}>{t.private}</button>
            </div>
          )}

          <div className="flex-1 min-h-0 p-3 overflow-y-auto flex flex-col gap-3 bg-[#0a0a0a] [overflow-anchor:none]">
            {!activeChat && activeTab === 'public' && visiblePublicMessages.map((msg, index) => {
              const isMe = msg.user_email === user?.email;
              return (
                <div key={index} className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`text-[11px] font-medium ${isMe ? 'text-gray-500' : 'text-gray-400'}`}>{isMe ? t.you : (msg.username || msg.user_email.split('@')[0])}</span>
                    {!isMe && (
                      <button onClick={() => setRequestPopupUser({ email: msg.user_email, username: msg.username || msg.user_email.split('@')[0] })} className="text-teal-400 hover:text-teal-300 p-0.5">
                        <User className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div dir="auto" className={`px-3 py-1.5 rounded-xl max-w-[85%] text-sm flex items-center gap-2 ${isMe ? 'bg-teal-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none'}`}>
                    {msg.message}
                    {msg.isPending && <Clock className="h-3 w-3 text-gray-300 animate-pulse" />}
                  </div>
                </div>
              );
            })}

            {!activeChat && activeTab === 'private' && (
              <div className="flex flex-col select-none">
                {visibleFriends.length === 0 ? <p className="text-center text-gray-500 text-xs mt-5">{t.noFriends}</p> : null}
                {visibleFriends.map((friend, index) => {
                  const hasUnread = unreadSenders[friend.email];
                  return (
                    <div 
                      key={index} 
                      onMouseDown={() => handlePressStart(friend)} onMouseUp={handlePressEnd} onMouseLeave={handlePressEnd}
                      onTouchStart={() => handlePressStart(friend)} onTouchEnd={handlePressEnd}
                      onClick={() => openChat(friend)} 
                      className="flex items-center gap-3 p-3 hover:bg-gray-800 cursor-pointer border-b border-gray-800/50 active:bg-gray-700 relative"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center relative">
                        <User className="h-5 w-5 text-gray-300" />
                        {hasUnread && (
                          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-[#0a0a0a] rounded-full"></span>
                        )}
                      </div>
                      <div className="flex-1"><h4 className="text-sm font-bold text-white">{friend.username}</h4></div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeChat && privateMessages.map((msg, index) => {
              const isMe = msg.sender_email === user?.email;
              return (
                <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-[9px] text-gray-500 mb-0.5">{isMe ? t.you : activeChat.username}</span>
                  
                  <div dir="auto" className={`px-3 py-1.5 rounded-xl max-w-[85%] text-sm flex items-center gap-2 ${
                    msg.isBlockedMsg 
                      ? 'bg-red-900/40 border border-red-500/50 text-red-100 opacity-80' 
                      : (isMe ? 'bg-teal-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none')
                  }`}>
                    {msg.message}
                    {msg.isPending && <Clock className="h-3 w-3 text-gray-300 animate-pulse" />}
                  </div>

                  {msg.isBlockedMsg && (
                    <span className="text-[10px] text-red-500 mt-1 font-bold">
                      {msg.blockReason}
                    </span>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {(activeChat || (!activeChat && activeTab === 'public')) && (
            <form onSubmit={sendMessage} className="p-2 bg-[#161616] border-t border-gray-800 flex gap-2 shrink-0">
              <input type="text" dir="auto" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={t.typeMessage} className="flex-1 bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"/>
              <button type="submit" className="bg-teal-500 hover:bg-teal-600 text-white p-2 rounded-lg"><Send className="h-5 w-5" /></button>
            </form>
          )}
        </div>
      )}

      {!isOpen && (
        <button 
          onClick={() => { 
            setIsOpen(true); 
            if (hasUnreadPrivate || hasNewRequests) {
              setActiveTab('private');
            }
          }} 
          className={`bg-teal-500 hover:bg-teal-600 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105 mr-4 pointer-events-auto relative ${showYellowBadge ? 'animate-pulse' : ''}`}
        >
          <MessageCircle className="h-6 w-6" />
          
          {showYellowBadge && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-5 w-5 bg-yellow-500 border-2 border-[#0a0a0a] flex items-center justify-center">
                <Bell className="h-3 w-3 text-white" />
              </span>
            </span>
          )}
        </button>
      )}
    </div>
  );
}