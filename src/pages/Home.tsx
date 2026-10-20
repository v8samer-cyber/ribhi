import { useApp } from '@/context/AppContext';

export default function Home() {
  const { navigate, user } = useApp();

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24">
      <div className="text-center mt-10 mb-8">
        <h1 className="text-3xl font-bold mb-2">Earn Money While Having Fun</h1>
        <p className="text-gray-400">Test Apps & Games Now!</p>
      </div>

      <button
        onClick={() => navigate(user ? 'earn' : 'signin')}
        className="w-full bg-orange-500 text-white font-bold py-4 rounded-xl mb-6 shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition"
      >
        {user ? 'Continue Earning' : 'Start Earning Now'}
      </button>

      <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 flex items-center gap-4">
        <div className="bg-gray-800 p-3 rounded-full text-2xl">⏱️</div>
        <div>
          <p className="text-xl font-bold">13m 4s</p>
          <p className="text-sm text-gray-400">Average time until first cashout</p>
        </div>
      </div>
    </div>
  );
}