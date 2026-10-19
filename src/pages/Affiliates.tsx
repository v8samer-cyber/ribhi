import { useApp } from '@/context/AppContext';

export default function Affiliates() {
  const { user } = useApp();
  
  const currentUrl = window.location.origin; 
  const refLink = `${currentUrl}/ref/${user?.username || 'user123'}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(refLink);
    alert('Referral link copied!');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 pb-24">
      <h1 className="text-2xl font-bold mb-6 mt-2">Refer & Earn</h1>
      
      <div className="bg-[#161616] p-6 rounded-2xl border border-gray-800 text-center">
        <p className="text-gray-400 mb-4">Invite friends and earn 10% of their earnings!</p>
        
        <div className="bg-black p-3 rounded-xl border border-gray-700 mb-4 font-mono text-sm overflow-hidden text-ellipsis text-gray-300">
          {refLink}
        </div>
        
        <button onClick={copyToClipboard} className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600">
          Copy Link
        </button>
      </div>
    </div>
  );
}