"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Send, 
  Mic, 
  MicOff,
  Square, 
  Video, 
  VideoOff,
  PhoneCall, 
  PhoneOff,
  RotateCw, 
  Flag, 
  Ban, 
  Compass, 
  ShieldCheck, 
  Play,
  Pause,
  User,
  Settings2,
  Sparkles,
  Heart,
  Bot,
  Copy,
  Check
} from "lucide-react";
import confetti from "canvas-confetti";
import { useChatSocket, ChatMessage } from "@/hooks/useChatSocket";

interface Message {
  id: string;
  sender: "me" | "them" | "system";
  text?: string;
  isVoice?: boolean;
  audioData?: string;
  voiceDuration?: string;
  time: string;
}

interface UserProfile {
  name: string;
  gender: string;
  age: string;
  lookingFor?: string;
}

const SAMPLE_STRANGERS: UserProfile[] = [
  { name: "Priya", gender: "female", age: "21" },
  { name: "Aarav", gender: "male", age: "23" },
  { name: "Sneha", gender: "female", age: "20" },
  { name: "Rohan", gender: "male", age: "24" },
  { name: "Ananya", gender: "female", age: "22" },
  { name: "Vikram", gender: "male", age: "25" },
  { name: "Alex", gender: "other", age: "22" },
];

const DEMO_RESPONSES = [
  "Hey! Nice to connect with you! Where are you from? 😊",
  "Nice to meet you! How's your day going?",
  "Haha for real? That's awesome!",
  "What music or games are you into?",
  "Same here! Love meeting cool strangers.",
  "Totally agree with that. Tell me more!",
  "Have you tried the voice call feature here yet? It's pretty fun.",
  "Cool, where in the world are you chatting from?"
];


// ── Voice Note Player Component ──────────────────────────────────
function VoiceNotePlayer({ audioData, duration }: { audioData?: string; duration?: string }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggle = () => {
    if (!audioData) return;
    if (!audioRef.current) {
      try {
        const src = audioData.startsWith("data:") ? audioData : `data:audio/webm;base64,${audioData}`;
        const a = new Audio(src);
        audioRef.current = a;
        a.onended = () => setPlaying(false);
        a.onerror = () => { setPlaying(false); };
      } catch { return; }
    }
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play().catch(() => setPlaying(false)); setPlaying(true); }
  };

  return (
    <button onClick={toggle} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition">
      {playing ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white fill-white" />}
      <span className="text-xs text-white/80">Voice Note</span>
      <span className="text-xs text-white/50">{duration || "0:05"}</span>
    </button>
  );
}

