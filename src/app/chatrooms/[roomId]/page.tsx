"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Mic, MicOff, Volume2, VolumeX, Send,
  Phone, PhoneOff, Users, MapPin, MessageSquare,
  Radio, Square, Play, Pause, SmilePlus, X
} from "lucide-react";

// ─────────────────────────────────────────────
// City metadata
// ─────────────────────────────────────────────
const CITY_MAP: Record<string, { city: string; state: string }> = {
  "new-delhi":       { city: "New Delhi",          state: "Delhi NCR" },
  "ghaziabad":      { city: "Ghaziabad",           state: "Uttar Pradesh" },
  "mumbai-cst":     { city: "Mumbai CST",          state: "Mumbai · Maharashtra" },
  "pune":           { city: "Pune Junction",       state: "Pune · Maharashtra" },
  "bengaluru":      { city: "Bengaluru City",      state: "Karnataka" },
  "hyderabad":      { city: "Hyderabad",           state: "Telangana" },
  "chennai":        { city: "Chennai Central",     state: "Tamil Nadu" },
  "kolkata":        { city: "Kolkata",             state: "West Bengal" },
  "guwahati":       { city: "Guwahati",            state: "Guwahati · Assam" },
  "ernakulam":      { city: "Ernakulam Junction",  state: "Kochi · Kerala" },
  "kozhikode":      { city: "Kozhikode",           state: "Kozhikode · Kerala" },
  "mathura":        { city: "Mathura Junction",    state: "Mathura · Uttar Pradesh" },
  "solapur":        { city: "Solapur Junction",    state: "Solapur · Maharashtra" },
  "raipur":         { city: "Raipur Junction",     state: "Raipur · Chhattisgarh" },
  "bhubaneswar":    { city: "Bhubaneswar",         state: "Bhubaneswar · Odisha" },
  "new-jalpaiguri": { city: "New Jalpaiguri",      state: "Siliguri · West Bengal" },
  "asansol":        { city: "Asansol Junction",    state: "Asansol · West Bengal" },
  "gwalior":        { city: "Gwalior Junction",    state: "Gwalior · Madhya Pradesh" },
  "lucknow":        { city: "Lucknow Charbagh",    state: "Lucknow · Uttar Pradesh" },
  "tirupati":       { city: "Tirupati",            state: "Tirupati · Andhra Pradesh" },
  "jaipur":         { city: "Jaipur Junction",     state: "Jaipur · Rajasthan" },
  "ahmedabad":      { city: "Ahmedabad",           state: "Ahmedabad · Gujarat" },
  "patna":          { city: "Patna Junction",      state: "Patna · Bihar" },
  "chandigarh":     { city: "Chandigarh",          state: "Chandigarh · Punjab" },
};

const COLORS = [
  "bg-red-500","bg-orange-500","bg-amber-500","bg-yellow-500","bg-lime-500",
  "bg-green-500","bg-emerald-500","bg-teal-500","bg-cyan-500","bg-sky-500",
  "bg-blue-500","bg-indigo-500","bg-violet-500","bg-purple-500","bg-fuchsia-500",
  "bg-pink-500","bg-rose-500",
];

// Quick reactions list
const QUICK_REACTIONS = ["👍","❤️","😂","😮","😢","🔥","👏","🎉","😍","💯","🙏","😎"];

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface RoomUser {
  id: string;
  name: string;
  color: string;
  isSpeaking?: boolean;
  initial?: string;
}

interface Reaction {
  emoji: string;
  count: number;
  byMe: boolean;
  users: string[]; // names who reacted
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
  reactions: Record<string, Reaction>; // emoji → Reaction
}

