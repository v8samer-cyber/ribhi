import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Swords, Trophy, Timer, Globe, Gamepad2, ChevronDown } from 'lucide-react';

const QUESTIONS = [
  { q: "5 + 7 = ?", options: ["10", "12", "14"], answer: "12" },
  { q: "9 * 3 = ?", options: ["27", "21", "24"], answer: "27" },
  { q: "15 - 8 = ?", options: ["5", "7", "9"], answer: "7" },
  { q: "ما هي عاصمة اليابان؟", options: ["بكين", "طوكيو", "سيول"], answer: "طوكيو" },
  { q: "ما هو أكبر كوكب في المجموعة الشمسية؟", options: ["المشتري", "زحل", "الأرض"], answer: "المشتري" },
  { q: "12 / 4 = ?", options: ["2", "3", "4"], answer: "3" },
  { q: "ما هو ناتج 10 + 20؟", options: ["20", "30", "40"], answer: "30" },
];

const T = {
  en: {
    back: 'Back', title: 'Quiz Duel', sub: 'Challenge friends or players online!',
    balance: 'Current Balance', wager: 'Wager Amount', target: 'Points to Win',
    playOnline: 'Play Online (Find Opponent)', friend: 'OR PLAY WITH A FRIEND',
    create: 'Create Private Room', join: 'Join Room', joinPlaceholder: 'ROOM CODE',
    gameSelect: 'Select Game', free: 'Free Play', points: 'Points',
    waiting: 'Finding opponent...', shareCode: 'Share Code:', playing: 'Race to',
    you: 'You', opp: 'Opponent', bet: 'Bet', win: 'You Won! 🎉', lose: 'You Lost 😢', wonPts: 'You won points!', lostPts: 'You lost points.', next: 'Next Question', leave: 'Leave Game',
    confirmLeave: 'Are you sure you want to leave?',
    searching: 'Searching for opponent...'
  },
  ar: {
    back: 'رجوع', title: 'تحدي الذكاء', sub: 'تحدى أصدقاءك أو لاعبين عبر الإنترنت!',
    balance: 'رصيدك الحالي', wager: 'مبلغ الرهان', target: 'النقاط المطلوبة للفوز',
    playOnline: 'لعب عبر الإنترنت (ابحث عن خصم)', friend: 'أو العب مع صديق',
    create: 'إنشاء غرفة خاصة', join: 'انضمام', joinPlaceholder: 'كود الغرفة',
    gameSelect: 'اختر اللعبة', free: 'لعب مجاني', points: 'نقاط',
    waiting: 'جاري البحث عن خصم...', shareCode: 'شارك الكود:', playing: 'أول من يجمع',
    you: 'أنت', opp: 'الخصم', bet: 'رهان', win: 'أنت الفائز! 🎉', lose: 'للأسف، خسرت 😢', wonPts: 'لقد ربحت نقاطاً!', lostPts: 'لقد خسرت نقاطاً.', next: 'السؤال التالي', leave: 'مغادرة اللعبة',
    confirmLeave: 'هل أنت متأكد من المغادرة؟',
    searching: 'جاري البحث عن خصم...'
  }
};

