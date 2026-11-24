"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Mic, 
  MicOff, 
  PhoneOff, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  Flag,
  MessageSquare,
  Sparkles
} from "lucide-react";
import confetti from "canvas-confetti";
import { useChatSocket, UserProfile } from "@/hooks/useChatSocket";

const SAMPLE_STRANGERS: UserProfile[] = [
  { name: "Priya", gender: "female", age: "21" },
  { name: "Aarav", gender: "male", age: "23" },
  { name: "Sneha", gender: "female", age: "20" },
  { name: "Rohan", gender: "male", age: "24" },
  { name: "Ananya", gender: "female", age: "22" },
  { name: "Vikram", gender: "male", age: "25" },
  { name: "Alex", gender: "other", age: "22" },
];

export default function VoicePage() {
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [duration, setDuration] = useState(0);
  const [myProfile, setMyProfile] = useState<UserProfile>({
    name: "Anonymous",
    gender: "male",
    age: "22",
  });

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Load user profile from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cs_user_profile");
      if (saved) {
        setMyProfile(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Could not load user profile", e);
    }
  }, []);

  // WebRTC socket connection
  const {
    status: socketStatus,
    partnerProfile: strangerProfile,
    isInitiator,
    sendSignal,
    nextStranger,
    disconnect
  } = useChatSocket({
    mode: "voice",
    profile: myProfile,
    autoConnect: true,
    onSignal: async (data) => {
      try {
        if (!pcRef.current) return;
        if (data.sdp) {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
          if (data.sdp.type === "offer") {
            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);
            sendSignal({ sdp: answer });
          }
        } else if (data.candidate) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (err) {
        console.warn("Voice WebRTC signal error:", err);
      }
    }
  });

  const status = socketStatus === "searching" ? "connecting" : socketStatus === "connected" ? "connected" : "ended";

  // WebRTC voice call establishment
  useEffect(() => {
    async function startVoiceCall() {
      if (socketStatus !== "connected") {
        if (pcRef.current) {
          pcRef.current.close();
          pcRef.current = null;
        }
        return;
      }

      confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;

        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" }
          ]
        });
        pcRef.current = pc;

        stream.getAudioTracks().forEach(track => pc.addTrack(track, stream));

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            sendSignal({ candidate: event.candidate });
          }
        };

        pc.ontrack = (event) => {
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = event.streams[0];
          }
        };

        if (isInitiator) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendSignal({ sdp: offer });
        }
      } catch (err) {
        console.warn("Could not capture microphone for WebRTC:", err);
      }
    }

    startVoiceCall();

    return () => {
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [socketStatus, isInitiator, sendSignal]);

  // Call timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === "connected") {
      timer = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(timer);
  }, [status]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);
      }
    }
  };

  const toggleDeafen = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !isDeafened;
      setIsDeafened(!isDeafened);
    }
  };

  const handleNext = () => {
    nextStranger();
  };

  const handleEnd = () => {
    disconnect();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 bg-[#09090f] relative overflow-hidden">
      
      {/* Background Neon Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-cyan-600/10 blur-[140px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-1/2 left-1/3 w-[350px] h-[300px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Main Glass Voice Card */}
      <div className="w-full max-w-lg p-8 sm:p-12 rounded-3xl glass-panel border border-cyan-500/20 text-center flex flex-col items-center shadow-2xl glow-cyan relative">
        
        {/* Top Channel tag and User info */}
        <div className="flex flex-wrap items-center justify-between w-full gap-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Anonymous Audio Stream</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs">
            <span className="text-slate-400">You:</span>
            <span className="font-semibold text-white">{myProfile.name || "Anonymous"}</span>
            <span className="text-purple-400 font-mono">({myProfile.age} · {myProfile.gender === "female" ? "♀" : myProfile.gender === "male" ? "♂" : "⚧"})</span>
          </div>
        </div>

        {/* Central Audio Ripple Avatar */}
        <div className="relative w-40 h-40 flex items-center justify-center mb-8">
          {status === "connected" && (
            <>
              <div className="absolute inset-0 rounded-full border border-cyan-400/40 animate-ripple" />
              <div className="absolute inset-0 rounded-full border border-purple-400/30 animate-ripple [animation-delay:0.7s]" />
              <div className="absolute inset-0 rounded-full border border-cyan-400/20 animate-ripple [animation-delay:1.4s]" />
            </>
          )}

          <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-4xl shadow-xl shadow-cyan-500/30 z-10 transition-transform duration-300 hover:scale-105">
            {status === "connected" ? (strangerProfile?.gender === "female" ? "👩" : "👨") : status === "connecting" ? "🔍" : "💤"}
          </div>
        </div>

        {/* Stranger Identity & State */}
        {status === "connected" && strangerProfile ? (
          <div className="mb-2">
            <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
              <span>{strangerProfile.name}</span>
              <span className="text-sm font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300">
                {strangerProfile.age} · {strangerProfile.gender === "female" ? "Female 👩" : strangerProfile.gender === "male" ? "Male 👨" : "Other ✨"}
              </span>
            </h2>
            <p className="text-xs text-emerald-400 font-medium mt-1">Live voice call active</p>
          </div>
        ) : (
          <h2 className="text-2xl font-bold text-white mb-2">
            {status === "connecting" ? "Searching for voice partner..." : "Call Ended"}
          </h2>
        )}

        <div className="flex items-center gap-2 mb-6">
          <span
            className={`w-2 h-2 rounded-full ${
              status === "connected" ? "bg-emerald-400 animate-pulse-dot" : "bg-yellow-400 animate-pulse-dot"
            }`}
          />
          <span className="text-xs text-slate-400 font-mono text-sm">
            {status === "connected" ? formatTime(duration) : status === "connecting" ? "Finding match with matching profile..." : "Click Next to talk"}
          </span>
        </div>

        {/* Dynamic Waveform Bars */}
        {status === "connected" ? (
          <div className="flex items-center justify-center gap-1.5 h-12 mb-8">
            <span className="w-1.5 bg-gradient-to-t from-cyan-500 to-purple-500 rounded-full wave-anim-1" />
            <span className="w-1.5 bg-gradient-to-t from-cyan-500 to-purple-500 rounded-full wave-anim-2" />
            <span className="w-1.5 bg-gradient-to-t from-cyan-500 to-purple-500 rounded-full wave-anim-3" />
            <span className="w-1.5 bg-gradient-to-t from-cyan-500 to-purple-500 rounded-full wave-anim-4" />
            <span className="w-1.5 bg-gradient-to-t from-cyan-500 to-purple-500 rounded-full wave-anim-5" />
            <span className="w-1.5 bg-gradient-to-t from-cyan-500 to-purple-500 rounded-full wave-anim-2" />
            <span className="w-1.5 bg-gradient-to-t from-cyan-500 to-purple-500 rounded-full wave-anim-1" />
          </div>
        ) : (
          <div className="h-12 flex items-center justify-center mb-8 text-xs text-slate-500">
            {status === "connecting" ? "Pairing microphonic frequencies..." : "Microphone on standby"}
          </div>
        )}

        {/* Hidden audio element for real remote WebRTC peer audio */}
        <audio ref={remoteAudioRef} autoPlay />

        {/* Dock Controls */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 p-2.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-md">
          
          {/* Mute Mic */}
          <button
            onClick={toggleMute}
            className={`p-3.5 rounded-full transition cursor-pointer ${
              isMuted
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                : "bg-white/5 hover:bg-white/10 text-slate-200"
            }`}
            title={isMuted ? "Unmute Mic" : "Mute Mic"}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Deaf Speaker */}
          <button
            onClick={toggleDeafen}
            className={`p-3.5 rounded-full transition cursor-pointer ${
              isDeafened
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                : "bg-white/5 hover:bg-white/10 text-slate-200"
            }`}
            title={isDeafened ? "Enable Audio" : "Mute Audio"}
          >
            {isDeafened ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {/* Next Stranger Button */}
          <button
            onClick={handleNext}
            className="px-6 py-3.5 rounded-full font-bold text-sm text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:opacity-95 glow-btn transition flex items-center gap-2 cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
            <span>Next Stranger</span>
          </button>

          {/* End Call */}
          <button
            onClick={handleEnd}
            className="p-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition cursor-pointer"
            title="End Call"
          >
            <PhoneOff className="w-5 h-5" />
          </button>

        </div>

        {/* Bottom Switch to Text */}
        <div className="mt-8 flex items-center justify-between w-full pt-4 border-t border-white/5 text-xs text-slate-400">
          <Link href="/chat" className="hover:text-purple-400 transition flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Prefer text? Switch to Text Chat</span>
          </Link>

          <button
            onClick={() => alert("User reported.")}
            className="hover:text-yellow-400 transition flex items-center gap-1"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Report</span>
          </button>
        </div>

      </div>

    </div>
  );
}
