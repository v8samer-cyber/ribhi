import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Swords, Trophy, Timer } from 'lucide-react';

const QUESTIONS = [
  { q: "5 + 7 = ?", options: ["10", "12", "14"], answer: "12" },
  { q: "9 * 3 = ?", options: ["27", "21", "24"], answer: "27" },
  { q: "15 - 8 = ?", options: ["5", "7", "9"], answer: "7" },
  { q: "ما هي عاصمة اليابان؟", options: ["بكين", "طوكيو", "سيول"], answer: "طوكيو" },
  { q: "ما هو أكبر كوكب في المجموعة الشمسية؟", options: ["المشتري", "زحل", "الأرض"], answer: "المشتري" },
  { q: "12 / 4 = ?", options: ["2", "3", "4"], answer: "3" },
  { q: "ما هو ناتج 10 + 20؟", options: ["20", "30", "40"], answer: "30" },
  { q: "كم عدد أيام الأسبوع؟", options: ["5", "6", "7"], answer: "7" },
  { q: "2 * 2 * 2 = ?", options: ["6", "8", "10"], answer: "8" }
];

export default function QuizGame({ onBack }: { onBack: () => void }) {
  const { user } = useApp();
  const [inGame, setInGame] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [gameRoom, setGameRoom] = useState<any>(null);
  const [mySymbol, setMySymbol] = useState<'X' | 'O' | null>(null);
  const [error, setError] = useState('');
  
  const [wager, setWager] = useState(10);
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

  const createRoom = async () => {
    if (!user?.email) return;
    if (userBalance < wager) return setError('رصيدك غير كافٍ لهذا الرهان!');
    
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const { data, error } = await supabase.from('game_rooms').insert([{
      room_code: code,
      player1_email: user.email,
      wager: wager,
      target_score: targetScore,
      status: 'waiting'
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
      p_room_code: joinCode.toUpperCase(),
      p_player_email: user.email
    });

    if (error) return setError(error.message);
    if (data.error) return setError(data.error);

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

  useEffect(() => {
    setHasAnswered(false);
    setSelectedAnswer(null);
  }, [gameRoom?.current_question_index]);

  const handleAnswer = async (answer: string) => {
    if (hasAnswered || gameRoom.status !== 'playing' || gameRoom.winner) return;
    
    const currentQ = QUESTIONS[gameRoom.current_question_index % QUESTIONS.length];
    const isCorrect = answer === currentQ.answer;
    setHasAnswered(true);
    setSelectedAnswer(answer);

    let p1_score = gameRoom.p1_score;
    let p2_score = gameRoom.p2_score;

    if (isCorrect) {
      if (mySymbol === 'X') p1_score += 1;
      else p2_score += 1;
    }

    let winnerEmail = null;
    if (p1_score >= gameRoom.target_score) winnerEmail = gameRoom.player1_email;
    if (p2_score >= gameRoom.target_score) winnerEmail = gameRoom.player2_email;

    if (winnerEmail) {
      await supabase.rpc('finish_game_secure', {
        p_room_code: gameRoom.room_code,
        p_winner_email: winnerEmail
      });
    } else {
      await supabase.from('game_rooms').update({ p1_score, p2_score }).eq('id', gameRoom.id);
    }
  };

  const nextQuestion = async () => {
    if (!gameRoom) return;
    await supabase.from('game_rooms').update({ current_question_index: gameRoom.current_question_index + 1 }).eq('id', gameRoom.id);
  };

  const leaveGame = () => {
    setInGame(false);
    setGameRoom(null);
    setRoomCode('');
    setJoinCode('');
    setError('');
  };

  if (!inGame) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-4 pb-24 flex flex-col items-center justify-center">
        <div className="bg-[#161616] p-6 rounded-2xl border border-gray-700 w-full max-w-sm relative">
          <button onClick={onBack} className="absolute -top-12 left-0 flex items-center gap-2 text-gray-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" /> Back
          </button>
          
          <div className="flex justify-center mb-4">
            <Swords className="h-12 w-12 text-teal-400" />
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">Quiz Duel</h1>
          <p className="text-gray-400 text-center text-sm mb-4">تحدى صديقك واربح نقاطه!</p>
          
          <div className="bg-gray-800 p-3 rounded-xl mb-4 text-center">
            <span className="text-gray-400 text-sm">رصيدك الحالي:</span>
            <span className="text-teal-400 font-bold ml-2">{userBalance} LE</span>
          </div>

          {error && <div className="bg-red-500/20 text-red-400 p-2 rounded mb-4 text-xs text-center">{error}</div>}

          <div className="mb-4">
            <label className="text-xs text-gray-400 mb-1 block">مبلغ الرهان (نقاط):</label>
            <select value={wager} onChange={e => setWager(Number(e.target.value))} className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg p-2 text-white">
              <option value={5}>5 نقاط</option>
              <option value={10}>10 نقاط</option>
              <option value={50}>50 نقطة</option>
              <option value={100}>100 نقطة</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="text-xs text-gray-400 mb-1 block">النقاط المطلوبة للفوز:</label>
            <select value={targetScore} onChange={e => setTargetScore(Number(e.target.value))} className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg p-2 text-white">
              <option value={3}>أول من يجمع 3 نقاط</option>
              <option value={5}>أول من يجمع 5 نقاط</option>
              <option value={10}>أول من يجمع 10 نقاط</option>
            </select>
          </div>

          <button onClick={createRoom} className="w-full bg-teal-500 hover:bg-teal-600 py-3 rounded-xl font-bold mb-4 transition-colors">
            إنشاء غرفة جديدة
          </button>

          <div className="relative flex py-2 items-center mb-4">
            <div className="flex-grow border-t border-gray-600"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">أو انضم</span>
            <div className="flex-grow border-t border-gray-600"></div>
          </div>

          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="كود الغرفة" 
              value={joinCode} 
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              className="flex-1 bg-[#0a0a0a] border border-gray-700 rounded-xl px-4 py-3 text-center tracking-widest font-bold focus:outline-none focus:border-teal-500"
            />
            <button onClick={joinRoom} className="bg-white text-black px-6 rounded-xl font-bold hover:bg-gray-200">
              انضم
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = QUESTIONS[gameRoom?.current_question_index % QUESTIONS.length];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 pb-24 flex flex-col items-center justify-center">
      <div className="w-full max-w-sm">
        <button onClick={leaveGame} className="flex items-center gap-2 text-gray-400 mb-6 hover:text-white">
          <ArrowLeft className="h-5 w-5" /> Leave Game
        </button>

        <div className="bg-[#161616] p-6 rounded-2xl border border-gray-700">
          
          <div className="flex justify-between items-center mb-6 bg-[#0a0a0a] p-3 rounded-xl border border-gray-800">
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-1">You ({mySymbol})</div>
              <div className="text-2xl font-bold text-teal-400">{mySymbol === 'X' ? gameRoom?.p1_score : gameRoom?.p2_score}</div>
            </div>
            <div className="text-xs text-gray-500 text-center">
              <div className="bg-gray-800 px-3 py-1 rounded-full mb-1">Bet: {gameRoom?.wager} LE</div>
              <div>Race to {gameRoom?.target_score}</div>
            </div>
            <div className="text-center">
               <div className="text-xs text-gray-400 mb-1">Opponent ({mySymbol === 'X' ? 'O' : 'X'})</div>
               <div className="text-2xl font-bold text-orange-400">{mySymbol === 'X' ? gameRoom?.p2_score : gameRoom?.p1_score}</div>
            </div>
          </div>

          {gameRoom?.status === 'waiting' && (
            <div className="text-center py-8">
              <div className="animate-pulse text-teal-400 font-bold mb-2">Waiting for opponent...</div>
              <p className="text-sm text-gray-400">Share code: <strong className="text-white text-xl tracking-widest">{roomCode}</strong></p>
            </div>
          )}

          {gameRoom?.status === 'playing' && currentQ && (
            <div>
              <h2 className="text-center text-2xl font-bold mb-6 bg-gray-800 py-4 rounded-xl border border-gray-700">{currentQ.q}</h2>
              
              <div className="flex flex-col gap-3 mb-6">
                {currentQ.options.map((opt, i) => {
                  let btnClass = "bg-[#0a0a0a] border-gray-700 hover:border-teal-500";
                  if (hasAnswered) {
                    if (opt === currentQ.answer) btnClass = "bg-green-600/20 border-green-500 text-green-400";
                    else if (opt === selectedAnswer) btnClass = "bg-red-600/20 border-red-500 text-red-400";
                    else btnClass = "bg-[#0a0a0a] border-gray-800 opacity-50";
                  }

                  return (
                    <button key={i} onClick={() => handleAnswer(opt)} disabled={hasAnswered} className={`w-full py-3 rounded-xl border text-lg font-bold transition-colors ${btnClass}`}>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {hasAnswered && (
                <button onClick={nextQuestion} className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                  Next Question <Timer className="h-5 w-5" />
                </button>
              )}
            </div>
          )}

          {gameRoom?.status === 'finished' && (
            <div className="text-center py-8">
              <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="font-bold text-2xl mb-2">
                {gameRoom.winner === user?.email ? "You Won! 🎉" : "You Lost 😢"}
              </h3>
              <p className="text-gray-400 mb-6">
                {gameRoom.winner === user?.email 
                  ? `You won ${gameRoom.wager} points!` 
                  : `You lost ${gameRoom.wager} points.`}
              </p>
              <button onClick={leaveGame} className="bg-teal-500 px-6 py-2 rounded-lg text-sm font-bold hover:bg-teal-600">
                Back to Lobby
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}