import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Swords, Trophy, Timer, Globe, ChevronDown, CheckCircle2, XCircle, Loader2, Search, Info, X } from 'lucide-react';

const QUESTIONS = [
  { q: "5 + 7 = ?", options: ["10", "12", "14"], answer: "12" },
  { q: "9 * 3 = ?", options: ["27", "21", "24"], answer: "27" },
  { q: "15 - 8 = ?", options: ["5", "7", "9"], answer: "7" },
  { q: "12 / 4 = ?", options: ["2", "3", "4"], answer: "3" },
  { q: "10 + 20 = ?", options: ["20", "30", "40"], answer: "30" },
  { q: "2 * 2 * 2 = ?", options: ["6", "8", "10"], answer: "8" },
  { q: "50 - 15 = ?", options: ["30", "35", "40"], answer: "35" },
  { q: "7 * 7 = ?", options: ["42", "49", "56"], answer: "49" },
  { q: "ما هي عاصمة اليابان؟", options: ["بكين", "طوكيو", "سيول"], answer: "طوكيو" },
  { q: "ما هو أكبر كوكب في المجموعة الشمسية؟", options: ["المشتري", "زحل", "الأرض"], answer: "المشتري" },
  { q: "كم عدد أيام الأسبوع؟", options: ["5", "6", "7"], answer: "7" },
  { q: "ما هو لون السماء؟", options: ["أحمر", "أزرق", "أخضر"], answer: "أزرق" },
  { q: "ما هي عاصمة فرنسا؟", options: ["لندن", "باريس", "روما"], answer: "باريس" },
  { q: "ما هي عاصمة العراق؟", options: ["بغداد", "أربيل", "البصرة"], answer: "بغداد" },
  { q: "ما هو أطول نهر في العالم؟", options: ["النيل", "الأمازون", "دجلة"], answer: "النيل" },
  { q: "كم عدد قارات العالم؟", options: ["5", "6", "7"], answer: "7" },
  { q: "ما هو الكوكب الأحمر؟", options: ["الزهرة", "المريخ", "عطارد"], answer: "المريخ" },
  { q: "ما هي عاصمة مصر؟", options: ["الإسكندرية", "القاهرة", "الجيزة"], answer: "القاهرة" },
  { q: "في أي قارة تقع مصر؟", options: ["آسيا", "أفريقيا", "أوروبا"], answer: "أفريقيا" },
  { q: "ما هي عملة اليابان؟", options: ["اليوان", "الين", "الوون"], answer: "الين" },
  { q: "ما هو الغاز الذي نتنفسه؟", options: ["النيتروجين", "الأكسجين", "ثاني أكسيد الكربون"], answer: "الأكسجين" },
  { q: "ما هي أكبر حيوانات العالم؟", options: ["الفيل", "الحوت الأزرق", "الزرافة"], answer: "الحوت الأزرق" },
  { q: "كم عدد قلوب الأخطبوط؟", options: ["1", "2", "3"], answer: "3" },
  { q: "ما هو أسرع حيوان بري؟", options: ["الأسد", "الفهد", "الحصان"], answer: "الفهد" },
  { q: "ما هو أكبر محيط في العالم؟", options: ["الأطلسي", "الهندي", "الهادي"], answer: "الهادي" },
  { q: "ما هو المعدن السائل في درجة حرارة الغرفة؟", options: ["الحديد", "الزئبق", "الرصاص"], answer: "الزئبق" },
  { q: "ما هي الصحراء الأكبر في العالم؟", options: ["الصحراء الكبرى", "صحراء الربع الخالي", "صحراء غوبي"], answer: "الصحراء الكبرى" },
  { q: "كم عدد أسنان الإنسان البالغ؟", options: ["28", "32", "30"], answer: "32" },
  { q: "ما هو العضو المسؤول عن ضخ الدم؟", options: ["الرئة", "القلب", "الكبد"], answer: "القلب" },
  { q: "ما هي اللغة الأكثر تحدثاً في العالم؟", options: ["الإنجليزية", "الصينية", "الإسبانية"], answer: "الصينية" }
];

