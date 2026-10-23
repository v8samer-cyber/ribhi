import { useState } from 'react';
import { Swords, Flame, Gamepad2 } from 'lucide-react';
import QuizGame from './QuizGame'; 

export default function GamesLobby() {
  const [activeGame, setActiveGame] = useState<string | null>(null);

  if (activeGame === 'quiz') {
    return <QuizGame onBack={() => setActiveGame(null)} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 pb-24">
      <div className="flex items-center gap-2 mb-6 mt-2">
        <span className="text-2xl drop-shadow-[0_0_10px_rgba(20,184,166,0.8)]">🎮</span>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">
          Games Arena
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-4">
        
        {/* بطاقة لعبة تحدي الذكاء - بتأثير توهج */}
        <div 
          onClick={() => setActiveGame('quiz')}
          className="relative bg-[#161616] border border-teal-500/50 shadow-[0_0_15px_rgba(20,184,166,0.2)] hover:shadow-[0_0_30px_rgba(20,184,166,0.6)] hover:border-teal-400 rounded-2xl p-6 flex flex-col items-center justify-center h-48 transition-all duration-300 cursor-pointer group"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 85% 100%, 0 100%)' }}
        >
          <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-[0_0_10px_rgba(220,38,38,0.8)]">
            LIVE
            <Flame className="h-3 w-3 animate-pulse" />
          </div>
          
          <div className="text-4xl font-bold mb-2 text-teal-400 drop-shadow-[0_0_15px_rgba(20,184,166,0.8)] group-hover:scale-110 transition-transform">
            <Swords className="h-12 w-12" />
          </div>
          <h3 className="text-sm font-bold mb-1 text-white">Quiz Duel</h3>
          <p className="text-[10px] text-gray-400 text-center mb-2 group-hover:text-teal-300 transition-colors">Challenge friends 1v1</p>
        </div>

        {/* بطاقة لعبة الذاكرة (قريباً) */}
        <div className="relative bg-[#161616] border border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center h-48 opacity-60 cursor-not-allowed" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 85% 100%, 0 100%)' }}>
          <div className="absolute top-3 right-3 bg-gray-700 text-white text-[10px] font-bold px-2 py-0.5 rounded">
            SOON
          </div>
          <div className="text-4xl font-bold mb-2 text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">
            <Gamepad2 className="h-12 w-12" />
          </div>
          <h3 className="text-sm font-bold mb-1">Memory Match</h3>
          <p className="text-[10px] text-gray-500 text-center mb-2">Find the pairs</p>
        </div>

      </div>
    </div>
  );
}