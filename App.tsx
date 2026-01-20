import React, { useState, useEffect } from 'react';
import { User } from './types';
import { Auth } from './components/Auth';
import { MeetingRoom } from './components/MeetingRoom';
import { Video, Plus, Keyboard } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [inputRoomId, setInputRoomId] = useState('');

  useEffect(() => {
    // Check for cached user
    const savedUser = localStorage.getItem('gemini_meet_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // Check hash for room link
    const hash = window.location.hash;
    if (hash.startsWith('#/room/')) {
      const id = hash.split('#/room/')[1];
      if (id) {
        setRoomId(id);
      }
    }
  }, []);

  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 7) + '-' + Math.random().toString(36).substring(2, 7);
    window.location.hash = `#/room/${newRoomId}`;
    setRoomId(newRoomId);
  };

  const handleJoinRoom = () => {
    if (inputRoomId.trim()) {
      window.location.hash = `#/room/${inputRoomId}`;
      setRoomId(inputRoomId);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('gemini_meet_user');
    setUser(null);
  };

  const handleLeaveRoom = () => {
    setRoomId(null);
    window.location.hash = '';
  };

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  if (roomId) {
    return <MeetingRoom user={user} roomId={roomId} onLeave={handleLeaveRoom} />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-3xl"></div>
      </div>

      <header className="p-6 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg">
             <Video className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-semibold tracking-tight">GeminiMeet</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium text-white">{user.name}</div>
            <div className="text-xs text-gray-400">{user.email}</div>
          </div>
          <div className="h-10 w-10 bg-gray-800 rounded-full flex items-center justify-center text-blue-400 font-bold border border-gray-700">
             {user.name.charAt(0).toUpperCase()}
          </div>
          <button 
             onClick={handleLogout}
             className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 pt-12 relative z-10 flex flex-col md:flex-row items-center gap-16">
        <div className="flex-1 max-w-xl">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
            Premium video meetings. <br/>
            <span className="text-blue-500">Powered by Gemini.</span>
          </h1>
          <p className="text-gray-400 text-lg mb-10 leading-relaxed">
            Create a room and collaborate with AI. Use the integrated Gemini tools to Search the web and find places on Google Maps directly within your meeting chat.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-start">
             <button
               onClick={handleCreateRoom}
               className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg shadow-lg shadow-blue-900/30 transition-all flex items-center gap-2"
             >
               <Plus size={20} />
               New meeting
             </button>
             
             <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Keyboard size={18} className="text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Enter a code or link"
                  value={inputRoomId}
                  onChange={(e) => setInputRoomId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                  className="bg-gray-900 border border-gray-700 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64 transition-all"
                />
             </div>
             {inputRoomId && (
                <button 
                  onClick={handleJoinRoom}
                  className="text-blue-400 hover:text-blue-300 font-medium py-3 px-4"
                >
                  Join
                </button>
             )}
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-800">
             <p className="text-gray-500 text-sm">
               <span className="font-semibold text-gray-400">Features:</span> 
               <span className="ml-2 inline-flex items-center gap-1.5 px-2 py-1 rounded bg-gray-800/50 border border-gray-700 text-xs">
                 gemini-3-flash-preview
               </span>
               <span className="ml-2 inline-flex items-center gap-1.5 px-2 py-1 rounded bg-gray-800/50 border border-gray-700 text-xs">
                 googleSearch
               </span>
               <span className="ml-2 inline-flex items-center gap-1.5 px-2 py-1 rounded bg-gray-800/50 border border-gray-700 text-xs">
                 googleMaps
               </span>
             </p>
          </div>
        </div>

        <div className="flex-1 w-full max-w-lg">
           <div className="relative">
              {/* Decorative blob behind image */}
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-lg opacity-30"></div>
              
              {/* Carousel / Image Placeholder */}
              <div className="relative bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden shadow-2xl aspect-square flex flex-col">
                 <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gray-850">
                    <div className="flex gap-2">
                       <div className="w-3 h-3 rounded-full bg-red-500"></div>
                       <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                       <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="text-xs text-gray-500 font-mono">Gemini AI Assistant</div>
                 </div>
                 <div className="flex-1 bg-gray-900 p-8 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600 p-[2px]">
                       <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
                          <img 
                            src="https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg" 
                            alt="Gemini" 
                            className="w-20 h-20 opacity-80"
                          />
                       </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-medium text-white mb-2">Your AI Meeting Companion</h3>
                      <p className="text-gray-400 text-sm max-w-xs mx-auto">
                        "Hey Gemini, where is the nearest coffee shop?"
                        <br/>
                        "What is the stock price of Alphabet?"
                      </p>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                       <div className="px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700 text-xs text-gray-300">
                          Search Grounding
                       </div>
                       <div className="px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700 text-xs text-gray-300">
                          Maps Grounding
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
};

export default App;
