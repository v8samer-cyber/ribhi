import { useState } from 'react';
import { Swords, Flame, Gamepad2 } from 'lucide-react';
import QuizGame from './QuizGame'; // سنقوم بإنشاء هذا الملف في الخطوة القادمة

export default function GamesLobby() {
  const [activeGame, setActiveGame] = useState<string | null>(null);

  // إذا اختار اللاعب لعبة، نفتح اللعبة
  if (activeGame === 'quiz') {
    return <QuizGame onBack={() => setActiveGame(null)} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 pb-24">
      <div className="flex items-center gap-2 mb-6 mt-2">
        <span className="text-2xl">🎮</span>
        <h1 className="text-xl font-bold">Games Arena</h1>
      </div>

      {/* شبكة الألعاب (تماما مثل شبكة الشركات) */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* بطاقة لعبة تحدي الذكاء */}
        <div 
          onClick={() => setActiveGame('quiz')}
          className="relative bg-[#161616] border border-orange-500/40 rounded-2xl p-6 flex flex-col items-center justify-center h-48 hover:bg-[#1a1a1a] transition cursor-pointer"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 85% 100%, 0 100%)' }}
        >
          <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
            LIVE
            <Flame className="h-3 w-3" />
          </div>
          <div className="text-4xl font-bold mb-2 text-teal-400">
            <Swords className="h-12 w-12" />
          </div>
          <h3 className="text-sm font-bold mb-1">Quiz Duel</h3>
          <p className="text-[10px] text-gray-500 text-center mb-2">Challenge friends 1v1</p>
        </div>

        {/* بطاقة لعبة الذاكرة (قريباً) */}
        <div className="relative bg-[#161616] border border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center h-48 opacity-60 cursor-not-allowed" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 85% 100%, 0 100%)' }}>
          <div className="absolute top-3 right-3 bg-gray-700 text-white text-[10px] font-bold px-2 py-0.5 rounded">
            SOON
          </div>
          <div className="text-4xl font-bold mb-2 text-purple-400">
            <Gamepad2 className="h-12 w-12" />
          </div>
          <h3 className="text-sm font-bold mb-1">Memory Match</h3>
          <p className="text-[10px] text-gray-500 text-center mb-2">Find the pairs</p>
        </div>

      </div>
    </div>
  );
}