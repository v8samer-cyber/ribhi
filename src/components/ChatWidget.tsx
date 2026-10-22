import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { MessageCircle, X, Send, Bell, Ban, ArrowLeft, User, UserPlus, UserX, ShieldAlert, Trash2 } from 'lucide-react';
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
  const [showBlockedList, setShowBlockedList] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false); 
  
  const [friendToDelete, setFriendToDelete] = useState<any | null>(null); 
  const pressTimer = useRef<any>(null); 
  
  const [newMessage, setNewMessage] = useState('');
  const [activeChat, setActiveChat] = useState<any | null>(null); 
  
  const [showRequestsMenu, setShowRequestsMenu] = useState(false);
  const [requestPopupUser, setRequestPopupUser] = useState<any | null>(null); 
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // دالة جلب البيانات الأساسية
  const fetchData = async () => {
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
        return { id: row.id, email: otherEmail, username: otherEmail.split('@')[0] };
      });
      const uniqueFriends = Array.from(new Map(formattedFriends.map(item => [item.email, item])).values());
      setFriends(uniqueFriends);
    }

    const { data: blocks } = await supabase
      .from('user_blocks')
      .select('blocked_email')
      .eq('blocker_email', user.email)
      .order('created_at', { ascending: false })
      .limit(10); 
    if (blocks) setBlockedEmails(blocks.map(b => b.blocked_email));
  };

  // 👇 نظام المزامنة الذكية (بديل الـ Realtime) 👇
  useEffect(() => {
    fetchData(); // جلب أولي

    const interval = setInterval(async () => {
      if (!user?.email) return;

      // 1. مزامنة الرسائل العامة (إضافة الجديد فقط دون مسح القديم)
      const { data: pub } = await supabase.from('public_chat').select('*').order('created_at', { ascending: true }).limit(50);
      if (pub) {
        setPublicMessages(prev => {
          const newMsgs = pub.filter(p => !prev.some(m => m.id === p.id));
          return newMsgs.length > 0 ? [...prev, ...newMsgs].slice(-50) : prev;
        });
      }

      // 2. مزامنة الطلبات
      const { data: req } = await supabase.from('chat_requests').select('*').eq('receiver_email', user.email).eq('status', 'pending');
      if (req) setRequests(req);

      // 3. مزامنة المحادثة المفتوحة
      if (activeChat) {
        const { data: priv } = await supabase.from('private_messages').select('*')
          .or(`and(sender_email.eq.${user.email},receiver_email.eq.${activeChat.email}),and(sender_email.eq.${activeChat.email},receiver_email.eq.${user.email})`)
          .order('created_at', { ascending: true }).limit(50);
        
        if (priv) {
          setPrivateMessages(prev => {
            const newMsgs = priv.filter(p => !prev.some(m => m.id === p.id));
            return newMsgs.length > 0 ? [...prev, ...newMsgs].slice(-50) : prev;
          });
        }
      }
    }, 2000); // يحدث كل ثانيتين

    return () => clearInterval(interval);
  }, [user, activeChat]);

  // النزول لآخر رسالة
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
      await supabase.from('private_messages').insert([{ sender_email: user.email, receiver_email: activeChat.email, message: messageToSend }]);
    } else {
      await supabase.from('public_chat').insert([{ user_email: user.email, username: user.email.split('@')[0], message: messageToSend }]);
    }
  };

  const sendFriendRequest = async () => {
    if (!requestPopupUser) return;
    await supabase.from('chat_requests').insert([{ sender_email: user.email, receiver_email: requestPopupUser.email, status: 'pending' }]);
    alert(`تم إرسال طلب إلى ${requestPopupUser.username}`);
    setRequestPopupUser(null);
  };

  const blockUser = async (emailToBlock: string) => {
    if (!user?.email) return;
    const { error } = await supabase.from('user_blocks').insert([{ blocker_email: user.email, blocked_email: emailToBlock }]);
    if (!error) {
      setBlockedEmails(prev => [emailToBlock, ...prev].slice(0, 10));
      setShowBlockConfirm(false);
      setActiveChat(null);
    } else {
      alert("حدث خطأ أثناء الحظر");
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

  const handlePressStart = (friend: any) => {
    pressTimer.current = setTimeout(() => { setFriendToDelete(friend); }, 800);
  };

  const handlePressEnd = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  const hasNewRequests = requests.length > 0;
  const visiblePublicMessages = publicMessages.filter(m => !blockedEmails.includes(m.user_email));
  const visibleFriends = friends.filter(f => !blockedEmails.includes(f.email));

  return (
    <div className="fixed bottom-20 right-0 sm:right-4 z-50 flex flex-col items-end w-full sm:w-auto px-2 sm:px-0 pointer-events-none">
      
      {/* النوافذ المنبثقة (حظر، حذف، طلب صداقة، محظورين) */}
      {requestPopupUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 pointer-events-auto" onClick={() => setRequestPopupUser(null)}>
          <div className="bg-[#1a1a1a] p-5 rounded-xl border border-gray-700 shadow-2xl flex flex-col items-center w-64" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mb-3"><User className="h-6 w-6 text-gray-300" /></div>
            <h4 className="text-white font-bold mb-4">{requestPopupUser.username}</h4>
            <button onClick={sendFriendRequest} className="w-full bg-teal-500 hover:bg-teal-600 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2">
              <UserPlus className="h-4 w-4" /> Send Request
            </button>
          </div>
        </div>
      )}

      {showBlockConfirm && activeChat && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 pointer-events-auto" onClick={() => setShowBlockConfirm(false)}>
          <div className="bg-[#1a1a1a] p-5 rounded-xl border border-gray-700 shadow-2xl flex flex-col items-center w-64" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-900/50 rounded-full flex items-center justify-center mb-3"><Ban className="h-6 w-6 text-red-500" /></div>
            <h4 className="text-white font-bold mb-1">Block {activeChat.username}?</h4>
            <div className="flex gap-2 w-full mt-4">
              <button onClick={() => setShowBlockConfirm(false)} className="flex-1 bg-gray-700 text-white py-2 rounded-lg text-xs">Cancel</button>
              <button onClick={() => blockUser(activeChat.email)} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-xs font-bold">Block</button>
            </div>
          </div>
        </div>
      )}

      {friendToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 pointer-events-auto" onClick={() => setFriendToDelete(null)}>
          <div className="bg-[#1a1a1a] p-5 rounded-xl border border-gray-700 shadow-2xl flex flex-col items-center w-64" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-900/50 rounded-full flex items-center justify-center mb-3"><Trash2 className="h-6 w-6 text-red-500" /></div>
            <h4 className="text-white font-bold mb-1">Delete {friendToDelete.username}?</h4>
            <div className="flex gap-2 w-full mt-4">
              <button onClick={() => setFriendToDelete(null)} className="flex-1 bg-gray-700 text-white py-2 rounded-lg text-xs">Cancel</button>
              <button onClick={() => deleteFriend(friendToDelete.id)} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-xs font-bold">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showBlockedList && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 pointer-events-auto" onClick={() => setShowBlockedList(false)}>
          <div className="bg-[#1a1a1a] p-5 rounded-xl border border-gray-700 shadow-2xl w-[80vw] sm:w-72 max-h-[60vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-bold mb-4 flex items-center gap-2 border-b border-gray-700 pb-2"><ShieldAlert className="h-5 w-5 text-red-500" /> Blocked (Last 10)</h3>
            <div className="flex-1 overflow-y-auto min-h-0">
              {blockedEmails.length === 0 ? <p className="text-gray-500 text-xs text-center py-4">No blocked users.</p> : 
                blockedEmails.map(email => (
                  <div key={email} className="flex items-center justify-between bg-gray-800 p-2 rounded mb-2">
                    <span className="text-xs text-white truncate max-w-[120px]">{email.split('@')[0]}</span>
                    <button onClick={() => unblockUser(email)} className="text-teal-400 text-[10px] bg-teal-500/20 px-2 py-1 rounded hover:bg-teal-500/40">Unblock</button>
                  </div>
                ))
              }
            </div>
            <button onClick={() => setShowBlockedList(false)} className="mt-4 w-full bg-gray-700 text-white py-2 rounded text-xs">Close</button>
          </div>
        </div>
      )}

      {showRequestsMenu && (
        <>
          <div className="fixed inset-0 z-40 pointer-events-auto" onClick={() => setShowRequestsMenu(false)}></div>
          <div className="absolute bottom-[70px] right-4 w-[300px] sm:w-[380px] bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden pointer-events-auto">
            <div className="p-3 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-white font-bold text-sm">Chat Requests</h3>
              <button onClick={() => setShowRequestsMenu(false)} className="text-gray-400 hover:text-white"><X className="h-4 w-4"/></button>
            </div>
            <div className="max-h-48 overflow-y-auto">
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
          </div>
        </>
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
              <h3 className="font-bold text-sm flex items-center gap-2">
                {activeChat ? (
                  <>
                    Chat with {activeChat.username}
                    <button onClick={() => setShowBlockConfirm(true)} className="text-white hover:text-red-300 p-1 bg-teal-700/50 rounded-full">
                      <User className="h-4 w-4" />
                    </button>
                  </>
                ) : (activeTab === 'public' ? 'Public Chat' : 'My Friends')}
              </h3>
            </div>
            
            <div className="flex gap-2 items-center">
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
              <button onClick={() => setActiveTab('public')} className={`flex-1 py-2 text-xs font-bold ${activeTab === 'public' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-gray-500'}`}>Public</button>
              <button onClick={() => setActiveTab('private')} className={`flex-1 py-2 text-xs font-bold ${activeTab === 'private' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-gray-500'}`}>Private</button>
            </div>
          )}

          <div className="flex-1 min-h-0 p-3 overflow-y-auto flex flex-col gap-3 bg-[#0a0a0a] [overflow-anchor:none]">
            {!activeChat && activeTab === 'public' && visiblePublicMessages.map((msg, index) => {
              const isMe = msg.user_email === user?.email;
              return (
                <div key={index} className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`text-[11px] font-medium ${isMe ? 'text-gray-500' : 'text-gray-400'}`}>{isMe ? 'You' : (msg.username || msg.user_email.split('@')[0])}</span>
                    {!isMe && (
                      <button onClick={() => setRequestPopupUser({ email: msg.user_email, username: msg.username || msg.user_email.split('@')[0] })} className="text-teal-400 hover:text-teal-300 p-0.5">
                        <User className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className={`px-3 py-1.5 rounded-xl max-w-[85%] text-sm ${isMe ? 'bg-teal-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none'}`}>{msg.message}</div>
                </div>
              );
            })}

            {!activeChat && activeTab === 'private' && (
              <div className="flex flex-col select-none">
                {visibleFriends.length === 0 ? <p className="text-center text-gray-500 text-xs mt-5">No friends yet.</p> : null}
                {visibleFriends.map((friend, index) => (
                  <div 
                    key={index} 
                    onMouseDown={() => handlePressStart(friend)} onMouseUp={handlePressEnd} onMouseLeave={handlePressEnd}
                    onTouchStart={() => handlePressStart(friend)} onTouchEnd={handlePressEnd}
                    onClick={() => setActiveChat(friend)} 
                    className="flex items-center gap-3 p-3 hover:bg-gray-800 cursor-pointer border-b border-gray-800/50 active:bg-gray-700"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center"><User className="h-5 w-5 text-gray-300" /></div>
                    <div className="flex-1"><h4 className="text-sm font-bold text-white">{friend.username}</h4></div>
                  </div>
                ))}
              </div>
            )}

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
            <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"/>
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