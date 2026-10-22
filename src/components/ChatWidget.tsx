import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { MessageCircle, X, Send, Bell, Ban, ArrowLeft, User, UserPlus, ShieldAlert, Trash2 } from 'lucide-react';
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
  const [isSending, setIsSending] = useState(false);
  const [activeChat, setActiveChat] = useState<any | null>(null); 
  
  const [showRequestsMenu, setShowRequestsMenu] = useState(false);
  const [requestPopupUser, setRequestPopupUser] = useState<any | null>(null); 
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // جلب الرسائل الأحدث أولاً من قاعدة البيانات، ثم عرضها من الأقدم إلى الأحدث.
  const fetchData = useCallback(async () => {
    if (!user?.email) return;

    // مهم: DESC + limit(50) يجلب أحدث 50 رسالة؛ نعكسها للعرض بترتيب زمني.
    const { data: pub, error: publicError } = await supabase
      .from('public_chat')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (publicError) {
      console.error('تعذر جلب رسائل الدردشة العامة:', publicError);
    } else if (pub) {
      setPublicMessages([...pub].reverse());
    }

    // طلبات الصداقة المعلّقة
    const { data: req, error: requestsError } = await supabase
      .from('chat_requests')
      .select('*')
      .eq('receiver_email', user.email)
      .eq('status', 'pending');

    if (requestsError) console.error('تعذر جلب طلبات الصداقة:', requestsError);
    else if (req) setRequests(req);

    // الأصدقاء المقبولون
    const { data: friendData, error: friendsError } = await supabase
      .from('chat_requests')
      .select('*')
      .or(`receiver_email.eq.${user.email},sender_email.eq.${user.email}`)
      .eq('status', 'accepted');

    if (friendsError) {
      console.error('تعذر جلب الأصدقاء:', friendsError);
    } else if (friendData) {
      const formattedFriends = friendData.map((row: any) => {
        const isReceiver = row.receiver_email === user.email;
        const otherEmail = isReceiver ? row.sender_email : row.receiver_email;
        return {
          id: row.id,
          email: otherEmail,
          username: otherEmail?.split('@')[0] ?? 'مستخدم',
        };
      });
      const uniqueFriends = Array.from(
        new Map(formattedFriends.map((item: any) => [item.email, item])).values()
      );
      setFriends(uniqueFriends);
    }

    // قائمة المحظورين
    const { data: blocks, error: blocksError } = await supabase
      .from('user_blocks')
      .select('blocked_email')
      .eq('blocker_email', user.email)
      .order('created_at', { ascending: false })
      .limit(10);

    if (blocksError) console.error('تعذر جلب قائمة الحظر:', blocksError);
    else if (blocks) setBlockedEmails(blocks.map((b: any) => b.blocked_email));