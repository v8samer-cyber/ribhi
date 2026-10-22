import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { MessageCircle, X, Send, Bell, Ban, ArrowLeft, User, UserPlus, Settings, UserX, ShieldAlert } from 'lucide-react';
import { ProfanityFilter } from "@nzrm/text-shield";

const filter = new ProfanityFilter({ languages: ["en", "ar"] });

export default function ChatWidget() {
  const { user } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'public' | 'private'>('public');
  
  const [publicMessages, setPublicMessages] = useState<any[]>([]);
  const [privateMessages, setPrivateMessages] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  
  const [blockedEmails, setBlockedEmails] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  
  const [newMessage, setNewMessage] = useState('');
  const [activeChat, setActiveChat] = useState<any | null>(null); 
  
  const [showRequestsMenu, setShowRequestsMenu] = useState(false);
  const [requestPopupUser, setRequestPopupUser] = useState<any | null>(null); 
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAdmin = user?.email === "v8samer@gmail.com";

  const keepLast50 = (msgs: any[]) => msgs.slice(-50);

  // 1. جلب البيانات الأولية
  const fetchInitialData = async () => {
    if (!user?.email) return;
    
    const { data: pub } = await supabase.from('public_chat').select('*').order('created_at', { ascending: true }).limit(50);
    if (pub) setPublicMessages(pub);

    const { data: req } = await supabase.from('chat_requests').select('*').eq('receiver_email', user.email).eq('status', 'pending');
    if (req) setRequests(req);

    const { data: friendData } = await supabase
      .from('chat_requests')
      .select('*')
      .or(`receiver_email.eq.${user.email},sender_email.eq.${user.email}`)
      .eq('status', 'accepted');

    if (friendData) {
      const formattedFriends = friendData.map(row => {
        const isReceiver = row.receiver_email === user.email;
        const otherEmail = isReceiver ? row.sender_email : row.receiver_email;
        return { email: otherEmail, username: otherEmail.split('@')[0] };
      });
      const uniqueFriends = Array.from(new Map(formattedFriends.map(item => [item.email, item])).values());
      setFriends(uniqueFriends);
    }

    // 👇 جلب آخر 10 أشخاص محظورين فقط (حسب التاريخ)
    const { data: blocks } = await supabase
      .from('user_blocks')
      .select('blocked_email')
      .eq('blocker_email', user.email)
      .order('created_at', { ascending: false }) // الأحدث أولاً
      .limit(10); // حد أقصى 10
      
    if (blocks) setBlockedEmails(blocks.map(b => b.blocked_email));
  };

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  // 2. الاستماع للرسائل الحية (Realtime)
  useEffect(() => {
    if (!user?.email) return;

    const uniqueId = Math.random().toString(36).substring(7);

    const publicChannel = supabase.channel(`public_${uniqueId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'public_chat' }, (payload) => {
        setPublicMessages((prev) => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return keepLast50([...prev, payload.new]);
        });
      }).subscribe();

    const requestsChannel = supabase.channel(`requests_${uniqueId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_requests' }, (payload) => {
        const newData = payload.new as any;
        if (payload.eventType === 'INSERT' && newData?.receiver_email === user.email && newData?.status === 'pending') {
          setRequests(prev => [...prev, newData]);
        }
        if (payload.eventType === 'UPDATE' && newData?.status === 'accepted') {
          fetchInitialData(); 
        }
      }).subscribe();

    return () => {
      supabase.removeChannel(publicChannel);
      supabase.removeChannel(requestsChannel);
    };
  }, [user]);

  // 3. الاستماع للرسائل الخاصة
  useEffect(() => {
    if (!activeChat || !user?.email) return;

    const fetchPrivate = async () => {
      const { data } = await supabase.from('private_messages').select('*')
        .or(`and(sender_email.eq.${user.email},receiver_email.eq.${activeChat.email}),and(sender_email.eq.${activeChat.email},receiver_email.eq.${user.email})`)
        .order('created_at', { ascending: true })
        .limit(50);
      if (data) setPrivateMessages(data);
    };
    fetchPrivate();

    const uniqueId = Math.random().toString(36).substring(7);
    const privateChannel = supabase.channel(`private_${activeChat.email}_${uniqueId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'private_messages' }, (payload) => {
        const msg = payload.new as any;
        if ((msg.sender_email === user.email && msg.receiver_email === activeChat.email) || 
            (msg.sender_email === activeChat.email && msg.receiver_email === user.email)) {
          setPrivateMessages((prev) => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return keepLast50([...prev, msg]);
          });
        }
      }).subscribe();

    return () => { supabase.removeChannel(privateChannel); };
  }, [activeChat, user]);

  useEffect(() => {
    if (isOpen) setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [publicMessages, privateMessages, activeChat, isOpen]);

  // إرسال رسالة
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user?.email) return;
    
    if (activeChat && blockedEmails.includes(activeChat.email)) {
      alert("لا يمكنك مراسلة هذا الشخص لأنه محظور.");
      return;
    }

    const messageToSend = filter.clean(newMessage);
    setNewMessage('');

    if (activeChat) {
      const tempMsg = { id: Date.now(), sender_email: user.email, receiver_email: activeChat.email, message: messageToSend, created_at: new Date().toISOString() };
      setPrivateMessages(prev => keepLast50([...prev, tempMsg]));
      await supabase.from('private_messages').insert([{ sender_email: user.email, receiver_email: activeChat.email, message: messageToSend }]);
    } else {
      const tempMsg = { id: Date.now(), user_email: user.email, username: user.email.split('@')[0], message: messageToSend, created_at: new Date().toISOString() };
      setPublicMessages(prev => keepLast50([...prev, tempMsg]));
      await supabase.from('public_chat').insert([{ user_email: user.email, username: user.email.split('@')[0], message: messageToSend }]);
    }
  };

  // إرسال طلب صداقة
  const sendFriendRequest = async () => {
    if (!requestPopupUser) return;
    await supabase.from('chat_requests').insert([{ sender_email: user.email, receiver_email: requestPopupUser.email, status: 'pending' }]);
    alert(`تم إرسال طلب إلى ${requestPopupUser.username}`);
    setRequestPopupUser(null);
  };

  // حظر مستخدم
  const blockUser = async (emailToBlock: string) => {
    if (!user?.email) return;
    const { error } = await supabase.from('user_blocks').insert([{ blocker_email: user.email, blocked_email: emailToBlock }]);
    if (!error) {
      setBlockedEmails(prev => [...prev, emailToBlock]);
      setRequestPopupUser(null);
      if (activeChat?.email === emailToBlock) setActiveChat(null);
    }
  };

  // فك الحظر
  const unblockUser = async (emailToUnblock: string) => {
    await supabase.from('user_blocks').delete().eq('blocker_email', user.email).eq('blocked_email', emailToUnblock);
    setBlockedEmails(prev => prev.filter(e => e !== emailToUnblock));
  };

  const handleRequest = async (id: number, senderEmail: string, status: 'accepted' | 'rejected') => {
    await supabase.from('chat_requests').update({ status }).eq('id', id);
    setRequests(prev => prev.filter(r => r.id !== id));
    if (status === 'accepted') {
      fetchInitialData();
      setActiveTab('private');
    }
  };

  const banUser = async (emailToBan: string) => {
    if (!isAdmin) return;
    if (window.confirm(`حظر ${emailToBan} نهائياً من الموقع؟`)) {
      await supabase.from('banned_users').insert([{ email: emailToBan }]);
      setPublicMessages(prev => prev.filter(m => m.user_email !== emailToBan));
    }
  };

  const hasNewRequests = requests.length > 0;
  const visiblePublicMessages = publicMessages.filter(m => !blockedEmails.includes(m.user_email));
  const visibleFriends = friends.filter(f => !blockedEmails.includes(f.email));

  return (
    <div className="fixed bottom-20 right-0 sm:right-4 z-50 flex flex-col items-end w-full sm:w-auto px-2 sm:px-0 pointer-events-none">
      
      {/* 1. نافذة طلب الصداقة + الحظر */}
      {requestPopupUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 pointer-events-auto" onClick={() => setRequestPopupUser(null)}>
          <div className="bg-[#1a1a1a] p-5 rounded-xl border border-gray-700 shadow-2xl flex flex-col items-center w-64" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mb-3">
              <User className="h-6 w-6 text-gray-300" />
            </div>
            <h4 className="text-white font-bold mb-4">{requestPopupUser.username}</h4>
            
            <button onClick={sendFriendRequest} className="w-full bg-teal-500 hover:bg-teal-600 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 mb-2">
              <UserPlus className="h-4 w-4" /> Send Request
            </button>
            
            <button onClick={() => blockUser(requestPopupUser.email)} className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2">
              <UserX className="h-4 w-4" /> Block User
            </button>
          </div>
        </div>
      )}

      {/* 2. نافذة إعدادات الحظر (المحظورين) */}
      {showSettings && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 pointer-events-auto" onClick={() => setShowSettings(false)}>
          <div className="bg-[#1a1a1a] p-5 rounded-xl border border-gray-700 shadow-2xl w-[80vw] sm:w-72 max-h-[60vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-bold mb-4 flex items-center gap-2 border-b border-gray-700 pb-2">
              <Ban className="h-5 w-5 text-red-500" /> Blocked Users (Last 10)
            </h3>
            
            <div className="flex-1 overflow-y-auto min-h-0">
              {blockedEmails.length === 0 ? (
                <p className="text-gray-500 text-xs text-center py-4">No blocked users.</p>
              ) : (
                blockedEmails.map(email => (
                  <div key={email} className="flex items-center justify-between bg-gray-800 p-2 rounded mb-2">
                    <span className="text-xs text-white truncate max-w-[120px]">{email.split('@')[0]}</span>
                    <button onClick={() => unblockUser(email)} className="text-teal-400 text-[10px] bg-teal-500/20 px-2 py-1 rounded hover:bg-teal-500/40">
                      Unblock
                    </button>
                  </div>
                ))
              )}
            </div>
            
            <button onClick={() => setShowSettings(false)} className="mt-4 w-full bg-gray-700 text-white py-2 rounded text-xs">Close</button>
          </div>
        </div>
      )}

      {hasNewRequests && !isOpen && (
        <button onClick={() => { setIsOpen(true); setShowRequestsMenu(true); }} className="mb-4 mr-4 bg-yellow-500 text-white p-3 rounded-full shadow-lg animate-bounce pointer-events-auto">
          <Bell className="h-6 w-6" />
        </button>
      )}

      {isOpen && (
        <div className="bg-[#161616] w-[96vw] sm:w-[380px] h-[75vh] sm:h-[500px] border border-gray-700 rounded-2xl shadow-2xl flex flex-col mb-4 overflow-hidden relative pointer-events-auto">
          
          <div className="bg-teal-600 p-3 flex justify-between items-center text-white shrink-0">
            <div className="flex items-center gap-2">
              {activeChat && (
                <button onClick={() => setActiveChat(null)} className="hover:bg-teal-700 p-1 rounded">
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <h3 className="font-bold text-sm">
                {activeChat ? `Chat with ${activeChat.username}` : (activeTab === 'public' ? 'Public Chat' : 'My Friends')}
              </h3>
            </div>
            
            <div className="flex gap-2 items-center">
              {/* 👇 زر الحظر 🚯 في الأعلى (يظهر دائماً لإدارة المحظورين) 👇 */}
              <button onClick={() => setShowSettings(true)} className="hover:bg-teal-700 p-1 rounded text-red-200" title="Blocked Users">
                <Ban className="h-5 w-5" />
              </button>

              {/* زر حظر الصديق (يظهر فقط عند فتح محادثة خاصة) */}
              {activeChat && (
                <button onClick={() => blockUser(activeChat.email)} className="hover:bg-teal-700 p-1 rounded text-red-300" title="Block this user">
                  <UserX className="h-5 w-5" />
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
              <button onClick={() => setActiveTab('public')} className={`flex-1 py-2 text-xs font-bold ${activeTab === 'public' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-gray-500'}`}>Public</button>
              <button onClick={() => setActiveTab('private')} className={`flex-1 py-2 text-xs font-bold ${activeTab === 'private' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-gray-500'}`}>Private</button>
            </div>
          )}

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

          <div className="flex-1 min-h-0 p-3 overflow-y-auto flex flex-col gap-3 bg-[#0a0a0a] [overflow-anchor:none]">
            
            {/* الدردشة العامة */}
            {!activeChat && activeTab === 'public' && visiblePublicMessages.map((msg, index) => {
              const isMe = msg.user_email === user?.email;
              const username = msg.username || msg.user_email.split('@')[0];
              return (
                <div key={index} className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`text-[11px] font-medium ${isMe ? 'text-gray-500' : 'text-gray-400'}`}>
                      {isMe ? 'You' : username}
                    </span>
                    
                    {!isMe && (
                      <button onClick={() => setRequestPopupUser({ email: msg.user_email, username })} className="text-teal-400 hover:text-teal-300 p-0.5">
                        <User className="h-4 w-4" />
                      </button>
                    )}

                    {isAdmin && !isMe && <button onClick={() => banUser(msg.user_email)} className="text-red-500 opacity-0 group-hover:opacity-100"><Ban className="h-4 w-4" /></button>}
                  </div>
                  <div className={`px-3 py-1.5 rounded-xl max-w-[85%] text-sm ${isMe ? 'bg-teal-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none'}`}>{msg.message}</div>
                </div>
              );
            })}

            {/* قائمة الأصدقاء */}
            {!activeChat && activeTab === 'private' && (
              <div className="flex flex-col">
                {visibleFriends.length === 0 ? <p className="text-center text-gray-500 text-xs mt-5">No friends yet.</p> : null}
                {visibleFriends.map((friend, index) => (
                  <div key={index} onClick={() => setActiveChat(friend)} className="flex items-center gap-3 p-3 hover:bg-gray-800 cursor-pointer border-b border-gray-800/50">
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center"><User className="h-5 w-5 text-gray-300" /></div>
                    <div className="flex-1"><h4 className="text-sm font-bold text-white">{friend.username}</h4></div>
                  </div>
                ))}
              </div>
            )}

            {/* الدردشة الخاصة */}
            {activeChat && privateMessages.map((msg, index) => {
              const isMe = msg.sender_email === user?.email;
              return (
                <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-[9px] text-gray-500 mb-0.5">{isMe ? 'You' : activeChat.username}</span>
                  <div className={`px-3 py-1.5 rounded-xl max-w-[85%] text-sm ${isMe ? 'bg-teal-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none'}`}>{msg.message}</div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

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
        </div>
      )}

      <button onClick={() => { setIsOpen(!isOpen); }} className="bg-teal-500 hover:bg-teal-600 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105 mr-4 pointer-events-auto">
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}