// ─────────────────────────────────────────────
// Hook: Room WebSocket
// ─────────────────────────────────────────────
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
    if (wsRef.current) { try { wsRef.current.close(); } catch (_) {} }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: "room-join",
        roomId,
        profile: { name: myNameRef.current, color: myColorRef.current }
      }));
      setConnected(true);
    };

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        switch (data.type) {
          case "room-state":
            setUsers(data.users || []);
            setMessages(prev => [
              ...prev,
              makeSystem(`🏙️ Joined ${data.cityName || "room"} — say hi!`)
            ]);
            break;
          case "room-user-joined":
            setUsers(prev => [...prev.filter(u => u.id !== data.user.id), data.user]);
            setMessages(prev => [...prev, makeSystem(`${data.user.name} joined the room 👋`)]);
            break;
          case "room-user-left":
            setUsers(prev => prev.filter(u => u.id !== data.userId));
            setMessages(prev => [...prev, makeSystem(`${data.userName || "Someone"} left the room`)]);
            break;
          case "room-message":
            setMessages(prev => [...prev, {
              id: data.msgId || `msg-${Date.now()}-${Math.random()}`,
              sender: data.fromId,
              senderName: data.fromName,
              senderColor: data.fromColor,
              text: data.text,
              time: data.time || nowTime(),
              reactions: {}
            }]);
            break;
          case "room-voice-note":
            setMessages(prev => [...prev, {
              id: data.msgId || `vn-${Date.now()}-${Math.random()}`,
              sender: data.fromId,
              senderName: data.fromName,
              senderColor: data.fromColor,
              isVoice: true,
              audioData: data.audioData,
              voiceDuration: data.voiceDuration,
              time: data.time || nowTime(),
              reactions: {}
            }]);
            break;
          case "room-speaking":
            setUsers(prev => prev.map(u => u.id === data.userId ? { ...u, isSpeaking: data.speaking } : u));
            break;
          case "room-signal":
            if (onSignalRef.current) onSignalRef.current(data.fromId, data.data);
            break;
          case "room-reaction":
            setMessages(prev => prev.map(msg => {
              if (msg.id !== data.msgId) return msg;
              const existing = msg.reactions[data.emoji] || { emoji: data.emoji, count: 0, byMe: false, users: [] };
              const userList = existing.users.includes(data.fromName)
                ? existing.users.filter(n => n !== data.fromName)
                : [...existing.users, data.fromName];
              const newCount = userList.length;
              const updated = { ...msg.reactions };
              if (newCount === 0) delete updated[data.emoji];
              else updated[data.emoji] = { emoji: data.emoji, count: newCount, byMe: existing.byMe, users: userList };
              return { ...msg, reactions: updated };
            }));
            break;
        }
      } catch (_) {}
    };

    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
  }, [roomId]);

  useEffect(() => {
    connect();
    return () => { if (wsRef.current) wsRef.current.close(); };
  }, [connect]);

  const send = useCallback((payload: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  const sendMessage = useCallback((text: string) => {
    const time = nowTime();
    const id = `msg-${Date.now()}-me`;
    send({ type: "room-message", roomId, text, time, msgId: id });
    setMessages(prev => [...prev, { id, sender: "me", text, time, reactions: {} }]);
  }, [send, roomId]);

  const sendVoiceNote = useCallback((audioData: string, voiceDuration: string) => {
    const time = nowTime();
    const id = `vn-${Date.now()}-me`;
    send({ type: "room-voice-note", roomId, audioData, voiceDuration, time, msgId: id });
    setMessages(prev => [...prev, { id, sender: "me", isVoice: true, audioData, voiceDuration, time, reactions: {} }]);
  }, [send, roomId]);

  const sendSignal = useCallback((toId: string, data: unknown) => {
    send({ type: "room-signal", roomId, toId, data });
  }, [send, roomId]);

  const setSpeaking = useCallback((speaking: boolean) => {
    send({ type: "room-speaking", roomId, speaking });
  }, [send, roomId]);

  const sendReaction = useCallback((msgId: string, emoji: string) => {
    send({ type: "room-reaction", roomId, msgId, emoji });
    // Optimistic update for "me"
    setMessages(prev => prev.map(msg => {
      if (msg.id !== msgId) return msg;
      const existing = msg.reactions[emoji] || { emoji, count: 0, byMe: false, users: [] };
      const updated = { ...msg.reactions };
      if (existing.byMe) {
        // Remove my reaction
        const userList = existing.users.filter(n => n !== myNameRef.current);
        if (userList.length === 0) delete updated[emoji];
        else updated[emoji] = { ...existing, count: userList.length, byMe: false, users: userList };
      } else {
        // Add my reaction
        const userList = [...existing.users, myNameRef.current];
        updated[emoji] = { emoji, count: userList.length, byMe: true, users: userList };
      }
      return { ...msg, reactions: updated };
    }));
  }, [send, roomId]);

  const leave = useCallback(() => {
    send({ type: "room-leave", roomId });
    if (wsRef.current) wsRef.current.close();
  }, [send, roomId]);

  return { users, messages, connected, sendMessage, sendVoiceNote, sendSignal, setSpeaking, sendReaction, leave, onSignalRef };
}

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function makeSystem(text: string): ChatMsg {
  return { id: `sys-${Date.now()}-${Math.random()}`, sender: "system", text, time: nowTime(), reactions: {} };
}

// ─────────────────────────────────────────────
// Voice Note Player
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// Reaction Picker Popup
// ─────────────────────────────────────────────
function ReactionPicker({ onPick, onClose }: { onPick: (e: string) => void; onClose: () => void }) {
  return (
    <div className="absolute z-50 bottom-full mb-2 left-0 bg-[#1a1a2e] border border-white/10 rounded-2xl p-2 shadow-xl flex flex-wrap gap-1 w-52">
      {QUICK_REACTIONS.map(e => (
        <button
          key={e}
          onClick={() => { onPick(e); onClose(); }}
          className="text-lg hover:scale-125 transition-transform p-1 rounded-lg hover:bg-white/10 cursor-pointer"
          title={e}
        >
          {e}
        </button>
      ))}
      <button onClick={onClose} className="absolute -top-2 -right-2 w-5 h-5 bg-slate-700 rounded-full flex items-center justify-center">
        <X className="w-3 h-3 text-white" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Reaction Bubble Bar
// ─────────────────────────────────────────────
function ReactionBar({ reactions, onReact }: { reactions: Record<string, Reaction>; onReact: (e: string) => void }) {
  const list = Object.values(reactions);
  if (list.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {list.map(r => (
        <button
          key={r.emoji}
          onClick={() => onReact(r.emoji)}
          title={r.users.join(", ")}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition cursor-pointer ${
            r.byMe
              ? "bg-purple-500/20 border-purple-500/50 text-purple-200"
              : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
          }`}
        >
          <span>{r.emoji}</span>
          <span>{r.count}</span>
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Message Bubble
// ─────────────────────────────────────────────
function MessageBubble({
  msg, isMe, myProfile, onReact
}: {
  msg: ChatMsg;
  isMe: boolean;
  myProfile: { name: string; color: string };
  onReact: (msgId: string, emoji: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [hovered, setHovered] = useState(false);

  if (msg.sender === "system") {
    return (
      <div className="flex justify-center my-1">
        <span className="text-xs text-slate-500 bg-white/[0.04] px-3 py-1 rounded-full">{msg.text}</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-end gap-2 group ${isMe ? "flex-row-reverse" : "flex-row"}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); }}
    >
      {/* Avatar */}
      {!isMe && (
        <div className={`w-8 h-8 rounded-full ${msg.senderColor || "bg-purple-500"} flex items-center justify-center text-white font-bold text-xs shrink-0 mb-1`}>
          {(msg.senderName || "?")[0].toUpperCase()}
        </div>
      )}
      {isMe && (
        <div className={`w-8 h-8 rounded-full ${myProfile.color} flex items-center justify-center text-white font-bold text-xs shrink-0 mb-1`}>
          {myProfile.name[0].toUpperCase()}
        </div>
      )}

      <div className={`flex flex-col max-w-[72%] ${isMe ? "items-end" : "items-start"}`}>
        {/* Sender name + time */}
        <div className={`flex items-center gap-2 mb-0.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-[11px] font-semibold text-slate-400">
            {isMe ? "You" : msg.senderName}
          </span>
          <span className="text-[10px] text-slate-600">{msg.time}</span>
        </div>

        {/* Bubble */}
        <div className="relative">
          <div className={`px-4 py-2.5 rounded-2xl text-sm ${
            isMe
              ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-br-sm"
              : "bg-[#1a1a2e] border border-white/5 text-slate-100 rounded-bl-sm"
          }`}>
            {msg.isVoice
              ? <VoiceNotePlayer audioData={msg.audioData} duration={msg.voiceDuration} />
              : <p className="leading-relaxed">{msg.text}</p>
            }
          </div>

          {/* Reaction picker trigger — shows on hover */}
          {hovered && (
            <div className={`absolute top-1/2 -translate-y-1/2 ${isMe ? "right-full mr-2" : "left-full ml-2"} relative`}>
              <button
                onClick={() => setShowPicker(p => !p)}
                className="p-1.5 rounded-full bg-[#1a1a2e] border border-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                title="React"
              >
                <SmilePlus className="w-3.5 h-3.5" />
              </button>
              {showPicker && (
                <ReactionPicker
                  onPick={(e) => onReact(msg.id, e)}
                  onClose={() => setShowPicker(false)}
                />
              )}
            </div>
          )}
        </div>

        {/* Reactions bar */}
        <ReactionBar
          reactions={msg.reactions}
          onReact={(e) => onReact(msg.id, e)}
        />
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = typeof params.roomId === "string" ? params.roomId : "";
  const cityInfo = CITY_MAP[roomId] || { city: roomId, state: "" };

  // Profile
  const [myProfile] = useState(() => {
    if (typeof window === "undefined") return { name: "You", color: COLORS[0] };
    try {
      const saved = localStorage.getItem("cs_user_profile");
      if (saved) {
        const p = JSON.parse(saved);
        const seed = (p.name || "Y").charCodeAt(0);
        return { name: p.name || "Anonymous", color: COLORS[seed % COLORS.length] };
      }
    } catch (_) {}
    return { name: "Anonymous", color: COLORS[Math.floor(Math.random() * COLORS.length)] };
  });

  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Voice call
  const [inVoiceCall, setInVoiceCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudiosRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  const [tab, setTab] = useState<"chat" | "members">("chat");
  const msgEndRef = useRef<HTMLDivElement>(null);

  const { users, messages, connected, sendMessage, sendVoiceNote, sendSignal, setSpeaking, sendReaction, leave, onSignalRef } =
    useRoomSocket(roomId, myProfile.name, myProfile.color);

  // Handle incoming WebRTC signals
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
    } catch (e) { console.warn("RTC error", e); }
  };

  function createPC(peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }]
    });
    peerConnections.current.set(peerId, pc);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => pc.addTrack(t, localStreamRef.current!));
    }
    pc.onicecandidate = e => { if (e.candidate) sendSignal(peerId, { candidate: e.candidate }); };
    pc.ontrack = e => {
      let audio = remoteAudiosRef.current.get(peerId);
      if (!audio) { audio = new Audio(); audio.autoplay = true; remoteAudiosRef.current.set(peerId, audio); }
      audio.srcObject = e.streams[0];
    };
    return pc;
  }

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (isRecording) {
      setRecordSecs(0);
      recordTimerRef.current = setInterval(() => setRecordSecs(s => s + 1), 1000);
    } else {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    }
    return () => { if (recordTimerRef.current) clearInterval(recordTimerRef.current); };
  }, [isRecording]);

  const joinVoiceCall = async () => {
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
        if (speaking !== wasSpeak) { wasSpeak = speaking; setSpeaking(speaking); }
      }, 200);
      (stream as any)._checkSpeak = checkSpeak;
      setInVoiceCall(true);
    } catch {
      alert("Microphone access is required for voice call.");
    }
  };

  const leaveVoiceCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      const ci = (localStreamRef.current as any)._checkSpeak;
      if (ci) clearInterval(ci);
      localStreamRef.current = null;
    }
    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();
    remoteAudiosRef.current.forEach(a => { a.srcObject = null; });
    remoteAudiosRef.current.clear();
    setSpeaking(false);
    setInVoiceCall(false);
    setIsMuted(false);
    setIsDeafened(false);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = isMuted; });
      setIsMuted(m => !m);
    }
  };

  const toggleDeafen = () => {
    const def = !isDeafened;
    remoteAudiosRef.current.forEach(a => { a.muted = def; });
    setIsDeafened(def);
  };

  const startRecording = async () => {
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
          sendVoiceNote(base64, `0:${recordSecs.toString().padStart(2, "0")}`);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
    } catch { alert("Microphone access required."); }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] bg-[#09090f] overflow-hidden">

      {/* ── Header ── */}
      <div className="bg-[#0d0d16] border-b border-white/5 px-4 py-3 flex items-center gap-3 shrink-0">
        <button
          onClick={() => { leave(); router.push("/chatrooms"); }}
          className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="text-white font-bold text-sm truncate">{cityInfo.city}</h1>
          <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3" /> {cityInfo.state}
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
          <Users className="w-3.5 h-3.5" />
          {users.length + 1}/10
        </div>

        <div className="flex gap-1 shrink-0">
          {(["chat", "members"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                tab === t ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {t === "chat"
                ? <><MessageSquare className="w-3.5 h-3.5 inline mr-1" />Chat</>
                : <><Users className="w-3.5 h-3.5 inline mr-1" />Members ({users.length + 1})</>
              }
            </button>
          ))}
        </div>
      </div>

      {/* ── Voice Call Bar ── */}
      <div className={`shrink-0 border-b border-white/5 transition-colors ${inVoiceCall ? "bg-emerald-950/40" : "bg-[#0d0d16]"}`}>
        <div className="px-4 py-2.5 flex items-center gap-3">
          <Radio className={`w-4 h-4 ${inVoiceCall ? "text-emerald-400" : "text-slate-500"}`} />
          <span className={`text-xs font-semibold flex-1 ${inVoiceCall ? "text-emerald-300" : "text-slate-400"}`}>
            {inVoiceCall ? "🔴 Voice call active in this room" : "Voice call — talk with everyone in this room"}
          </span>

          {inVoiceCall && (
            <>
              <button onClick={toggleMute} className={`p-2 rounded-full transition cursor-pointer ${isMuted ? "bg-rose-500/20 text-rose-400" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}>
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button onClick={toggleDeafen} className={`p-2 rounded-full transition cursor-pointer ${isDeafened ? "bg-rose-500/20 text-rose-400" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}>
                {isDeafened ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button onClick={leaveVoiceCall} className="px-3 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer">
                <PhoneOff className="w-3.5 h-3.5" /> Leave
              </button>
            </>
          )}
          {!inVoiceCall && (
            <button onClick={joinVoiceCall} className="px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer">
              <Phone className="w-3.5 h-3.5" /> Join Voice
            </button>
          )}
        </div>

        {inVoiceCall && users.some(u => u.isSpeaking) && (
          <div className="px-4 pb-2 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500">Speaking:</span>
            {users.filter(u => u.isSpeaking).map(u => (
              <span key={u.id} className={`text-xs font-semibold text-white px-2 py-0.5 rounded-full ${u.color}`}>{u.name}</span>
            ))}
          </div>
        )}
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── CHAT TAB ── */}
        {tab === "chat" && (
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Messages list */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
              {!connected && (
                <div className="flex items-center justify-center h-32 text-slate-500 text-sm gap-2">
                  <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  Joining room…
                </div>
              )}

              {messages.map(msg => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isMe={msg.sender === "me"}
                  myProfile={myProfile}
                  onReact={sendReaction}
                />
              ))}
              <div ref={msgEndRef} />
            </div>

            {/* ── Input Bar ── */}
            <div className="border-t border-white/5 bg-[#0d0d16] px-4 py-3 flex items-center gap-2 shrink-0">

              {/* Mic / Stop recording */}
              <button
                onClick={() => isRecording ? stopRecording() : startRecording()}
                className={`p-2.5 rounded-xl transition cursor-pointer shrink-0 ${
                  isRecording
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse"
                    : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                }`}
                title={isRecording ? "Stop & send voice note" : "Record voice note"}
              >
                {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {isRecording ? (
                <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30">
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                  <span className="text-xs text-rose-300 font-mono">🎙️ Recording… 0:{recordSecs.toString().padStart(2, "0")}</span>
                  <span className="text-xs text-slate-400 ml-auto">tap 🔲 to send</span>
                </div>
              ) : (
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey && input.trim()) {
                      e.preventDefault();
                      sendMessage(input.trim());
                      setInput("");
                    }
                  }}
                  placeholder={connected ? `Message ${cityInfo.city} room… (Enter to send)` : "Connecting…"}
                  disabled={!connected}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#141420] border border-white/5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 transition disabled:opacity-50"
                />
              )}

              <button
                onClick={() => { if (input.trim()) { sendMessage(input.trim()); setInput(""); } }}
                disabled={!connected || !input.trim() || isRecording}
                className="p-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:opacity-90 disabled:opacity-40 text-white transition cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── MEMBERS TAB ── */}
        {tab === "members" && (
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Members in {cityInfo.city} ({users.length + 1})
            </h3>

            {/* Me */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-600/10 border border-purple-500/20 mb-2">
              <div className={`w-10 h-10 rounded-full ${myProfile.color} flex items-center justify-center text-white font-bold`}>
                {myProfile.name[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {myProfile.name} <span className="text-xs text-purple-400 font-normal">(you)</span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {inVoiceCall ? "🎙️ In voice call" : "💬 Text only"}
                </p>
              </div>
            </div>

            {users.map(u => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition mb-1">
                <div className={`w-10 h-10 rounded-full ${u.color} flex items-center justify-center text-white font-bold relative`}>
                  {(u.initial || u.name[0]).toUpperCase()}
                  {u.isSpeaking && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#09090f] animate-pulse" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{u.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {u.isSpeaking ? "🎙️ Speaking…" : "Online"}
                  </p>
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <div className="text-center py-10 text-slate-500">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Only you here right now.</p>
                <p className="text-xs mt-1">Share the link to invite others!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