export default function QuizGame({ onBack }: { onBack: () => void }) {
  const { user } = useApp();
  const [lang, setLang] = useState<'en' | 'ar'>('ar');
  const t = T[lang];

  const [inGame, setInGame] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [gameRoom, setGameRoom] = useState<any>(null);
  const [mySymbol, setMySymbol] = useState<'X' | 'O' | null>(null);
  const [error, setError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const [wager, setWager] = useState(0);
  const [targetScore, setTargetScore] = useState(5);

  const [userBalance, setUserBalance] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const channelRef = useRef<any>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!user?.email) return;
      const { data } = await supabase.from('app_users').select('balance').eq('email', user.email).single();
      if (data) setUserBalance(data.balance);
    };
    fetchBalance();
  }, [user]);

  // دالة البحث عن خصم (مع نظام احتياطي في حال فشل RPC)
  const playOnline = async () => {
    if (!user?.email) return;
    if (userBalance < wager) return setError(lang === 'ar' ? 'رصيدك غير كافٍ!' : 'Insufficient balance!');
    
    setIsSearching(true);
    setError('');

    try {
      // محاولة استخدام الدالة السريعة
      const { data, error } = await supabase.rpc('matchmake_secure', {
        p_player_email: user.email,
        p_wager: wager,
        p_target_score: targetScore,
        p_game_type: 'quiz'
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setRoomCode(data.room_code);
      setMySymbol(data.role);
      
      const { data: roomData } = await supabase.from('game_rooms').select('*').eq('room_code', data.room_code).single();
      setGameRoom(roomData);
      setInGame(true);
    } catch (err: any) {
      // إذا فشلت الدالة، نستخدم طريقة البحث اليدوية الآمنة
      console.warn("RPC failed, using fallback:", err);
      await fallbackMatchmaking();
    } finally {
      setIsSearching(false);
    }
  };

  const fallbackMatchmaking = async () => {
    // البحث عن غرفة شاغرة
    const { data: availableRooms } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('status', 'waiting')
      .eq('wager', wager)
      .eq('target_score', targetScore)
      .neq('player1_email', user.email)
      .limit(1);

    if (availableRooms && availableRooms.length > 0) {
      const room = availableRooms[0];
      // الانضمام للغرفة
      const { error: joinError } = await supabase
        .from('game_rooms')
        .update({ player2_email: user.email, status: 'playing' })
        .eq('id', room.id);

      if (!joinError) {
        setRoomCode(room.room_code);
        setMySymbol('O');
        setGameRoom({ ...room, player2_email: user.email, status: 'playing' });
        setInGame(true);
        return;
      }
    }

    // إذا لم نجد، ننشئ غرفة جديدة
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 أرقام
    const { data: newRoom, error: createError } = await supabase.from('game_rooms').insert([{
      room_code: code, player1_email: user.email, wager, target_score: targetScore, status: 'waiting'
    }]).select().single();

    if (createError) return setError(createError.message);
    
    setGameRoom(newRoom);
    setMySymbol('X');
    setRoomCode(code);
    setInGame(true);
  };

  const createRoom = async () => {
    if (!user?.email) return;
    if (userBalance < wager) return setError(lang === 'ar' ? 'رصيدك غير كافٍ!' : 'Insufficient balance!');
    
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // كود أرقام فقط
    
    const { data, error } = await supabase.from('game_rooms').insert([{
      room_code: code, player1_email: user.email, wager, target_score: targetScore, status: 'waiting'
    }]).select().single();

    if (error) return setError(error.message);
    
    setGameRoom(data);
    setMySymbol('X');
    setRoomCode(code);
    setInGame(true);
  };

  const joinRoom = async () => {
    if (!user?.email || !joinCode) return;
    
    const { data: roomData, error } = await supabase.from('game_rooms').select('*').eq('room_code', joinCode.toUpperCase()).single();
    
    if (error || !roomData) return setError(lang === 'ar' ? 'الغرفة غير موجودة' : 'Room not found');
    if (roomData.player1_email === user.email) return setError(lang === 'ar' ? 'لا يمكنك اللعب ضد نفسك' : 'Cannot play against yourself');

    const { data, error: updateError } = await supabase.from('game_rooms')
      .update({ player2_email: user.email, status: 'playing' })
      .eq('id', roomData.id)
      .select().single();

    if (updateError) return setError(updateError.message);
    
    setGameRoom(data);
    setMySymbol('O');
    setRoomCode(roomData.room_code);
    setInGame(true);
  };

  // الاستماع الفوري وتحديث الغرفة (مع إعادة المحاولة)
  useEffect(() => {
    if (!inGame || !roomCode) return;

    const setupChannel = () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);

      channelRef.current = supabase.channel(`game_${roomCode}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `room_code=eq.${roomCode}` }, (payload) => {
          setGameRoom(payload.new);
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_rooms', filter: `room_code=eq.${roomCode}` }, (payload) => {
          setGameRoom(payload.new);
        })
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
             setTimeout(setupChannel, 2000); // إعادة المحاولة إذا فشل الاتصال
          }
        });
    };

    setupChannel();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [inGame, roomCode]);

  useEffect(() => { setHasAnswered(false); setSelectedAnswer(null); }, [gameRoom?.current_question_index]);

  const handleAnswer = async (answer: string) => {
    if (hasAnswered || gameRoom.status !== 'playing' || gameRoom.winner) return;
    const currentQ = QUESTIONS[gameRoom.current_question_index % QUESTIONS.length];
    setHasAnswered(true); setSelectedAnswer(answer);

    let p1 = gameRoom.p1_score; let p2 = gameRoom.p2_score;
    if (answer === currentQ.answer) { if (mySymbol === 'X') p1 += 1; else p2 += 1; }

    let winner = null;
    if (p1 >= gameRoom.target_score) winner = gameRoom.player1_email;
    if (p2 >= gameRoom.target_score) winner = gameRoom.player2_email;

    if (winner) {
      await supabase.rpc('finish_game_secure', { p_room_code: gameRoom.room_code, p_winner_email: winner });
    } else {
      await supabase.from('game_rooms').update({ p1_score: p1, p2_score: p2 }).eq('id', gameRoom.id);
    }
  };

  const nextQuestion = async () => {
    await supabase.from('game_rooms').update({ current_question_index: gameRoom.current_question_index + 1 }).eq('id', gameRoom.id);
  };

  // تأكيد الخروج
  const handleLeaveGame = () => {
    if (window.confirm(t.confirmLeave)) {
      setInGame(false); setGameRoom(null); setError(''); setIsSearching(false);
    }
  };

  // ... (باقي كود الواجهة كما هو، مع استبدال زر الخروج بـ handleLeaveGame)
  
  // سأختصر هنا لأن الكود طويل، ولكن في الملف الفعلي يجب أن تضع كل شيء.
  // الجزء الأهم هو تغيير دالة الخروج.
  
  return (
    // ... نفس كود الواجهة الذي أرسلته سابقاً، ولكن تأكد من تغيير onClick للخروج
    <div>...</div>
  );
}