const T = {
  en: {
    back: 'Back', title: 'Arena', sub: 'Challenge friends or players online!',
    balance: 'Current Balance', wager: 'Wager Amount', target: 'Points to Win',
    playOnline: 'Play Online (Find Opponent)', friend: 'OR PLAY WITH A FRIEND',
    create: 'Create Private Room', join: 'Join', joinPlaceholder: 'CODE',
    gameSelect: 'Select Game', free: 'Free Play', points: 'Points',
    waiting: 'Searching for a real opponent...', shareCode: 'Room Code:', playing: 'Race to',
    you: 'You', opp: 'Opponent', bet: 'Bet', win: 'You Won! 🎉', lose: 'You Lost 😢', next: 'Next Question', leave: 'Leave Game',
    confirmLeave: 'Are you sure you want to leave? If the game started, you will lose the bet.',
    quizGame: 'Quiz Duel', freeMatch: 'Free Match', searchOpponent: 'Searching...',
    infoTitle: 'How to Play', infoText: 'Welcome to the Arena!\n\n1. Choose your wager and points to win.\n2. Click "Play Online" to find a random opponent.\n3. Or create a private room and share the code with a friend.\n4. Answer questions faster than your opponent to win the prize!\n5. Warning: If you leave during the game, you automatically lose!', close: 'Got it!'
  },
  ar: {
    back: 'رجوع', title: 'صالة التحدي', sub: 'تحدى أصدقاءك أو لاعبين عبر الإنترنت!',
    balance: 'رصيدك الحالي', wager: 'مبلغ الرهان', target: 'النقاط المطلوبة للفوز',
    playOnline: 'لعب عبر الإنترنت (ابحث عن خصم)', friend: 'أو العب مع صديق',
    create: 'إنشاء غرفة خاصة', join: 'انضمام', joinPlaceholder: 'الكود',
    gameSelect: 'اختر اللعبة', free: 'لعب مجاني', points: 'نقاط',
    waiting: 'جاري البحث عن خصم حقيقي...', shareCode: 'كود الغرفة:', playing: 'أول من يجمع',
    you: 'أنت', opp: 'الخصم', bet: 'رهان', win: 'أنت الفائز! 🎉', lose: 'للأسف، خسرت 😢', next: 'السؤال التالي', leave: 'مغادرة اللعبة',
    confirmLeave: 'هل أنت متأكد من المغادرة؟ إذا بدأت اللعبة سوف تخسر الرهان.',
    quizGame: 'تحدي الذكاء', freeMatch: 'مباراة مجانية', searchOpponent: 'جاري البحث...',
    infoTitle: 'كيف تلعب؟', infoText: 'مرحباً بك في صالة التحدي!\n\n1. اختر مبلغ الرهان وعدد النقاط للفوز.\n2. اضغط "لعب عبر الإنترنت" للبحث عن خصم عشوائي.\n3. أو أنشئ غرفة خاصة وشارك الكود مع صديقك.\n4. أجب على الأسئلة أسرع من خصمك لتربح الجائزة!\n5. تحذير: إذا خرجت من اللعبة، فأنت تخسر تلقائياً!', close: 'فهمت!'
  }
};

const getUsername = (email: string | undefined) => {
  if (!email) return '...';
  return email.split('@')[0];
};

