"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Share2,
  X,
  MessageSquare,
  Smile,
  SmilePlus,
  Square,
  Play,
  Pause,
  ArrowLeft,
  Check
} from "lucide-react";

const CITY_MAP: Record<string, { city: string; state: string }> = {
  "new-delhi":      { city: "New Delhi",          state: "New Delhi · Delhi NCR" },
  "ghaziabad":      { city: "Ghaziabad",          state: "Ghaziabad · Uttar Pradesh" },
  "pune":           { city: "Pune Junction",      state: "Pune · Maharashtra" },
  "solapur":        { city: "Solapur Junction",   state: "Solapur · Maharashtra" },
  "mumbai-cst":     { city: "Mumbai CST",         state: "Mumbai · Maharashtra" },
  "guwahati":       { city: "Guwahati",           state: "Guwahati · Assam" },
  "raipur":         { city: "Raipur Junction",    state: "Raipur · Chhattisgarh" },
  "bhubaneswar":    { city: "Bhubaneswar",        state: "Bhubaneswar · Odisha" },
  "ernakulam":      { city: "Ernakulam Junction", state: "Kochi · Kerala" },
  "new-jalpaiguri": { city: "New Jalpaiguri",     state: "Siliguri · West Bengal" },
  "asansol":        { city: "Asansol Junction",   state: "Asansol · West Bengal" },
  "kozhikode":      { city: "Kozhikode",          state: "Kozhikode · Kerala" },
  "gwalior":        { city: "Gwalior Junction",   state: "Gwalior · Madhya Pradesh" },
  "lucknow":        { city: "Lucknow Charbagh",   state: "Lucknow · Uttar Pradesh" },
  "mathura":        { city: "Mathura Junction",   state: "Mathura · Uttar Pradesh" },
  "tirupati":       { city: "Tirupati",           state: "Tirupati · Andhra Pradesh" },
  "bengaluru":      { city: "Bengaluru City",     state: "Bengaluru · Karnataka" },
  "hyderabad":      { city: "Hyderabad",          state: "Hyderabad · Telangana" },
  "chennai":        { city: "Chennai Central",    state: "Chennai · Tamil Nadu" },
  "kolkata":        { city: "Kolkata",            state: "Kolkata · West Bengal" },
  "jaipur":         { city: "Jaipur Junction",    state: "Jaipur · Rajasthan" },
  "ahmedabad":      { city: "Ahmedabad",          state: "Ahmedabad · Gujarat" },
  "patna":          { city: "Patna Junction",     state: "Patna · Bihar" },
  "chandigarh":     { city: "Chandigarh",         state: "Chandigarh · Punjab" },
};

const AVATAR_COLORS = [
  "bg-[#d96b6b]",
  "bg-[#72a98f]",
  "bg-[#8195b8]",
  "bg-[#b886b6]",
  "bg-[#d4a84f]",
  "bg-[#5ea7a0]",
  "bg-[#d47b50]",
  "bg-[#7d88c4]",
];

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "👏", "🎉", "😍", "💯", "🙏", "😎"];

interface RoomUser {
  id: string;
  name: string;
  color: string;
  isSpeaking?: boolean;
  isMuted?: boolean;
  initial?: string;
}

interface Reaction {
  emoji: string;
  count: number;
  byMe: boolean;
  users: string[];
}

interface ChatMsg {
  id: string;
  sender: "me" | "system" | string;
  senderName?: string;
  senderColor?: string;
  text?: string;
  isVoice?: boolean;
  audioData?: string;
  voiceDuration?: string;
  time: string;
  reactions: Record<string, Reaction>;
}

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function makeSystem(text: string): ChatMsg {
  return {
    id: `sys-${Date.now()}-${Math.random()}`,
    sender: "system",
    text,
    time: nowTime(),
    reactions: {},
  };
}