export default function ChatPage() {
  // My Profile state
  const [myProfile, setMyProfile] = useState<UserProfile>({
    name: "Anonymous",
    gender: "male",
    age: "22",
  });
  const [roomId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const requestedRoom = new URLSearchParams(window.location.search).get("room");
    return requestedRoom && /^[a-z0-9-]{1,40}$/.test(requestedRoom) ? requestedRoom : null;
  });
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [chatTimer, setChatTimer] = useState(0);
  const [searchSeconds, setSearchSeconds] = useState(0);
  const [autoNext, setAutoNext] = useState(true);

  // Personal in-chat voice/video call state (stays inside /chat, isolated from /voice & /video pools)
  const [callState, setCallState] = useState<"idle" | "calling" | "incoming" | "in-call">("idle");
  const [callType, setCallType] = useState<"audio" | "video">("audio");
  const [isCallMuted, setIsCallMuted] = useState(false);
  const [isCallCamOff, setIsCallCamOff] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSendingTypingRef = useRef(false);
  const recordIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const callPcRef = useRef<RTCPeerConnection | null>(null);
  const callStreamRef = useRef<MediaStream | null>(null);
  const remoteCallStreamRef = useRef<MediaStream | null>(null);
  const remoteCallAudioRef = useRef<HTMLAudioElement | null>(null);
  const localCallVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteCallVideoRef = useRef<HTMLVideoElement | null>(null);

  // Load user profile from localStorage (shared with voice/video pages)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cs_user_profile");
      if (saved) {
        const parsed = JSON.parse(saved);
        setMyProfile({
          name: parsed.name || "Anonymous",
          gender: parsed.gender || "male",
          age: parsed.age || "22",
          lookingFor: parsed.lookingFor || "any",
        });
      }
    } catch (e) {
      // ignore
    }
  }, []);
  const cleanupCall = () => {
    if (callPcRef.current) {
      callPcRef.current.close();
      callPcRef.current = null;
    }
    if (callStreamRef.current) {
      callStreamRef.current.getTracks().forEach((t) => t.stop());
      callStreamRef.current = null;
    }
    if (remoteCallAudioRef.current) {
      remoteCallAudioRef.current.srcObject = null;
    }
    if (localCallVideoRef.current) {
      localCallVideoRef.current.srcObject = null;
    }
    if (remoteCallVideoRef.current) {
      remoteCallVideoRef.current.srcObject = null;
    }
    remoteCallStreamRef.current = null;
    setCallState("idle");
    setCallType("audio");
    setIsCallMuted(false);
    setIsCallCamOff(false);
  };

  const setupCallPeerConnection = async (sendOffer: boolean, withVideo: boolean) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: withVideo });
    callStreamRef.current = stream;

    if (withVideo && localCallVideoRef.current) {
      localCallVideoRef.current.srcObject = stream;
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
      ]
    });
    callPcRef.current = pc;

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({ kind: "call-ice", candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      remoteCallStreamRef.current = event.streams[0];
      if (remoteCallAudioRef.current) {
        remoteCallAudioRef.current.srcObject = event.streams[0];
      }
      if (remoteCallVideoRef.current) {
        remoteCallVideoRef.current.srcObject = event.streams[0];
      }
    };

    if (sendOffer) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal({ kind: "call-sdp", sdp: offer, withVideo });
    }
  };

  // Real-time WebSocket Omegle hook
  const {
    status,
    partnerProfile: strangerProfile,
    messages,
    isPartnerTyping: isTyping,
    sendMessage,
    sendVoiceNote,
    sendTyping,
    sendSignal,
    nextStranger,
    disconnect
  } = useChatSocket({
    mode: "text",
    profile: myProfile,
    roomId,
    autoConnect: true,
    autoNext,
    onSignal: async (data) => {
      try {
        if (data?.kind === "call-request") {
          setCallType(data.withVideo ? "video" : "audio");
          setCallState("incoming");
        } else if (data?.kind === "call-accept") {
          const isVid = !!data.withVideo;
          setCallType(isVid ? "video" : "audio");
          setCallState("in-call");
          await setupCallPeerConnection(true, isVid);
        } else if (data?.kind === "call-reject" || data?.kind === "call-end") {
          cleanupCall();
        } else if (data?.kind === "call-sdp") {
          const isVid = !!data.withVideo || callType === "video";
          if (!callPcRef.current) {
            await setupCallPeerConnection(false, isVid);
          }
          if (!callPcRef.current) return;
          await callPcRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
          if (data.sdp.type === "offer") {
            const answer = await callPcRef.current.createAnswer();
            await callPcRef.current.setLocalDescription(answer);
            sendSignal({ kind: "call-sdp", sdp: answer, withVideo: isVid });
          }
        } else if (data?.kind === "call-ice" && callPcRef.current) {
          await callPcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (err) {
        console.warn("In-chat call signal error:", err);
      }
    }
  });

  // Bind local/remote video streams reliably after <video> elements mount
  useEffect(() => {
    if (callState === "in-call" && callType === "video") {
      if (localCallVideoRef.current && callStreamRef.current) {
        localCallVideoRef.current.srcObject = callStreamRef.current;
      }
      if (remoteCallVideoRef.current && remoteCallStreamRef.current) {
        remoteCallVideoRef.current.srcObject = remoteCallStreamRef.current;
      }
    }
  }, [callState, callType]);

  // Clean up personal voice/video call and typing timer if chat disconnects or partner changes
  useEffect(() => {
    if (status !== "connected") {
      cleanupCall();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      isSendingTypingRef.current = false;
    }
  }, [status]);

  const startInChatCall = (withVideo: boolean) => {
    if (status !== "connected") return;
    setCallType(withVideo ? "video" : "audio");
    setCallState("calling");
    sendSignal({ kind: "call-request", withVideo });
  };

  const acceptInChatCall = async () => {
    const isVid = callType === "video";
    try {
      setCallState("in-call");
      await setupCallPeerConnection(false, isVid);
      sendSignal({ kind: "call-accept", withVideo: isVid });
    } catch {
      alert(isVid ? "Camera & microphone access is required for video call." : "Microphone access is required for voice call.");
      rejectInChatCall();
    }
  };

  const rejectInChatCall = () => {
    sendSignal({ kind: "call-reject" });
    cleanupCall();
  };

  const endInChatCall = () => {
    sendSignal({ kind: "call-end" });
    cleanupCall();
  };

  const toggleCallMute = () => {
    if (callStreamRef.current) {
      const nextMuted = !isCallMuted;
      callStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !nextMuted;
      });
      setIsCallMuted(nextMuted);
    }
  };

  const toggleCallCam = () => {
    if (callStreamRef.current) {
      const nextOff = !isCallCamOff;
      callStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = !nextOff;
      });
      setIsCallCamOff(nextOff);
    }
  };

  // Confetti on match
  useEffect(() => {
    if (status === "connected") {
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } });
    }
  }, [status]);

  // Track searching seconds for alone tip
  useEffect(() => {
    let t: NodeJS.Timeout;
    if (status === "searching") {
      t = setInterval(() => {
        setSearchSeconds(s => s + 1);
      }, 1000);
    } else {
      setSearchSeconds(0);
    }
    return () => clearInterval(t);
  }, [status]);

  // Lock outer document scroll & sync height with mobile visualViewport so header/call bar never scroll off-screen
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevHtmlHeight = html.style.height;
    const prevHtmlScrollBehavior = html.style.scrollBehavior;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyHeight = body.style.height;
    const prevBodyOverscroll = body.style.overscrollBehavior;

    html.style.overflow = "hidden";
    html.style.height = "100%";
    html.style.scrollBehavior = "auto";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";

    const syncViewport = () => {
      const vv = window.visualViewport;
      const height = vv ? vv.height : window.innerHeight;
      body.style.height = `${Math.round(height)}px`;
      if (window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }
      const el = messagesContainerRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    };

    syncViewport();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", syncViewport);
    vv?.addEventListener("scroll", syncViewport);
    window.addEventListener("resize", syncViewport);

    return () => {
      vv?.removeEventListener("resize", syncViewport);
      vv?.removeEventListener("scroll", syncViewport);
      window.removeEventListener("resize", syncViewport);
      html.style.overflow = prevHtmlOverflow;
      html.style.height = prevHtmlHeight;
      html.style.scrollBehavior = prevHtmlScrollBehavior;
      body.style.overflow = prevBodyOverflow;
      body.style.height = prevBodyHeight;
      body.style.overscrollBehavior = prevBodyOverscroll;
    };
  }, []);

  // Auto scroll inner messages container only (prevents outer page jump)
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (el) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }, [messages, isTyping]);

  // Chat Duration Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === "connected") {
      interval = setInterval(() => {
        setChatTimer((prev) => prev + 1);
      }, 1000);
    } else {
      setChatTimer(0);
    }
    return () => clearInterval(interval);
  }, [status]);

  // Voice recording timer
  useEffect(() => {
    if (isRecording) {
      setRecordSeconds(0);
      recordIntervalRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    }
    return () => {
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    };
  }, [isRecording]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getGenderEmoji = (g?: string) => {
    if (g === "male") return "👨 Male";
    if (g === "female") return "👩 Female";
    if (g === "other") return "🌈 Other";
    return "👤 Any";
  };

  // Find or Skip stranger
  const handleFindOrSkip = () => {
    if (status === "connected" || status === "disconnected") {
      nextStranger();
    } else if (status === "searching") {
      disconnect();
    }
  };

  // Send text message
  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text) return;

    if (status !== "connected") {
      alert("Waiting for a live stranger to connect before sending messages!");
      return;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (isSendingTypingRef.current) {
      isSendingTypingRef.current = false;
      sendTyping(false);
    }

    sendMessage(text);
    setInput("");
    inputRef.current?.focus();
  };

  // Handle typing debounce (avoids spamming WebSocket & flickering typing indicator)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);

    if (!val.trim()) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (isSendingTypingRef.current) {
        isSendingTypingRef.current = false;
        sendTyping(false);
      }
      return;
    }

    if (!isSendingTypingRef.current) {
      isSendingTypingRef.current = true;
      sendTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      isSendingTypingRef.current = false;
      sendTyping(false);
      typingTimeoutRef.current = null;
    }, 2000);
  };

  // Send voice note (real MediaRecorder for actual audio playback)
  const handleSendVoiceNote = async () => {
    if (!isRecording) {
      if (status !== "connected") {
        alert("Connect with a stranger first before sending voice notes!");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
        recordedChunksRef.current = [];
        mr.ondataavailable = (e: BlobEvent) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
        mr.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: "audio/webm" });
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(",")[1];
            const dur = `0:${recordSeconds.toString().padStart(2, "0")}`;
            sendVoiceNote(base64, dur);
          };
          reader.readAsDataURL(blob);
          stream.getTracks().forEach((t) => t.stop());
        };
        mr.start();
        mediaRecorderRef.current = mr;
        setIsRecording(true);
      } catch {
        alert("Microphone access required to record voice notes.");
      }
    } else {
      setIsRecording(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    }
  };

  // Save profile updates
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("cs_user_profile", JSON.stringify(myProfile));
    setEditProfileOpen(false);
    nextStranger();
  };

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden bg-[#09090f]">

      {/* Mobile Compact Control Strip (keeps 85%+ screen for chat on phones) */}
      <div className="md:hidden bg-[#0d0d16] border-b border-white/5 px-3 py-2 flex items-center justify-between gap-2 shrink-0">
        <button
          onClick={handleFindOrSkip}
          className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            status === "connected"
              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
              : status === "searching"
              ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
              : "bg-gradient-to-r from-purple-600 to-cyan-500 text-white"
          }`}
        >
          <RotateCw className={`w-3.5 h-3.5 ${status === "searching" ? "animate-spin" : ""}`} />
          <span>{status === "connected" ? "Skip" : status === "searching" ? "Cancel" : "Find"}</span>
        </button>

        <label className="flex items-center gap-1.5 text-[11px] text-slate-300 font-medium cursor-pointer select-none whitespace-nowrap">
          <span>Auto-Next</span>
          <button
            type="button"
            role="switch"
            aria-checked={autoNext}
            onClick={() => setAutoNext((prev) => !prev)}
            className={`w-8 h-4.5 rounded-full transition-colors p-0.5 cursor-pointer ${
              autoNext ? "bg-emerald-500" : "bg-slate-700"
            }`}
          >
            <span
              className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                autoNext ? "translate-x-3.5" : "translate-x-0"
              }`}
            />
          </button>
        </label>

        <button
          onClick={() => setEditProfileOpen(true)}
          className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer whitespace-nowrap"
          title="Edit Profile"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Profile</span>
        </button>
      </div>

      {/* Desktop Sidebar Controls */}
      <aside className="hidden md:flex w-80 bg-[#0d0d16] border-r border-white/5 p-5 flex-col gap-4 shrink-0 overflow-y-auto">
        
        {/* User's Identity Card (Name, Age, Gender) */}
        <div className="p-3.5 rounded-2xl glass-panel border border-purple-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
              Your Profile
            </span>
            <button
              onClick={() => setEditProfileOpen(true)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
              title="Edit Name, Age or Gender"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {myProfile.gender === "female" ? "👩" : myProfile.gender === "other" ? "🌈" : "👨"}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>{myProfile.name || "Anonymous"}</span>
                <span className="text-xs text-purple-300 font-normal">({myProfile.age} yrs)</span>
              </h4>
              <span className="text-[11px] text-slate-400 block">
                {getGenderEmoji(myProfile.gender)}
              </span>
            </div>
          </div>
        </div>

        {roomId && status !== "disconnected" && (
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 text-xs text-cyan-200">
            Topic room: <span className="font-semibold">{roomId}</span> · one-to-one matching
          </div>
        )}

        {/* Connection Widget */}
        <div className="p-4 rounded-2xl glass-panel space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Chat Status</span>
            <span
              className={`font-semibold flex items-center gap-1.5 ${
                status === "connected"
                  ? "text-emerald-400"
                  : status === "searching"
                  ? "text-yellow-400"
                  : "text-slate-500"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  status === "connected"
                    ? "bg-emerald-400 animate-pulse-dot"
                    : status === "searching"
                    ? "bg-yellow-400 animate-pulse-dot"
                    : "bg-slate-600"
                }`}
              />
              {status === "connected" ? "Connected" : status === "searching" ? "Searching..." : "Not Connected"}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Session Time</span>
            <span className="font-mono text-slate-200">{formatTimer(chatTimer)}</span>
          </div>

          <button
            onClick={handleFindOrSkip}
            className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              status === "connected"
                ? "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30"
                : status === "searching"
                ? "bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 border border-yellow-500/30"
                : "bg-gradient-to-r from-purple-600 to-cyan-500 text-white glow-btn"
            }`}
          >
            <RotateCw className={`w-4 h-4 ${status === "searching" ? "animate-spin" : ""}`} />
            <span>
              {status === "connected" ? "Skip to Next Stranger" : status === "searching" ? "Cancel Search" : "Find Stranger"}
            </span>
          </button>

          {/* Auto-Next on Disconnect Toggle */}
          <label className="flex items-center justify-between pt-2 border-t border-white/5 cursor-pointer select-none">
            <span className="text-xs text-slate-300 font-medium">Auto-Next on Disconnect</span>
            <button
              type="button"
              role="switch"
              aria-checked={autoNext}
              onClick={() => setAutoNext((prev) => !prev)}
              className={`w-10 h-5 rounded-full transition-colors p-0.5 cursor-pointer ${
                autoNext ? "bg-emerald-500" : "bg-slate-700"
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                  autoNext ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </label>
        </div>

        {/* Quick Channels Switch */}
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block px-1">
            Switch Mode
          </span>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/voice"
              className="p-3 rounded-xl bg-cyan-950/20 hover:bg-cyan-950/40 border border-cyan-500/20 text-cyan-300 flex items-center gap-2 text-xs font-semibold transition"
            >
              <PhoneCall className="w-4 h-4 text-cyan-400" />
              <span>Voice Call</span>
            </Link>
            <Link
              href="/video"
              className="p-3 rounded-xl bg-purple-950/20 hover:bg-purple-950/40 border border-purple-500/20 text-purple-300 flex items-center gap-2 text-xs font-semibold transition"
            >
              <Video className="w-4 h-4 text-purple-400" />
              <span>Video Cam</span>
            </Link>
          </div>
        </div>

        {/* Community Rooms shortcut */}
        <div className="mt-auto pt-4 border-t border-white/5 space-y-2">
          <Link
            href="/rooms"
            className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 text-xs text-slate-300 transition"
          >
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-purple-400" />
              <span>Browse Topic Rooms</span>
            </div>
            <span className="text-[10px] text-purple-400 font-bold">&rarr;</span>
          </Link>

          <Link
            href="/safety"
            className="flex items-center gap-2 p-2 rounded-lg text-xs text-slate-500 hover:text-slate-300 transition"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Community Rules &amp; Safety</span>
          </Link>
        </div>

      </aside>

      {/* Main Chat Canvas */}
      <main className="flex-1 min-h-0 flex flex-col h-full bg-[#0a0a10] overflow-hidden">
        
        {/* Chat Topbar with Stranger's Name, Age & Gender Badge */}
        <header className="h-14 sm:h-16 px-3 sm:px-6 border-b border-white/5 bg-[#0d0d16] md:bg-[#0d0d16]/80 md:backdrop-blur-md flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-md shadow-purple-600/30 shrink-0">
              {strangerProfile?.gender === "female" ? "👩" : strangerProfile?.gender === "other" ? "🌈" : "👤"}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5 min-w-0">
                <span className="truncate">{strangerProfile ? strangerProfile.name : "Stranger"}</span>
                {status === "connected" && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0">
                    Online
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                {strangerProfile
                  ? `${strangerProfile.age} yrs · ${getGenderEmoji(strangerProfile.gender)} · Private`
                  : "Tap Find to connect"}
              </p>
            </div>
          </div>

          {/* Quick Header Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {status === "connected" && callState === "idle" && (
              <>
                <button
                  onClick={() => startInChatCall(false)}
                  className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                  title="Personal Voice Call inside this chat (stays in chat)"
                >
                  <PhoneCall className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Voice Call</span>
                  <span className="sm:hidden">Call</span>
                </button>
                {!roomId && (
                  <button
                    onClick={() => startInChatCall(true)}
                    className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                    title="Personal Video Call inside this random chat (stays in chat)"
                  >
                    <Video className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline">Video Call</span>
                    <span className="sm:hidden">Video</span>
                  </button>
                )}
              </>
            )}

            {callState === "calling" && (
              <button
                onClick={endInChatCall}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/30 text-yellow-300 text-xs font-semibold transition cursor-pointer animate-pulse whitespace-nowrap"
                title="Cancel Call"
              >
                <PhoneOff className="w-3.5 h-3.5 shrink-0" />
                <span>{callType === "video" ? "Video Calling..." : "Calling..."}</span>
              </button>
            )}

            {callState === "in-call" && (
              <button
                onClick={endInChatCall}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                title="End Call"
              >
                <PhoneOff className="w-3.5 h-3.5 shrink-0" />
                <span>End</span>
              </button>
            )}

            <button
              onClick={() => alert("User has been reported to moderation. Thank you for keeping TalkToStranger safe.")}
              className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-yellow-400 hover:bg-white/5 transition"
              title="Report User"
            >
              <Flag className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                alert("User blocked.");
                handleFindOrSkip();
              }}
              className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 transition"
              title="Block User"
            >
              <Ban className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Hidden audio element for personal in-chat WebRTC voice call */}
        <audio ref={remoteCallAudioRef} autoPlay />

        {/* Incoming / Active Personal In-Chat Voice & Video Call Banner */}
        {callState === "incoming" && (
          <div className="px-4 sm:px-6 py-2.5 bg-emerald-950/50 border-b border-emerald-500/30 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs text-emerald-200 font-semibold">
              {callType === "video" ? (
                <Video className="w-4 h-4 text-purple-400 animate-bounce shrink-0" />
              ) : (
                <PhoneCall className="w-4 h-4 text-emerald-400 animate-bounce shrink-0" />
              )}
              <span>
                {strangerProfile?.name || "Stranger"} is calling you (Private in-chat {callType === "video" ? "video" : "voice"} call)
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={acceptInChatCall}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition"
              >
                Accept
              </button>
              <button
                onClick={rejectInChatCall}
                className="px-3 py-1 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer transition"
              >
                Decline
              </button>
            </div>
          </div>
        )}

        {callState === "in-call" && callType === "video" && (
          <div className="p-2.5 sm:p-3 bg-[#0d0d16] border-b border-purple-500/20 shrink-0 space-y-2">
            <div className="grid grid-cols-2 gap-2 h-52 sm:h-64">
              <div className="relative rounded-xl bg-black border border-white/10 overflow-hidden">
                <video
                  ref={remoteCallVideoRef}
                  autoPlay
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-cyan-300 font-semibold">
                  {strangerProfile?.name || "Stranger"}
                </span>
              </div>
              <div className="relative rounded-xl bg-black border border-white/10 overflow-hidden">
                <video
                  ref={localCallVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute inset-0 w-full h-full object-cover -scale-x-100 ${isCallCamOff ? "hidden" : "block"}`}
                />
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-purple-300 font-semibold">
                  You
                </span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={toggleCallMute}
                className={`px-3 py-1 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition ${
                  isCallMuted ? "bg-rose-500/20 text-rose-300" : "bg-white/10 text-slate-200 hover:bg-white/15"
                }`}
              >
                {isCallMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isCallMuted ? "Muted" : "Mic On"}</span>
              </button>
              <button
                onClick={toggleCallCam}
                className={`px-3 py-1 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition ${
                  isCallCamOff ? "bg-rose-500/20 text-rose-300" : "bg-white/10 text-slate-200 hover:bg-white/15"
                }`}
              >
                {isCallCamOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                <span>{isCallCamOff ? "Cam Off" : "Cam On"}</span>
              </button>
              <button
                onClick={endInChatCall}
                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer transition"
              >
                End Video
              </button>
            </div>
          </div>
        )}

        {callState === "in-call" && callType === "audio" && (
          <div className="px-4 sm:px-6 py-2 bg-emerald-950/40 border-b border-emerald-500/20 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs text-emerald-300 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot" />
              <span>Private voice call active with {strangerProfile?.name || "Stranger"}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleCallMute}
                className={`p-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition ${
                  isCallMuted ? "bg-rose-500/20 text-rose-300" : "bg-white/10 text-slate-200 hover:bg-white/15"
                }`}
                title={isCallMuted ? "Unmute Mic" : "Mute Mic"}
              >
                {isCallMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isCallMuted ? "Muted" : "Mic On"}</span>
              </button>
              <button
                onClick={endInChatCall}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer transition"
              >
                End
              </button>
            </div>
          </div>
        )}

        {/* Messages Stream */}
        <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain">
          {messages.map((msg) => {
            if (msg.sender === "system") {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="px-4 py-2 rounded-full bg-purple-950/30 border border-purple-500/20 text-xs text-purple-300 text-center max-w-lg shadow-sm">
                    {msg.text}
                  </div>
                </div>
              );
            }

            const isMe = msg.sender === "me";

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                
                {/* Sender badge */}
                <span className="text-[10px] text-slate-400 mb-1 px-1">
                  {isMe ? `${myProfile.name} (You)` : strangerProfile?.name || "Stranger"}
                </span>

                <div
                  className={`max-w-[85%] sm:max-w-md p-3.5 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? "bg-purple-600 text-white rounded-br-none shadow-md shadow-purple-600/20"
                      : "bg-[#161624] text-slate-200 border border-white/5 rounded-bl-none"
                  }`}
                >
                  {msg.isVoice ? (
                    <VoiceNotePlayer audioData={msg.text} duration={msg.voiceDuration} />
                  ) : (
                    <span>{msg.text}</span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.time}</span>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-[#161624] border border-white/5 w-fit">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.4s]" />
              <span className="text-[11px] text-slate-400 ml-1.5">{strangerProfile?.name || "Stranger"} is typing...</span>
            </div>
          )}

          {/* Searching Status Card */}
          {status === "searching" && (
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-purple-950/20 border border-purple-500/20 text-center max-w-md mx-auto space-y-3 my-4">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-xl text-purple-400 animate-spin">
                🔍
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Searching for an online stranger...</h4>
                <p className="text-xs text-slate-400 mt-1">
                  You are in the live queue. As soon as another user joins from anywhere, you will connect instantly!
                </p>
              </div>

              {searchSeconds >= 3 && (
                <div className="pt-3 border-t border-white/5 w-full space-y-2 text-left">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Want to test real matching right now?</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Open a 2nd tab or Incognito window at <code className="text-cyan-200 bg-white/5 px-1 py-0.5 rounded font-mono">http://localhost:3000/chat</code> with a different name. Both tabs will instantly connect to each other!
                  </p>
                </div>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 sm:p-4 border-t border-white/5 bg-[#0d0d16] shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-4xl mx-auto">
            
            {/* Voice Note Button */}
            <button
              type="button"
              onClick={handleSendVoiceNote}
              className={`p-3 rounded-xl transition cursor-pointer shrink-0 ${
                isRecording
                  ? "bg-rose-500 text-white animate-pulse"
                  : "bg-white/5 hover:bg-white/10 text-cyan-400 hover:text-cyan-300"
              }`}
              title={isRecording ? "Click to send voice note" : "Record voice note"}
            >
              {isRecording ? <Square className="w-5 h-5 fill-white" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* If recording voice note, show recording UI */}
            {isRecording ? (
              <div className="flex-1 flex items-center justify-between px-4 py-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  Recording voice note...
                </span>
                <span className="font-mono font-bold">0:{recordSeconds.toString().padStart(2, "0")}</span>
              </div>
            ) : (
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder={status === "connected" ? `Message ${strangerProfile?.name || "Stranger"}... (Press Enter)` : "Find a stranger first to start chatting..."}
                disabled={status !== "connected"}
                className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-[#141420] border border-white/5 text-white placeholder-slate-500 text-base sm:text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors disabled:opacity-50"
              />
            )}

            {/* Send Button */}
            <button
              type="submit"
              onMouseDown={(e) => e.preventDefault()}
              disabled={status !== "connected" || !input.trim()}
              className="p-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:opacity-90 disabled:opacity-40 text-white transition-opacity glow-btn cursor-pointer shrink-0"
              title="Send"
            >
              <Send className="w-5 h-5" />
            </button>

          </form>
        </div>

      </main>

      {/* Edit Profile Modal */}
      {editProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-2xl glass-panel border border-purple-500/30 text-left space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-purple-400" />
              <span>Update Your Chat Profile</span>
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Your Name / Nickname</label>
                <input
                  type="text"
                  value={myProfile.name}
                  onChange={(e) => setMyProfile({ ...myProfile, name: e.target.value })}
                  maxLength={25}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Your Age (18+)</label>
                <select
                  value={myProfile.age}
                  onChange={(e) => setMyProfile({ ...myProfile, age: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-sm cursor-pointer"
                >
                  {Array.from({ length: 43 }, (_, i) => i + 18).map((num) => (
                    <option key={num} value={num} className="bg-[#12121e]">
                      {num} years old
                    </option>
                  ))}
                  <option value="60+" className="bg-[#12121e]">60+ years</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Your Gender</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "male", label: "Male 👨" },
                    { id: "female", label: "Female 👩" },
                    { id: "other", label: "Other 🌈" },
                  ].map((g) => (
                    <button
                      type="button"
                      key={g.id}
                      onClick={() => setMyProfile({ ...myProfile, gender: g.id })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium border ${
                        myProfile.gender === g.id
                          ? "bg-purple-600 border-purple-400 text-white"
                          : "bg-white/5 border-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-purple-600 to-cyan-500 glow-btn"
                >
                  Save Profile
                </button>
                <button
                  type="button"
                  onClick={() => setEditProfileOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-white/5"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