export default function QuizGame() {
  const { user, navigate } = useApp();
  const [lang, setLang] = useState<'en' | 'ar'>('ar');
  const t = T[lang];

  const [inGame, setInGame] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [gameRoom, setGameRoom] = useState<any>(null);
  const [mySymbol, setMySymbol] = useState<'X' | 'O' | null>(null);
  const [error, setError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showInfo, setShowInfo] = useState(false); 
  
  const [selectedGame, setSelectedGame] = useState('quiz'); 
  const [wager, setWager] = useState(0);
  const [targetScore, setTargetScore] = useState(5);

  const [userBalance, setUserBalance] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const channelRef = useRef<any>(null);
  const pollIntervalRef = useRef<any>(null);

  // إخفاء الشريط السفلي وأيقونة الدردشة تماماً أثناء اللعب
  useEffect(() => {
    if (inGame) {
      window.scrollTo(0, 0);
      document.body.classList.add('in-game');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('in-game');
      document.body.style.overflow = 'auto';
    }
    const style = document.createElement('style');
    style.innerHTML = `
      body.in-game nav, 
      body.in-game .bottom-nav, 
      body.in-game .fixed.bottom-20, 
      body.in-game .fixed.bottom-24 { 
        display: none !important; 
      }
    `;
    document.head.appendChild(style);
    return () => { document.body.classList.remove('in-game'); document.body.style.overflow = 'auto'; document.head.removeChild(style); };
  }, [inGame]);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!user?.email) return;
      const { data } = await supabase.from('app_users').select('balance').eq('email', user.email).single();
      if (data) setUserBalance(data.balance);
    };
    fetchBalance();
  }, [user]);

  const playOnline = async () => {
    if (!user?.email) return;
    if (userBalance < wager) return setError(lang === 'ar' ? 'رصيدك غير كافٍ!' : 'Insufficient balance!');
    
    setIsSearching(true);
    setError('');

    const { data, error } = await supabase.rpc('matchmake_secure', {
      p_player_email: user.email, p_wager: wager, p_target_score: targetScore, p_game_type: selectedGame
    });

    if (error || data.error) {
      setIsSearching(false);
      return setError(error?.message || data.error);
    }

    setRoomCode(data.room_code);
    setMySymbol(data.role);
    
    const { data: roomData } = await supabase.from('game_rooms').select('*').eq('room_code', data.room_code).single();
    setGameRoom(roomData);
    setInGame(true);
    setIsSearching(false);
  };

  const createRoom = async () => {
    if (!user?.email) return;
    if (userBalance < wager) return setError(lang === 'ar' ? 'رصيدك غير كافٍ!' : 'Insufficient balance!');
    
    const code = Math.floor(100000 + Math.random() * 900000).toString(); 
    
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
    
    const { data, error } = await supabase.rpc('join_game_secure', {
      p_room_code: joinCode.toUpperCase(), p_player_email: user.email
    });

    if (error || data.error) return setError(error?.message || data.error);

    const { data: roomData } = await supabase.from('game_rooms').select('*').eq('room_code', joinCode.toUpperCase()).single();
    
    setGameRoom(roomData);
    setMySymbol('O');
    setRoomCode(roomData.room_code);
    setInGame(true);
  };

  // 👇 نظام المزامنة السريع (كل ثانية) 👇
  useEffect(() => {
    if (!inGame || !roomCode) return;

    const setupChannel = () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      channelRef.current = supabase.channel(`game_${roomCode}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'game_rooms', filter: `room_code=eq.${roomCode}` }, (payload) => {
          setGameRoom(payload.new);
        }).subscribe((status) => { if (status === 'CHANNEL_ERROR') setTimeout(setupChannel, 2000); });
    };
    setupChannel();

    // فحص الحالة كل ثانية لضمان دخول اللاعبين معاً
    pollIntervalRef.current = setInterval(async () => {
      const { data } = await supabase.from('game_rooms').select('*').eq('room_code', roomCode).single();
      if (data) setGameRoom((prev: any) => JSON.stringify(prev) !== JSON.stringify(data) ? data : prev);
    }, 1000);

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [inGame, roomCode]);

  useEffect(() => { setHasAnswered(false); setSelectedAnswer(null); }, [gameRoom?.current_question_index]);

  const handleAnswer = async (answer: string) => {
    if (!gameRoom?.player2_email || hasAnswered || gameRoom.status !== 'playing' || gameRoom.winner) return;
    
    const currentQ = QUESTIONS[gameRoom.current_question_index % QUESTIONS.length];
    setHasAnswered(true); setSelectedAnswer(answer);

    const isCorrect = answer === currentQ.answer;
    
    await supabase.rpc('submit_answer_secure', {
      p_room_code: gameRoom.room_code,
      p_player_email: user.email,
      p_is_correct: isCorrect
    });
  };

  const nextQuestion = async () => {
    await supabase.from('game_rooms').update({ current_question_index: gameRoom.current_question_index + 1 }).eq('id', gameRoom.id);
  };

  // 👇 دالة المغادرة (تسترجع النقاط إذا كانت اللعبة في الانتظار) 👇
  const handleLeaveGame = async () => {
    if (window.confirm(t.confirmLeave)) {
      if (inGame && gameRoom && user?.email) {
        if (gameRoom.status === 'waiting') {
          // إلغاء البحث واسترجاع النقاط
          await supabase.rpc('cancel_matchmaking_secure', {
            p_room_code: gameRoom.room_code,
            p_player_email: user.email
          });
        } else if (gameRoom.status === 'playing') {
          // انسحاب وخسارة الرهان
          await supabase.rpc('forfeit_game_secure', {
            p_room_code: gameRoom.room_code,
            p_leaving_email: user.email
          });
        }
      }
      setInGame(false); setGameRoom(null); setError(''); setIsSearching(false);
      window.location.reload(); 
    }
  };

  // ================= شاشة اللعب =================
  if (inGame) {
    const currentQ = QUESTIONS[gameRoom?.current_question_index % QUESTIONS.length];
    const hasRealOpponent = !!gameRoom?.player2_email;
    
    const myName = getUsername(user?.email);
    const opponentEmail = gameRoom?.player1_email === user?.email ? gameRoom?.player2_email : gameRoom?.player1_email;
    const oppName = getUsername(opponentEmail);

    return (
      <div className={`fixed inset-0 z-[100] bg-[#0a0a0a] text-white flex flex-col overflow-hidden`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        
        <div className="p-4 shrink-0 flex justify-between items-center bg-[#161616] border-b border-gray-800">
          <button onClick={handleLeaveGame} className="flex items-center gap-2 text-red-400 hover:text-red-300 font-bold bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">
            <ArrowLeft className={`h-5 w-5 ${lang === 'ar' ? 'rotate-180' : ''}`} /> {t.leave}
          </button>
          <span className="text-teal-400 font-bold text-sm tracking-widest bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
            Code: {roomCode}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex justify-center items-center">
          <div className="w-full max-w-sm">
            <div className="bg-[#161616] p-6 rounded-2xl border border-teal-500/30 shadow-[0_0_50px_rgba(20,184,166,0.2)]">
              
              <div className="flex justify-between items-center mb-6 bg-[#0a0a0a] p-3 rounded-xl border border-gray-800 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
                <div className="text-center w-1/3">
                  <div className="text-[11px] text-teal-300 font-bold mb-1 truncate px-1">{myName} ({mySymbol})</div>
                  <div className="text-4xl font-bold text-teal-400 drop-shadow-[0_0_25px_rgba(20,184,166,1)]">{mySymbol === 'X' ? gameRoom?.p1_score : gameRoom?.p2_score}</div>
                </div>
                <div className="text-xs text-gray-500 text-center w-1/3">
                  <div className="bg-gray-800 px-2 py-1 rounded-full mb-1 border border-gray-700 text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.3)] whitespace-nowrap">
                    {gameRoom?.wager === 0 ? t.freeMatch : `${t.bet}: ${gameRoom?.wager}`}
                  </div>
                  <div className="text-[10px]">{t.playing} {gameRoom?.target_score}</div>
                </div>
                <div className="text-center w-1/3">
                  <div className="text-[11px] text-orange-300 font-bold mb-1 truncate px-1">{oppName} ({mySymbol === 'X' ? 'O' : 'X'})</div>
                  <div className="text-4xl font-bold text-orange-400 drop-shadow-[0_0_25px_rgba(251,146,60,1)]">{mySymbol === 'X' ? gameRoom?.p2_score : gameRoom?.p1_score}</div>
                </div>
              </div>

              {!hasRealOpponent && gameRoom?.status !== 'finished' && (
                <div className="text-center py-10">
                  <Search className="h-12 w-12 text-teal-400 animate-pulse mx-auto mb-4" />
                  <div className="text-teal-400 text-xl font-bold mb-4 drop-shadow-[0_0_20px_rgba(20,184,166,1)]">{t.waiting}</div>
                  <p className="text-sm text-gray-400">{t.shareCode} <strong className="text-white text-3xl tracking-widest bg-gray-800 px-5 py-2 rounded-xl border border-teal-500/50 mt-4 inline-block shadow-[0_0_20px_rgba(20,184,166,0.5)]">{roomCode}</strong></p>
                  <p className="text-xs text-gray-500 mt-4">(Leave to cancel and refund points)</p>
                </div>
              )}

              {hasRealOpponent && gameRoom?.status === 'playing' && currentQ && (
                <div>
                  <h2 className="text-center text-2xl font-bold mb-6 bg-gray-800 py-5 rounded-xl border border-teal-500/30 shadow-[0_0_30px_rgba(20,184,166,0.2)] text-white">{currentQ.q}</h2>
                  <div className="flex flex-col gap-3 mb-6">
                    {currentQ.options.map((opt, i) => {
                      let btnClass = "bg-[#0a0a0a] border-gray-700 hover:border-teal-400 hover:shadow-[0_0_25px_rgba(20,184,166,0.6)]";
                      let icon = null;
                      if (hasAnswered) {
                        if (opt === currentQ.answer) {
                          btnClass = "bg-green-600/20 border-green-400 text-green-300 shadow-[0_0_30px_rgba(34,197,94,0.8)]";
                          icon = <CheckCircle2 className="h-6 w-6 text-green-400" />;
                        } else if (opt === selectedAnswer) {
                          btnClass = "bg-red-600/20 border-red-400 text-red-300 shadow-[0_0_30px_rgba(239,68,68,0.8)]";
                          icon = <XCircle className="h-6 w-6 text-red-400" />;
                        } else {
                          btnClass = "bg-[#0a0a0a] border-gray-800 opacity-50";
                        }
                      }
                      return (
                        <button key={i} onClick={() => handleAnswer(opt)} disabled={hasAnswered} className={`w-full py-4 px-6 rounded-xl border text-xl font-bold transition-all duration-300 flex justify-between items-center ${btnClass}`}>
                          <span>{opt}</span> {icon}
                        </button>
                      );
                    })}
                  </div>
                  {hasAnswered && (
                    <button onClick={nextQuestion} className="w-full bg-teal-500 hover:bg-teal-400 text-white py-4 rounded-xl font-bold text-lg shadow-[0_0_30px_rgba(20,184,166,0.8)] flex justify-center items-center gap-2">
                      {t.next} <Timer className="h-5 w-5" />
                    </button>
                  )}
                </div>
              )}

              {gameRoom?.status === 'finished' && (
                <div className="text-center py-8">
                  {gameRoom.winner === user?.email ? (
                    <>
                      <Trophy className="h-24 w-24 text-yellow-400 mx-auto mb-6 drop-shadow-[0_0_40px_rgba(250,204,21,1)] animate-bounce" />
                      <h3 className="font-bold text-4xl mb-2 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]">{t.win}</h3>
                      {gameRoom.wager === 0 ? (
                         <p className="text-teal-400 font-bold text-xl mb-8 drop-shadow-[0_0_10px_rgba(20,184,166,0.5)]">({t.freeMatch})</p>
                      ) : (
                         <p className="text-green-400 font-bold text-2xl mb-8 drop-shadow-[0_0_15px_rgba(34,197,94,0.8)]">+ {gameRoom.wager} IQD</p>
                      )}
                    </>
                  ) : (
                    <>
                      <XCircle className="h-24 w-24 text-red-500 mx-auto mb-6 drop-shadow-[0_0_40px_rgba(239,68,68,1)]" />
                      <h3 className="font-bold text-4xl mb-2 text-red-400 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]">{t.lose}</h3>
                      {gameRoom.wager === 0 ? (
                         <p className="text-gray-500 font-bold text-xl mb-8">({t.freeMatch})</p>
                      ) : (
                         <p className="text-red-500 font-bold text-2xl mb-8 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]">- {gameRoom.wager} IQD</p>
                      )}
                    </>
                  )}
                  <button onClick={handleLeaveGame} className="bg-teal-500 px-8 py-3 rounded-xl font-bold text-lg shadow-[0_0_25px_rgba(20,184,166,0.8)] w-full">{t.back}</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= شاشة اللوبي (الرئيسية) =================
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 pb-24 flex flex-col items-center" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {showInfo && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowInfo(false)}>
          <div className="bg-[#161616] border border-teal-500/50 p-6 rounded-2xl max-w-sm w-full shadow-[0_0_50px_rgba(20,184,166,0.3)] relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowInfo(false)} className="absolute top-3 right-3 text-gray-400 hover:text-white"><X className="h-5 w-5"/></button>
            <div className="flex items-center gap-3 mb-4 border-b border-gray-700 pb-3">
              <Info className="h-6 w-6 text-teal-400" />
              <h3 className="text-xl font-bold text-white">{t.infoTitle}</h3>
            </div>
            <p className="text-gray-300 leading-relaxed text-sm whitespace-pre-line">{t.infoText}</p>
            <button onClick={() => setShowInfo(false)} className="mt-6 w-full bg-teal-500 text-white py-2 rounded-lg font-bold hover:bg-teal-600 transition-colors">{t.close}</button>
          </div>
        </div>
      )}

      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-6 mt-2">
          <button onClick={() => navigate('home')} className="flex items-center gap-2 text-gray-400 hover:text-white bg-[#161616] px-3 py-2 rounded-lg border border-gray-800">
            <ArrowLeft className={`h-5 w-5 ${lang === 'ar' ? 'rotate-180' : ''}`} /> {t.back}
          </button>
          <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="flex items-center gap-2 bg-[#161616] text-teal-400 px-4 py-2 rounded-lg border border-gray-800 font-bold hover:bg-gray-800">
            <Globe className="h-4 w-4" /> {lang === 'en' ? 'AR' : 'EN'}
          </button>
        </div>

        <div className="bg-[#161616] p-6 rounded-2xl border border-teal-500/30 shadow-[0_0_60px_rgba(20,184,166,0.15)] relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-teal-500/20 blur-[80px] pointer-events-none"></div>
          
          <div className="flex justify-center items-center gap-4 mb-4 relative z-10">
            <Swords className="h-20 w-20 text-teal-400 drop-shadow-[0_0_35px_rgba(20,184,166,1)]" />
            <button onClick={() => setShowInfo(true)} className="bg-teal-500/20 p-2 rounded-full border border-teal-500/50 hover:bg-teal-500/40 transition-all shadow-[0_0_15px_rgba(20,184,166,0.5)] animate-pulse">
              <Info className="h-6 w-6 text-teal-300 drop-shadow-[0_0_10px_rgba(20,184,166,1)]" />
            </button>
          </div>

          <h1 className="text-3xl font-bold text-center mb-1 text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-blue-400 drop-shadow-[0_0_10px_rgba(20,184,166,0.5)] relative z-10">{t.title}</h1>
          <p className="text-gray-400 text-center text-sm mb-6 relative z-10">{t.sub}</p>
          
          <div className="bg-gray-800/80 p-4 rounded-xl mb-6 text-center border border-gray-700 flex justify-between items-center shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] relative z-10">
            <span className="text-gray-400 text-sm font-medium">{t.balance}:</span>
            <span className="text-teal-400 font-bold text-2xl drop-shadow-[0_0_15px_rgba(20,184,166,0.8)]">{userBalance} IQD</span>
          </div>

          {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm text-center border border-red-500/50 relative z-10">{error}</div>}

          <div className="mb-6 relative z-10">
            <label className="text-sm text-gray-400 mb-2 block font-medium">{t.gameSelect}</label>
            <div className="relative">
              <select value={selectedGame} onChange={e => setSelectedGame(e.target.value)} className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl p-3 text-white font-bold appearance-none">
                <option value="quiz">{t.quizGame}</option>
              </select>
              <ChevronDown className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-500 pointer-events-none h-5 w-5" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
            <div>
              <label className="text-sm text-gray-400 mb-2 block font-medium">{t.wager}</label>
              <select value={wager} onChange={e => setWager(Number(e.target.value))} className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl p-3 text-white font-bold">
                <option value={0}>{t.free}</option>
                <option value={5}>5 {t.points}</option>
                <option value={10}>10 {t.points}</option>
                <option value={50}>50 {t.points}</option>
                <option value={100}>100 {t.points}</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block font-medium">{t.target}</label>
              <select value={targetScore} onChange={e => setTargetScore(Number(e.target.value))} className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl p-3 text-white font-bold">
                <option value={3}>3 {t.points}</option>
                <option value={5}>5 {t.points}</option>
                <option value={10}>10 {t.points}</option>
              </select>
            </div>
          </div>

          <button onClick={playOnline} disabled={isSearching} className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-400 hover:to-blue-400 text-white py-4 rounded-xl font-bold text-lg mb-6 shadow-[0_0_30px_rgba(20,184,166,0.8)] flex items-center justify-center gap-3 relative z-10">
            {isSearching ? <span className="animate-pulse flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin"/> {t.searchOpponent}</span> : <><Globe className="h-6 w-6" /> {t.playOnline}</>}
          </button>

          <div className="relative flex py-2 items-center mb-6 relative z-10">
            <div className="flex-grow border-t border-gray-700"></div>
            <span className="flex-shrink-0 mx-4 text-gray-500 text-xs font-bold uppercase">{t.friend}</span>
            <div className="flex-grow border-t border-gray-700"></div>
          </div>

          <button onClick={createRoom} className="w-full bg-[#0a0a0a] border border-teal-500/50 hover:bg-teal-500/10 text-teal-400 py-3 rounded-xl font-bold mb-4 relative z-10">
            {t.create}
          </button>

          <div className="grid grid-cols-3 gap-2 relative z-10">
            <input 
              type="text" 
              placeholder={t.joinPlaceholder} 
              value={joinCode} 
              onChange={e => setJoinCode(e.target.value)} 
              className="col-span-2 bg-[#0a0a0a] border border-gray-700 rounded-xl px-4 py-3 text-center tracking-widest font-bold focus:outline-none focus:border-teal-500" 
            />
            <button onClick={joinRoom} className="col-span-1 bg-white text-black rounded-xl font-bold hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all text-sm">
              {t.join}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}