function useRoomSocket(roomId: string, myName: string, myColor: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [users, setUsers] = useState<RoomUser[]>([]);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [connected, setConnected] = useState(false);
  const myNameRef = useRef(myName);
  const myColorRef = useRef(myColor);
  myNameRef.current = myName;
  myColorRef.current = myColor;

  const onSignalRef = useRef<((fromId: string, data: unknown) => void) | null>(null);

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;
    if (wsRef.current) {
      try { wsRef.current.close(); } catch (_) {}
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: "room-join",
        roomId,
        profile: { name: myNameRef.current, color: myColorRef.current },
      }));
      setConnected(true);
    };

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        switch (data.type) {
          case "room-state":
            setUsers(data.users || []);
            setMessages((prev) => [
              ...prev,
              makeSystem(`Joined ${CITY_MAP[roomId]?.city || roomId} room`),
            ]);
            break;
          case "room-user-joined":
            setUsers((prev) => [...prev.filter((u) => u.id !== data.user.id), data.user]);
            setMessages((prev) => [...prev, makeSystem(`${data.user.name} joined`)]);
            break;
          case "room-user-left":
            setUsers((prev) => prev.filter((u) => u.id !== data.userId));
            setMessages((prev) => [...prev, makeSystem(`${data.userName || "Someone"} left`)]);
            break;
          case "room-message":
            setMessages((prev) => [
              ...prev,
              {
                id: data.msgId || `msg-${Date.now()}-${Math.random()}`,
                sender: data.fromId,
                senderName: data.fromName,
                senderColor: data.fromColor,
                text: data.text,
                time: data.time || nowTime(),
                reactions: {},
              },
            ]);
            break;
          case "room-voice-note":
            setMessages((prev) => [
              ...prev,
              {
                id: data.msgId || `vn-${Date.now()}-${Math.random()}`,
                sender: data.fromId,
                senderName: data.fromName,
                senderColor: data.fromColor,
                isVoice: true,
                audioData: data.audioData,
                voiceDuration: data.voiceDuration,
                time: data.time || nowTime(),
                reactions: {},
              },
            ]);
            break;
          case "room-speaking":
            setUsers((prev) =>
              prev.map((u) => (u.id === data.userId ? { ...u, isSpeaking: data.speaking } : u))
            );
            break;
          case "room-signal":
            if (onSignalRef.current) onSignalRef.current(data.fromId, data.data);
            break;
          case "room-reaction":
            setMessages((prev) =>
              prev.map((msg) => {
                if (msg.id !== data.msgId) return msg;
                const existing = msg.reactions[data.emoji] || {
                  emoji: data.emoji,
                  count: 0,
                  byMe: false,
                  users: [],
                };
                const userList = existing.users.includes(data.fromName)
                  ? existing.users.filter((n) => n !== data.fromName)
                  : [...existing.users, data.fromName];
                const updated = { ...msg.reactions };
                if (userList.length === 0) delete updated[data.emoji];
                else updated[data.emoji] = { ...existing, count: userList.length, users: userList };
                return { ...msg, reactions: updated };
              })
            );
            break;
        }
      } catch (_) {}
    };

    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
  }, [roomId]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  const send = useCallback((payload: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      const time = nowTime();
      const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      send({ type: "room-message", roomId, text, time, msgId: id });
      setMessages((prev) => [...prev, { id, sender: "me", text, time, reactions: {} }]);
    },
    [send, roomId]
  );

  const sendVoiceNote = useCallback(
    (audioData: string, voiceDuration: string) => {
      const time = nowTime();
      const id = `vn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      send({ type: "room-voice-note", roomId, audioData, voiceDuration, time, msgId: id });
      setMessages((prev) => [
        ...prev,
        { id, sender: "me", isVoice: true, audioData, voiceDuration, time, reactions: {} },
      ]);
    },
    [send, roomId]
  );

  const sendSignal = useCallback(
    (toId: string, data: unknown) => {
      send({ type: "room-signal", roomId, toId, data });
    },
    [send, roomId]
  );

  const setSpeaking = useCallback(
    (speaking: boolean) => {
      send({ type: "room-speaking", roomId, speaking });
    },
    [send, roomId]
  );

  const sendReaction = useCallback(
    (msgId: string, emoji: string) => {
      send({ type: "room-reaction", roomId, msgId, emoji });
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== msgId) return msg;
          const existing = msg.reactions[emoji] || { emoji, count: 0, byMe: false, users: [] };
          const updated = { ...msg.reactions };
          if (existing.byMe) {
            const userList = existing.users.filter((n) => n !== myNameRef.current);
            if (userList.length === 0) delete updated[emoji];
            else updated[emoji] = { ...existing, count: userList.length, byMe: false, users: userList };
          } else {
            const userList = [...existing.users, myNameRef.current];
            updated[emoji] = { emoji, count: userList.length, byMe: true, users: userList };
          }
          return { ...msg, reactions: updated };
        })
      );
    },
    [send, roomId]
  );

  const leave = useCallback(() => {
    send({ type: "room-leave", roomId });
    if (wsRef.current) wsRef.current.close();
  }, [send, roomId]);

  return { users, messages, connected, sendMessage, sendVoiceNote, sendSignal, setSpeaking, sendReaction, leave, onSignalRef };
}

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
        a.onerror = () => setPlaying(false);
      } catch {
        return;
      }
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => setPlaying(false));
      setPlaying(true);
    }
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer"
    >
      {playing ? <Pause className="w-3.5 h-3.5 text-white" /> : <Play className="w-3.5 h-3.5 text-white fill-white" />}
      <span className="text-xs text-white/90">Voice Note</span>
      <span className="text-[11px] text-white/50">{duration || "0:05"}</span>
    </button>
  );
}

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = typeof params.roomId === "string" ? params.roomId : "";
  const cityInfo = CITY_MAP[roomId] || { city: roomId, state: "" };

  const [myProfile] = useState(() => {
    if (typeof window === "undefined") return { name: "Noah", color: AVATAR_COLORS[3] };
    try {
      const saved = localStorage.getItem("cs_user_profile");
      if (saved) {
        const p = JSON.parse(saved);
        const name = (p.name || "Noah").trim() || "Noah";
        return { name, color: AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length] };
      }
    } catch (_) {}
    return { name: "Noah", color: AVATAR_COLORS[3] };
  });

  // UI State
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [stageEmojiOpen, setStageEmojiOpen] = useState(false);
  const [floatingEmoji, setFloatingEmoji] = useState<string | null>(null);
  const [activePickerMsgId, setActivePickerMsgId] = useState<string | null>(null);

  // Chat & Voice Notes
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const msgContainerRef = useRef<HTMLDivElement>(null);

  // In-room Voice Call
  const [inVoiceCall, setInVoiceCall] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isDeafened, setIsDeafened] = useState(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudiosRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  const {
    users,
    messages,
    connected,
    sendMessage,
    sendVoiceNote,
    sendSignal,
    setSpeaking,
    sendReaction,
    leave,
    onSignalRef,
  } = useRoomSocket(roomId, myProfile.name, myProfile.color);

  // Track unread messages when chat drawer is closed
  const prevMsgLenRef = useRef(0);
  useEffect(() => {
    if (messages.length > prevMsgLenRef.current) {
      const last = messages[messages.length - 1];
      if (!chatOpen && last && last.sender !== "me" && last.sender !== "system") {
        setUnreadCount((c) => c + 1);
      }
      prevMsgLenRef.current = messages.length;
    }
    const el = msgContainerRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages, chatOpen]);

  useEffect(() => {
    if (chatOpen) setUnreadCount(0);
  }, [chatOpen]);

  // WebRTC signaling
  onSignalRef.current = async (fromId, data: any) => {
    if (!inVoiceCall) return;
    let pc = peerConnections.current.get(fromId);
    if (!pc) pc = createPC(fromId);
    try {
      if (data.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        if (data.sdp.type === "offer") {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignal(fromId, { sdp: answer });
        }
      } else if (data.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    } catch (e) {
      console.warn("RTC error", e);
    }
  };

  function createPC(peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });
    peerConnections.current.set(peerId, pc);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => pc.addTrack(t, localStreamRef.current!));
    }
    pc.onicecandidate = (e) => {
      if (e.candidate) sendSignal(peerId, { candidate: e.candidate });
    };
    pc.ontrack = (e) => {
      let audio = remoteAudiosRef.current.get(peerId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        audio.muted = isDeafened;
        remoteAudiosRef.current.set(peerId, audio);
      }
      audio.srcObject = e.streams[0];
    };
    return pc;
  }

  useEffect(() => {
    if (isRecording) {
      setRecordSecs(0);
      recordTimerRef.current = setInterval(() => setRecordSecs((s) => s + 1), 1000);
    } else if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
    }
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, [isRecording]);

  const startVoiceAndUnmute = async () => {
    if (!inVoiceCall) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;
        for (const user of users) {
          const pc = createPC(user.id);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendSignal(user.id, { sdp: offer });
        }
        const ctx = new AudioContext();
        const analyser = ctx.createAnalyser();
        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 512;
        const buf = new Uint8Array(analyser.frequencyBinCount);
        let wasSpeak = false;
        const checkSpeak = setInterval(() => {
          analyser.getByteFrequencyData(buf);
          const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
          const speaking = avg > 15;
          if (speaking !== wasSpeak) {
            wasSpeak = speaking;
            setSpeaking(speaking);
          }
        }, 200);
        (stream as any)._checkSpeak = checkSpeak;
        setInVoiceCall(true);
        setIsMuted(false);
      } catch {
        alert("Microphone permission is needed to talk in this room.");
      }
      return;
    }

    // Already in voice call -> toggle mute
    if (localStreamRef.current) {
      const nextMuted = !isMuted;
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !nextMuted;
      });
      setIsMuted(nextMuted);
    }
  };

  const toggleDeafen = () => {
    const def = !isDeafened;
    remoteAudiosRef.current.forEach((a) => {
      a.muted = def;
    });
    setIsDeafened(def);
  };

  const handleLeaveRoom = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      const ci = (localStreamRef.current as any)._checkSpeak;
      if (ci) clearInterval(ci);
    }
    peerConnections.current.forEach((pc) => pc.close());
    leave();
    router.push("/chatrooms");
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  const triggerStageReaction = (emoji: string) => {
    setFloatingEmoji(emoji);
    setStageEmojiOpen(false);
    sendMessage(emoji);
    setTimeout(() => setFloatingEmoji(null), 1800);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recordedChunksRef.current = [];
      mr.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
          sendVoiceNote(base64, `0:${recordSecs.toString().padStart(2, "0")}`);
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
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const allParticipants: RoomUser[] = [
    ...users,
    {
      id: "me",
      name: myProfile.name,
      color: myProfile.color,
      isMuted: !inVoiceCall || isMuted,
      isSpeaking: inVoiceCall && !isMuted,
    },
  ];

  return (
    <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-64px)] bg-[#090b0f] p-3 sm:p-6">
      {/* Centered Room Panel (matching reference modal layout) */}
      <div
        className={`w-full ${
          chatOpen ? "max-w-5xl" : "max-w-3xl"
        } h-[78vh] min-h-[520px] bg-[#14171d] border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200`}
      >
        {/* Top Bar */}
        <div className="px-5 py-4 flex items-center justify-between gap-3 border-b border-white/[0.05] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-lg">🚆</span>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-white truncate">
                {cityInfo.city}
              </h1>
              <p className="text-[11px] text-slate-400 truncate">
                {cityInfo.state} · {allParticipants.length}/10 live
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setChatOpen((o) => !o)}
              className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
                chatOpen
                  ? "bg-teal-500/20 border-teal-400/40 text-teal-200"
                  : "bg-[#1e222b] border-white/10 text-slate-200 hover:bg-[#262b36]"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat</span>
              {unreadCount > 0 && !chatOpen && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={handleShare}
              className="px-3.5 py-1.5 rounded-lg bg-[#1e222b] hover:bg-[#262b36] border border-white/10 text-xs font-semibold text-slate-200 transition flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Share"}</span>
            </button>

            <button
              onClick={handleLeaveRoom}
              className="p-1.5 rounded-lg bg-[#1e222b] hover:bg-[#262b36] border border-white/10 text-slate-300 hover:text-white transition cursor-pointer"
              title="Close room"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Body: Voice Stage + Optional Slide-in Group Chat */}
        <div className="flex-1 flex overflow-hidden">
          {/* Voice Stage */}
          <div className="flex-1 relative flex flex-col justify-between p-6 overflow-y-auto">
            {/* Status pill */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-400" : "bg-yellow-400"}`} />
                {inVoiceCall ? "Voice live in this room" : "Tap the mic below to talk in this room"}
              </span>
            </div>

            {/* Participant Cards Grid (exact style of Image 1) */}
            <div className="my-auto py-6 flex flex-wrap items-center justify-center gap-4">
              {allParticipants.map((user) => (
                <div
                  key={user.id}
                  className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-[#1f242d] border flex flex-col items-center justify-center gap-2.5 transition ${
                    user.isSpeaking
                      ? "border-emerald-400/60 shadow-lg shadow-emerald-500/10"
                      : "border-white/[0.06]"
                  }`}
                >
                  {user.isMuted && (
                    <span className="absolute top-2.5 right-2.5 text-rose-400">
                      <MicOff className="w-3.5 h-3.5" />
                    </span>
                  )}

                  <div
                    className={`w-12 h-12 rounded-full ${user.color} flex items-center justify-center text-white font-bold text-lg shadow`}
                  >
                    {(user.initial || user.name[0] || "?").toUpperCase()}
                  </div>

                  <span className="text-xs font-medium text-slate-200 truncate max-w-[90%] px-1">
                    {user.id === "me" ? `${user.name}` : user.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Floating Emoji Animation */}
            {floatingEmoji && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-5xl animate-bounce">
                {floatingEmoji}
              </div>
            )}

            {/* Floating Teal Emoji Button (bottom-right of stage) */}
            <div className="flex justify-end relative">
              {stageEmojiOpen && (
                <div className="absolute bottom-14 right-0 bg-[#1e222b] border border-white/10 rounded-2xl p-2 shadow-xl flex flex-wrap gap-1 w-52 z-20">
                  {QUICK_REACTIONS.map((e) => (
                    <button
                      key={e}
                      onClick={() => triggerStageReaction(e)}
                      className="text-lg p-1.5 rounded-lg hover:bg-white/10 hover:scale-110 transition cursor-pointer"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => setStageEmojiOpen((o) => !o)}
                className="w-11 h-11 rounded-full bg-[#4fb8c4] hover:bg-[#5ec8d4] text-[#0d1117] flex items-center justify-center shadow-lg transition cursor-pointer"
                title="Send quick reaction"
              >
                <Smile className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Slide-in Group Chat Drawer (inside same room) */}
          {chatOpen && (
            <div className="w-full sm:w-80 md:w-96 min-h-0 border-l border-white/[0.06] bg-[#101319] flex flex-col overflow-hidden">
              <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between shrink-0">
                <span className="text-xs font-bold text-slate-200">Room Group Chat</span>
                <button
                  onClick={() => setChatOpen(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div ref={msgContainerRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-3 overscroll-contain">
                {messages.map((msg) => {
                  if (msg.sender === "system") {
                    return (
                      <div key={msg.id} className="text-center">
                        <span className="text-[11px] text-slate-500 bg-white/[0.04] px-2.5 py-0.5 rounded-full">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }
                  const isMe = msg.sender === "me";
                  const reactionList = Object.values(msg.reactions);

                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      <span className="text-[10px] text-slate-400 mb-0.5 px-1">
                        {isMe ? "You" : msg.senderName} · {msg.time}
                      </span>

                      <div className="relative group flex items-center gap-1">
                        {isMe && (
                          <button
                            onClick={() =>
                              setActivePickerMsgId((id) => (id === msg.id ? null : msg.id))
                            }
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-full bg-[#1e222b] text-slate-400 hover:text-white transition cursor-pointer"
                            title="React"
                          >
                            <SmilePlus className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <div
                          className={`px-3 py-2 rounded-xl text-xs max-w-[230px] break-words ${
                            isMe
                              ? "bg-[#2c5e63] text-white rounded-br-sm"
                              : "bg-[#1e222b] text-slate-200 rounded-bl-sm"
                          }`}
                        >
                          {msg.isVoice ? (
                            <VoiceNotePlayer audioData={msg.audioData} duration={msg.voiceDuration} />
                          ) : (
                            <span>{msg.text}</span>
                          )}
                        </div>

                        {!isMe && (
                          <button
                            onClick={() =>
                              setActivePickerMsgId((id) => (id === msg.id ? null : msg.id))
                            }
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-full bg-[#1e222b] text-slate-400 hover:text-white transition cursor-pointer"
                            title="React"
                          >
                            <SmilePlus className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {activePickerMsgId === msg.id && (
                          <div className="absolute bottom-full mb-1 right-0 z-30 bg-[#1e222b] border border-white/10 rounded-xl p-1.5 shadow-xl flex flex-wrap gap-1 w-44">
                            {QUICK_REACTIONS.slice(0, 8).map((e) => (
                              <button
                                key={e}
                                onClick={() => {
                                  sendReaction(msg.id, e);
                                  setActivePickerMsgId(null);
                                }}
                                className="text-sm p-1 rounded hover:bg-white/10 cursor-pointer"
                              >
                                {e}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {reactionList.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {reactionList.map((r) => (
                            <button
                              key={r.emoji}
                              onClick={() => sendReaction(msg.id, r.emoji)}
                              className={`px-1.5 py-0.5 rounded-full text-[10px] border cursor-pointer ${
                                r.byMe
                                  ? "bg-teal-500/20 border-teal-400/40 text-teal-200"
                                  : "bg-white/5 border-white/10 text-slate-300"
                              }`}
                            >
                              {r.emoji} {r.count}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={msgEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-2.5 border-t border-white/[0.06] flex items-center gap-1.5">
                <button
                  onClick={() => (isRecording ? stopRecording() : startRecording())}
                  className={`p-2 rounded-lg transition cursor-pointer ${
                    isRecording
                      ? "bg-rose-500/20 text-rose-400 animate-pulse"
                      : "bg-[#1e222b] text-slate-400 hover:text-white"
                  }`}
                  title={isRecording ? "Stop & send voice note" : "Record voice note"}
                >
                  {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {isRecording ? (
                  <div className="flex-1 text-xs text-rose-300 px-2 font-mono">
                    Recording 0:{recordSecs.toString().padStart(2, "0")}...
                  </div>
                ) : (
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && input.trim()) {
                        sendMessage(input.trim());
                        setInput("");
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[#1a1e26] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400/50"
                  />
                )}

                <button
                  onClick={() => {
                    if (input.trim()) {
                      sendMessage(input.trim());
                      setInput("");
                    }
                  }}
                  disabled={!input.trim() || isRecording}
                  className="p-2 rounded-lg bg-[#4fb8c4] hover:bg-[#5ec8d4] disabled:opacity-40 text-[#0d1117] transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Control Bar (exact style of Image 1) */}
        <div className="px-5 py-3.5 border-t border-white/[0.05] bg-[#12151b] flex items-center justify-between shrink-0">
          {/* Left: Mic Mute / Unmute */}
          <button
            onClick={startVoiceAndUnmute}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition cursor-pointer border ${
              !inVoiceCall || isMuted
                ? "bg-[#222731] border-white/10 text-slate-300 hover:bg-[#2b313d]"
                : "bg-emerald-500/20 border-emerald-400/50 text-emerald-300"
            }`}
            title={!inVoiceCall ? "Join Voice & Unmute" : isMuted ? "Unmute Mic" : "Mute Mic"}
          >
            {!inVoiceCall || isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Center: Speaker */}
          <button
            onClick={toggleDeafen}
            className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
              isDeafened
                ? "text-rose-400 bg-rose-500/10"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            }`}
          >
            {isDeafened ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>Speaker</span>
          </button>

          {/* Right: Leave */}
          <button
            onClick={handleLeaveRoom}
            className="px-4 py-2 rounded-lg bg-[#222731] hover:bg-rose-600/80 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Leave</span>
          </button>
        </div>
      </div>
    </div>
  );
}
