import { useApp } from '@/context/AppContext';

export default function Home() {
  const { navigate } = useApp();

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-24">
      {/* الترحيب */}
      <div className="text-center mt-10 mb-8">
        <h1 className="text-3xl font-bold mb-2">Earn Money While Having Fun</h1>
        <p className="text-gray-400">Test Apps & Games Now!</p>
      </div>

      {/* زر البدء */}
      <button
        onClick={() => navigate('earn')}
        className="w-full bg-orange-500 text-white font-bold py-4 rounded-xl mb-6 shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition"
      >
        Start Earning Now
      </button>

      {/* بطاقة معلومات */}
      <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 flex items-center gap-4">
        <div className="bg-gray-800 p-3 rounded-full">
          <span className="text-2xl">⏱️</span>
        </div>
        <div>
          <p className="text-xl font-bold">13m 4s</p>
          <p className="text-sm text-gray-400">Average time until first cashout</p>
        </div>
      </div>
    </div>
  );
}
