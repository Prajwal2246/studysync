import React, { useEffect, useRef, useState } from "react";
import { User, ChatMessage } from "../../types";
import {
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  collection,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  Monitor,
  MonitorOff,
  MessageSquare,
  Users,
  Copy,
  Share2,
} from "lucide-react";
import { ChatPanel } from "./ChatPanel";

interface MeetingRoomProps {
  user: User;
  roomId: string;
  onLeave: () => void;
}

export const MeetingRoom: React.FC<MeetingRoomProps> = ({
  user,
  roomId,
  onLeave,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [participants, setParticipants] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState<GeolocationCoordinates | undefined>(
    undefined,
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "system",
      senderName: "System",
      text: `Welcome to the meeting room: ${roomId}`,
      timestamp: Date.now(),
    },
  ]);

  /* -------------------- CLOCK -------------------- */
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* -------------------- GEOLOCATION -------------------- */
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation(pos.coords),
      () => {},
    );
  }, []);

  /* -------------------- FIREBASE: JOIN / LEAVE -------------------- */
  useEffect(() => {
    const userRef = doc(db, "rooms", roomId, "participants", user.id);

    setDoc(userRef, {
      name: user.name,
      joinedAt: Date.now(),
    });

    return () => {
      deleteDoc(userRef);
    };
  }, [roomId, user.id, user.name]);

  /* -------------------- FIREBASE: PARTICIPANT COUNT -------------------- */
  useEffect(() => {
    const participantsRef = collection(db, "rooms", roomId, "participants");

    const unsubscribe = onSnapshot(participantsRef, (snapshot) => {
      setParticipants(snapshot.size);
    });

    return unsubscribe;
  }, [roomId]);

  /* -------------------- MEDIA (CAMERA + MIC) -------------------- */
  useEffect(() => {
    const startMedia = async () => {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // ✅ store stream for controls
      setStream(mediaStream);

      // ✅ attach to SAME video used in UI
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // ✅ WebRTC (safe, not breaking UI)
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      mediaStream
        .getTracks()
        .forEach((track) => pc.addTrack(track, mediaStream));

      pcRef.current = pc;
    };

    startMedia();

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*  */
  useEffect(() => {
    const startMedia = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = new RTCPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      pcRef.current = pc;
    };

    startMedia();
  }, []);

  /* -------------------- CONTROLS -------------------- */
  const toggleMic = () => {
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => (t.enabled = !isMicOn));
    setIsMicOn(!isMicOn);
  };

  const toggleCamera = () => {
    if (!stream) return;
    stream.getVideoTracks().forEach((t) => (t.enabled = !isCameraOn));
    setIsCameraOn(!isCameraOn);
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      screenStream?.getTracks().forEach((t) => t.stop());
      setScreenStream(null);
      setIsScreenSharing(false);
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

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
      console.error(err);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Meeting link copied");
  };

  /* -------------------- UI -------------------- */
  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <div className="absolute top-0 w-full h-16 flex justify-between px-6 items-center z-10">
          <div className="bg-gray-900/80 px-4 py-2 rounded-lg border border-gray-800">
            <span className="text-white">
              {currentTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <div className="bg-gray-900/80 px-3 py-2 rounded-lg border border-gray-800 flex items-center gap-2">
            <Users size={18} className="text-gray-400" />
            <span className="text-gray-300">{participants}</span>
          </div>
        </div>

        {/* Video */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden bg-gray-900 border border-gray-800">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover scale-x-[-1] ${
                !isCameraOn ? "opacity-0" : ""
              }`}
            />

            {!isCameraOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-4xl text-white">
                  {user.name[0].toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="h-20 bg-gray-900 border-t border-gray-800 flex justify-center gap-4 items-center">
          <button onClick={toggleMic} className="control-btn">
            {isMicOn ? <Mic /> : <MicOff />}
          </button>
          <button onClick={toggleCamera} className="control-btn">
            {isCameraOn ? <VideoIcon /> : <VideoOff />}
          </button>
          <button onClick={toggleScreenShare} className="control-btn">
            {isScreenSharing ? <MonitorOff /> : <Monitor />}
          </button>
          <button onClick={onLeave} className="bg-red-600 p-4 rounded-full">
            <PhoneOff />
          </button>
          <button onClick={copyLink}>
            <Copy />
          </button>
        </div>
      </div>

      {showChat && (
        <div className="w-96">
          <ChatPanel
            messages={messages}
            addMessage={(msg) => setMessages((p) => [...p, msg])}
            userLocation={location}
          />
        </div>
      )}
      <div className="absolute bottom-24 left-6 text-white">
        Participants: {participants}
      </div>
    </div>
  );
};
