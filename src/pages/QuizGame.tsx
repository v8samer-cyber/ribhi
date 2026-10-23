import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Swords, Trophy, Timer, Globe, Users, ChevronDown, Gamepad2 } from 'lucide-react';

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
    you: 'You', opp: 'Opponent', bet: 'Bet', win: 'You Won! 🎉', lose: 'You Lost 😢', wonPts: 'You won points!', lostPts: 'You lost points.', next: 'Next Question', leave: 'Leave Game'
  },
  ar: {
    back: 'رجوع', title: 'تحدي الذكاء', sub: 'تحدى أصدقاءك أو لاعبين عبر الإنترنت!',
    balance: 'رصيدك الحالي', wager: 'مبلغ الرهان', target: 'النقاط المطلوبة للفوز',
    playOnline: 'لعب عبر الإنترنت (ابحث عن خصم)', friend: 'أو العب مع صديق',
    create: 'إنشاء غرفة خاصة', join: 'انضمام', joinPlaceholder: 'كود الغرفة',
    gameSelect: 'اختر اللعبة', free: 'لعب مجاني', points: 'نقاط',
    waiting: 'جاري البحث عن خصم...', shareCode: 'شارك الكود:', playing: 'أول من يجمع',
    you: 'أنت', opp: 'الخصم', bet: 'رهان', win: 'أنت الفائز! 🎉', lose: 'للأسف، خسرت 😢', wonPts: 'لقد ربحت نقاطاً!', lostPts: 'لقد خسرت نقاطاً.', next: 'السؤال التالي', leave: 'مغادرة اللعبة'
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

  useEffect(() => {
    const fetchBalance = async () => {
      if (!user?.email) return;
      const { data } = await supabase.from('app_users').select('balance').eq('email', user.email).single();
      if (data) setUserBalance(data.balance);
    };
    fetchBalance();
  }, [user]);

  // اللعب عبر الإنترنت (البحث التلقائي)
  const playOnline = async () => {
    if (!user?.email) return;
    if (userBalance < wager) return setError(lang === 'ar' ? 'رصيدك غير كافٍ!' : 'Insufficient balance!');
    
    setIsSearching(true);
    setError('');

    const { data, error } = await supabase.rpc('matchmake_secure', {
      p_player_email: user.email,
      p_wager: wager,
      p_target_score: targetScore,
      p_game_type: 'quiz'
    });

    if (error || data.error) {
      setIsSearching(false);
      return setError(error?.message || data.error);
    }

    setRoomCode(data.room_code);
    setMySymbol(data.role);
    
    // جلب بيانات الغرفة
    const { data: roomData } = await supabase.from('game_rooms').select('*').eq('room_code', data.room_code).single();
    setGameRoom(roomData);
    setInGame(true);
  };

  const createRoom = async () => {
    if (!user?.email) return;
    if (userBalance < wager) return setError(lang === 'ar' ? 'رصيدك غير كافٍ!' : 'Insufficient balance!');
    
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
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

  useEffect(() => {
    if (!inGame || !roomCode) return;
    const sub = supabase.channel(`game_${roomCode}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `room_code=eq.${roomCode}` }, (payload) => {
        setGameRoom(payload.new);
      }).subscribe();
    return () => { supabase.removeChannel(sub); };
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

  const leaveGame = () => { setInGame(false); setGameRoom(null); setError(''); setIsSearching(false); };

  // ================= شاشة اللعب =================
  if (inGame) {
    const currentQ = QUESTIONS[gameRoom?.current_question_index % QUESTIONS.length];
    return (
      <div className={`min-h-screen bg-[#0a0a0a] text-white p-4 pb-24 flex flex-col items-center justify-center ${lang === 'ar' ? 'dir-rtl' : 'dir-ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="w-full max-w-sm">
          <button onClick={leaveGame} className="flex items-center gap-2 text-gray-400 mb-6 hover:text-white"><ArrowLeft className={`h-5 w-5 ${lang === 'ar' ? 'rotate-180' : ''}`} /> {t.leave}</button>
          
          <div className="bg-[#161616] p-6 rounded-2xl border border-gray-700 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
            <div className="flex justify-between items-center mb-6 bg-[#0a0a0a] p-3 rounded-xl border border-gray-800 shadow-inner">
              <div className="text-center"><div className="text-xs text-gray-400 mb-1">{t.you} ({mySymbol})</div><div className="text-3xl font-bold text-teal-400 drop-shadow-[0_0_10px_rgba(20,184,166,0.8)]">{mySymbol === 'X' ? gameRoom?.p1_score : gameRoom?.p2_score}</div></div>
              <div className="text-xs text-gray-500 text-center"><div className="bg-gray-800 px-3 py-1 rounded-full mb-1 border border-gray-700">{gameRoom?.wager === 0 ? t.free : `${t.bet}: ${gameRoom?.wager}`}</div><div>{t.playing} {gameRoom?.target_score}</div></div>
              <div className="text-center"><div className="text-xs text-gray-400 mb-1">{t.opp} ({mySymbol === 'X' ? 'O' : 'X'})</div><div className="text-3xl font-bold text-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.8)]">{mySymbol === 'X' ? gameRoom?.p2_score : gameRoom?.p1_score}</div></div>
            </div>

            {gameRoom?.status === 'waiting' && (
              <div className="text-center py-10">
                <div className="animate-pulse text-teal-400 text-lg font-bold mb-4">{t.waiting}</div>
                <p className="text-sm text-gray-400">{t.shareCode} <strong className="text-white text-2xl tracking-widest bg-gray-800 px-4 py-2 rounded-lg border border-gray-700 mt-2 inline-block">{roomCode}</strong></p>
              </div>
            )}

            {gameRoom?.status === 'playing' && currentQ && (
              <div>
                <h2 className="text-center text-2xl font-bold mb-6 bg-gray-800 py-4 rounded-xl border border-gray-700 shadow-[0_0_15px_rgba(255,255,255,0.1)]">{currentQ.q}</h2>
                <div className="flex flex-col gap-3 mb-6">
                  {currentQ.options.map((opt, i) => {
                    let btnClass = "bg-[#0a0a0a] border-gray-700 hover:border-teal-500 hover:shadow-[0_0_15px_rgba(20,184,166,0.4)]";
                    if (hasAnswered) {
                      if (opt === currentQ.answer) btnClass = "bg-green-600/20 border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.5)]";
                      else if (opt === selectedAnswer) btnClass = "bg-red-600/20 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]";
                      else btnClass = "bg-[#0a0a0a] border-gray-800 opacity-50";
                    }
                    return <button key={i} onClick={() => handleAnswer(opt)} disabled={hasAnswered} className={`w-full py-4 rounded-xl border text-xl font-bold transition-all duration-300 ${btnClass}`}>{opt}</button>;
                  })}
                </div>
                {hasAnswered && <button onClick={nextQuestion} className="w-full bg-teal-500 hover:bg-teal-400 text-white py-4 rounded-xl font-bold text-lg shadow-[0_0_15px_rgba(20,184,166,0.5)] flex justify-center items-center gap-2">{t.next} <Timer className="h-5 w-5" /></button>}
              </div>
            )}

            {gameRoom?.status === 'finished' && (
              <div className="text-center py-8">
                <Trophy className="h-20 w-20 text-yellow-400 mx-auto mb-6 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)] animate-bounce" />
                <h3 className="font-bold text-3xl mb-2">{gameRoom.winner === user?.email ? t.win : t.lose}</h3>
                <p className="text-gray-400 mb-8 text-lg">{gameRoom.wager === 0 ? "" : gameRoom.winner === user?.email ? `${t.wonPts} (${gameRoom.wager})` : `${t.lostPts} (${gameRoom.wager})`}</p>
                <button onClick={leaveGame} className="bg-teal-500 px-8 py-3 rounded-xl font-bold text-lg shadow-[0_0_15px_rgba(20,184,166,0.5)]">{t.back}</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ================= شاشة اللوبي (الرئيسية) =================
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 pb-24 flex flex-col items-center" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md">
        
        {/* الهيدر مع زر اللغة */}
        <div className="flex justify-between items-center mb-6 mt-2">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors bg-[#161616] px-3 py-2 rounded-lg border border-gray-800">
            <ArrowLeft className={`h-5 w-5 ${lang === 'ar' ? 'rotate-180' : ''}`} /> {t.back}
          </button>
          <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="flex items-center gap-2 bg-[#161616] text-teal-400 px-4 py-2 rounded-lg border border-gray-800 font-bold hover:bg-gray-800 transition-colors">
            <Globe className="h-4 w-4" /> {lang === 'en' ? 'AR' : 'EN'}
          </button>
        </div>

        <div className="bg-[#161616] p-6 rounded-2xl border border-gray-700 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
          <div className="flex justify-center mb-4">
            <Swords className="h-16 w-16 text-teal-400 drop-shadow-[0_0_20px_rgba(20,184,166,0.8)]" />
          </div>
          <h1 className="text-3xl font-bold text-center mb-1">{t.title}</h1>
          <p className="text-gray-400 text-center text-sm mb-6">{t.sub}</p>
          
          <div className="bg-gray-800 p-4 rounded-xl mb-6 text-center border border-gray-700 flex justify-between items-center">
            <span className="text-gray-400 text-sm font-medium">{t.balance}:</span>
            <span className="text-teal-400 font-bold text-xl drop-shadow-[0_0_5px_rgba(20,184,166,0.5)]">{userBalance} LE</span>
          </div>

          {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm text-center border border-red-500/50">{error}</div>}

          {/* اختيار اللعبة */}
          <div className="mb-6">
            <label className="text-sm text-gray-400 mb-2 block font-medium">{t.gameSelect}</label>
            <div className="flex items-center gap-4 bg-[#0a0a0a] border border-gray-700 rounded-xl p-3 cursor-pointer hover:border-teal-500 transition-colors">
              <div className="bg-teal-500/20 p-2 rounded-lg"><Gamepad2 className="h-6 w-6 text-teal-400" /></div>
              <div className="flex-1">
                <div className="font-bold text-white">{t.title}</div>
                <div className="text-xs text-gray-500">1 vs 1 Quiz</div>
              </div>
              <ChevronDown className="h-5 w-5 text-gray-500" />
            </div>
          </div>

          {/* إعدادات الرهان */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div>
              <label className="text-sm text-gray-400 mb-2 block font-medium">{t.wager}</label>
              <select value={wager} onChange={e => setWager(Number(e.target.value))} className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl p-3 text-white font-bold focus:outline-none focus:border-teal-500">
                <option value={0}>{t.free}</option>
                <option value={5}>5 {t.points}</option>
                <option value={10}>10 {t.points}</option>
                <option value={50}>50 {t.points}</option>
                <option value={100}>100 {t.points}</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block font-medium">{t.target}</label>
              <select value={targetScore} onChange={e => setTargetScore(Number(e.target.value))} className="w-full bg-[#0a0a0a] border border-gray-700 rounded-xl p-3 text-white font-bold focus:outline-none focus:border-teal-500">
                <option value={3}>3 {t.points}</option>
                <option value={5}>5 {t.points}</option>
                <option value={10}>10 {t.points}</option>
              </select>
            </div>
          </div>

          {/* زر اللعب عبر الإنترنت (الأكبر والأهم) */}
          <button onClick={playOnline} disabled={isSearching} className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-400 hover:to-blue-400 text-white py-4 rounded-xl font-bold text-lg mb-6 shadow-[0_0_20px_rgba(20,184,166,0.6)] hover:shadow-[0_0_30px_rgba(20,184,166,0.9)] transition-all flex items-center justify-center gap-3">
            {isSearching ? (
              <span className="animate-pulse flex items-center gap-2">Finding Opponent...</span>
            ) : (
              <><Globe className="h-6 w-6" /> {t.playOnline}</>
            )}
          </button>

          {/* قسم اللعب مع صديق */}
          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-gray-700"></div>
            <span className="flex-shrink-0 mx-4 text-gray-500 text-xs font-bold uppercase">{t.friend}</span>
            <div className="flex-grow border-t border-gray-700"></div>
          </div>

          <button onClick={createRoom} className="w-full bg-[#0a0a0a] border border-teal-500/50 hover:bg-teal-500/10 text-teal-400 py-3 rounded-xl font-bold mb-4 transition-all shadow-[0_0_10px_rgba(20,184,166,0.1)]">
            {t.create}
          </button>

          <div className="flex gap-2">
            <input type="text" placeholder={t.joinPlaceholder} value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} className="flex-1 bg-[#0a0a0a] border border-gray-700 rounded-xl px-4 py-3 text-center tracking-widest font-bold focus:outline-none focus:border-teal-500" />
            <button onClick={joinRoom} className="bg-white text-black px-6 rounded-xl font-bold hover:bg-gray-200">{t.join}</button>
          </div>

        </div>
      </div>
    </div>
  );
}