import React, { useEffect, useRef, useState } from 'react';
import { User, ChatMessage } from '../types';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Monitor, MonitorOff, MessageSquare, Users, Copy, Share2 } from 'lucide-react';
import { ChatPanel } from './ChatPanel';

interface MeetingRoomProps {
  user: User;
  roomId: string;
  onLeave: () => void;
}

export const MeetingRoom: React.FC<MeetingRoomProps> = ({ user, roomId, onLeave }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [participants, setParticipants] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState<GeolocationCoordinates | undefined>(undefined);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'system',
      senderName: 'System',
      text: `Welcome to the meeting room: ${roomId}. You can use the chat to ask Gemini questions with real-time Google Search and Maps data.`,
      timestamp: Date.now()
    }
  ]);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setLocation(position.coords),
        (err) => console.warn("Geolocation access denied", err)
      );
    }
  }, []);

  // Initialize Media
  useEffect(() => {
    const startMedia = async () => {
      try {
        const userStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setStream(userStream);
        if (videoRef.current) {
          videoRef.current.srcObject = userStream;
        }
      } catch (err) {
        console.error("Error accessing media devices:", err);
        alert("Could not access camera/microphone. Please check permissions.");
      }
    };

    startMedia();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => track.enabled = !isMicOn);
      setIsMicOn(!isMicOn);
    }
  };

  const toggleCamera = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => track.enabled = !isCameraOn);
      setIsCameraOn(!isCameraOn);
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop sharing
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
      }
      setScreenStream(null);
      setIsScreenSharing(false);
    } else {
      // Start sharing
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(displayStream);
        setIsScreenSharing(true);
        
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = displayStream;
        }

        displayStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
        };
      } catch (err) {
        console.error("Error sharing screen:", err);
      }
    }
  };

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert("Meeting link copied to clipboard!");
  };

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative transition-all duration-300">
        
        {/* Header (Top Bar) */}
        <div className="h-16 flex items-center justify-between px-6 bg-transparent absolute top-0 w-full z-10 pointer-events-none">
          <div className="pointer-events-auto bg-gray-900/80 backdrop-blur-md px-4 py-2 rounded-lg border border-gray-800 flex items-center gap-3">
             <span className="text-white font-medium">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
             <div className="h-4 w-px bg-gray-600"></div>
             <span className="text-gray-300 text-sm font-medium">{roomId}</span>
          </div>
          <div className="pointer-events-auto">
             <div className="flex items-center gap-2 bg-gray-900/80 backdrop-blur-md px-3 py-2 rounded-lg border border-gray-800">
                <Users size={18} className="text-gray-400" />
                <span className="text-gray-300 text-sm">{participants + (isScreenSharing ? 1 : 0)}</span>
             </div>
          </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 p-4 flex items-center justify-center gap-4 overflow-hidden relative">
          
          {/* Main User Video */}
          <div className={`relative rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 transition-all duration-500 ${isScreenSharing ? 'w-1/4 h-1/4 absolute bottom-24 right-6 shadow-2xl z-20 border-2 border-gray-700' : 'w-full max-w-5xl aspect-video shadow-2xl'}`}>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover transform scale-x-[-1] ${!isCameraOn ? 'opacity-0' : 'opacity-100'}`}
            />
            {!isCameraOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-4xl text-white font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-md text-white text-sm font-medium flex items-center gap-2">
              {user.name} (You)
              {!isMicOn && <MicOff size={14} className="text-red-500" />}
            </div>
          </div>

          {/* Screen Share View */}
          {isScreenSharing && (
            <div className="w-full h-full p-4 flex items-center justify-center">
               <div className="w-full max-w-6xl aspect-video bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl relative">
                  <video
                    ref={screenVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-4 left-4 bg-blue-600/90 backdrop-blur-sm px-3 py-1.5 rounded-md text-white text-sm font-medium flex items-center gap-2 shadow-lg">
                    <Share2 size={14} />
                    You are sharing your screen
                  </div>
               </div>
            </div>
          )}

        </div>

        {/* Bottom Control Bar */}
        <div className="h-20 bg-gray-900 border-t border-gray-800 flex items-center justify-between px-6 z-20">
          <div className="flex items-center gap-4 min-w-[200px]">
            <span className="text-white font-medium truncate hidden md:block">{currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
             <button onClick={copyLink} className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1.5">
               <Copy size={14} /> Copy joining info
             </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleMic}
              className={`p-4 rounded-full transition-all duration-200 ${isMicOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/50'}`}
            >
              {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button
              onClick={toggleCamera}
              className={`p-4 rounded-full transition-all duration-200 ${isCameraOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/50'}`}
            >
              {isCameraOn ? <VideoIcon size={20} /> : <VideoOff size={20} />}
            </button>
            <button
              onClick={toggleScreenShare}
              className={`p-4 rounded-full transition-all duration-200 ${!isScreenSharing ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/50'}`}
            >
              {!isScreenSharing ? <Monitor size={20} /> : <MonitorOff size={20} />}
            </button>
            <button
              onClick={onLeave}
              className="px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white ml-2 transition-all flex items-center gap-2"
            >
              <PhoneOff size={20} />
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 min-w-[200px]">
             <button
              onClick={() => setShowChat(!showChat)}
              className={`p-3 rounded-lg transition-all ${showChat ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:bg-gray-800'}`}
            >
              <MessageSquare size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Side Chat Panel */}
      {showChat && (
        <div className="w-96 h-full transition-all duration-300 ease-in-out transform translate-x-0">
          <ChatPanel 
             messages={messages} 
             addMessage={(msg) => setMessages(prev => [...prev, msg])}
             userLocation={location}
          />
        </div>
      )}
    </div>
  );
};
