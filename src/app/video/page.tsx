"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  Camera, 
  CameraOff, 
  Mic, 
  MicOff, 
  RotateCw, 
  PhoneOff, 
  Flag, 
  Ban, 
  MessageSquare,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import confetti from "canvas-confetti";
import { useChatSocket, UserProfile } from "@/hooks/useChatSocket";

export default function VideoPage() {
  const [hasCamPermission, setHasCamPermission] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [autoNext, setAutoNext] = useState(true);
  const [myProfile, setMyProfile] = useState<UserProfile>({
    name: "Anonymous",
    gender: "male",
    age: "22",
  });

  const myVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

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
    mode: "video",
    profile: myProfile,
    autoConnect: true,
    autoNext,
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
        console.warn("Video WebRTC signal error:", err);
      }
    }
  });

  const status = socketStatus === "searching" ? "searching" : socketStatus === "connected" ? "connected" : "ended";

  // Request camera access on mount
  useEffect(() => {
    async function startCam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (myVideoRef.current) {
          myVideoRef.current.srcObject = stream;
        }
        setHasCamPermission(true);
      } catch (err) {
        console.warn("Camera permission not granted:", err);
      }
    }

    startCam();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // When matched, establish PeerConnection
  useEffect(() => {
    async function setupPeer() {
      if (socketStatus !== "connected") {
        if (pcRef.current) {
          pcRef.current.close();
          pcRef.current = null;
        }
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }
        return;
      }

      confetti({ particleCount: 30, spread: 60 });

      try {
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" }
          ]
        });
        pcRef.current = pc;

        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => pc.addTrack(track, streamRef.current!));
        }

        pc.onicecandidate = (e) => {
          if (e.candidate) {
            sendSignal({ candidate: e.candidate });
          }
        };

        pc.ontrack = (e) => {
          if (remoteVideoRef.current && e.streams[0]) {
            remoteVideoRef.current.srcObject = e.streams[0];
          }
        };

        if (isInitiator) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendSignal({ sdp: offer });
        }
      } catch (err) {
        console.warn("WebRTC setup error:", err);
      }
    }

    setupPeer();

    return () => {
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [socketStatus, isInitiator, sendSignal]);

  const toggleCam = () => {
    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCamOff(!videoTrack.enabled);
    }
  };

  const toggleMic = () => {
    if (!streamRef.current) return;
    const audioTrack = streamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  const handleNext = () => {
    nextStranger();
  };

  return (
    <div className="w-full flex flex-col h-[calc(100dvh-104px)] min-h-[540px] shrink-0 overflow-hidden bg-[#07070b]">
      
      {/* Video Screens Split */}
      <div className="flex-1 min-h-0 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-3 p-3 sm:p-4">
        
        {/* Stranger's Video Frame */}
        <div className="relative h-full min-h-0 w-full rounded-2xl bg-[#0f0f18] border border-white/5 overflow-hidden flex items-center justify-center">
          
          {/* Real WebRTC Remote Video Stream */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`absolute inset-0 w-full h-full object-cover ${status === "connected" ? "block" : "hidden"}`}
          />

          {status !== "connected" && (
            <div className="text-center space-y-3 p-6">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-2xl animate-pulse">
                🔍
              </div>
              <h4 className="text-lg font-bold text-white">Searching for video partner...</h4>
              <p className="text-xs text-slate-400">Connecting you with a live online user worldwide</p>
            </div>
          )}

          <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md text-xs font-semibold text-white border border-white/10 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse-dot" />
            <span>Stranger:</span>
            {strangerProfile ? (
              <span className="text-cyan-300 font-bold">
                {strangerProfile.name} ({strangerProfile.age} · {strangerProfile.gender === "female" ? "♀" : strangerProfile.gender === "male" ? "♂" : "⚧"})
              </span>
            ) : (
              <span className="text-slate-400">Finding...</span>
            )}
          </div>
        </div>

        {/* My Video Preview */}
        <div className="relative h-full min-h-0 w-full rounded-2xl bg-[#0f0f18] border border-white/5 overflow-hidden flex items-center justify-center">
          <video
            ref={myVideoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover -scale-x-100 ${isCamOff ? "hidden" : "block"}`}
          />

          {(!hasCamPermission || isCamOff) && (
            <div className="text-center space-y-2 p-6">
              <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mx-auto text-xl text-slate-400">
                <CameraOff className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-300">
                {isCamOff ? "Your camera is turned off" : "Camera access not granted or standby"}
              </p>
            </div>
          )}

          <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md text-xs font-semibold text-white border border-white/10 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span>You:</span>
            <span className="text-purple-300 font-bold">
              {myProfile.name || "Anonymous"} ({myProfile.age} · {myProfile.gender === "female" ? "♀" : myProfile.gender === "male" ? "♂" : "⚧"})
            </span>
          </div>
        </div>

      </div>

      {/* Floating Controls Dock */}
      <div className="h-20 bg-[#0d0d16] border-t border-white/5 px-4 flex items-center justify-center gap-4 shrink-0">
        
        {/* Toggle Cam */}
        <button
          onClick={toggleCam}
          className={`p-3.5 rounded-full transition cursor-pointer ${
            isCamOff
              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
              : "bg-white/5 hover:bg-white/10 text-white"
          }`}
          title={isCamOff ? "Turn Camera On" : "Turn Camera Off"}
        >
          {isCamOff ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
        </button>

        {/* Toggle Mic */}
        <button
          onClick={toggleMic}
          className={`p-3.5 rounded-full transition cursor-pointer ${
            isMuted
              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
              : "bg-white/5 hover:bg-white/10 text-white"
          }`}
          title={isMuted ? "Unmute Mic" : "Mute Mic"}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Next Stranger */}
        <button
          onClick={handleNext}
          className="px-6 py-3.5 rounded-full font-bold text-sm text-white bg-gradient-to-r from-purple-600 to-cyan-500 hover:opacity-95 glow-btn transition flex items-center gap-2 cursor-pointer"
        >
          <RotateCw className="w-4 h-4" />
          <span>Next Stranger</span>
        </button>

        {/* End */}
        <Link
          href="/"
          className="p-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition cursor-pointer"
          title="End Video Chat"
        >
          <PhoneOff className="w-5 h-5" />
        </Link>

        {/* Report */}
        <button
          onClick={() => alert("User reported to moderation.")}
          className="p-3.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-yellow-400 transition"
          title="Report User"
        >
          <Flag className="w-4 h-4" />
        </button>

        {/* Auto-Next on Disconnect Toggle */}
        <label className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-full bg-white/[0.03] border border-white/10 cursor-pointer select-none">
          <span className="text-xs text-slate-300 font-medium">Auto-Next</span>
          <button
            type="button"
            role="switch"
            aria-checked={autoNext}
            onClick={() => setAutoNext((prev) => !prev)}
            className={`w-9 h-5 rounded-full transition-colors p-0.5 cursor-pointer ${
              autoNext ? "bg-emerald-500" : "bg-slate-700"
            }`}
          >
            <span
              className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                autoNext ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </label>

      </div>

    </div>
  );
}
