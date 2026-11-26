"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface UserProfile {
  name: string;
  gender: string;
  age: string;
  lookingFor?: string;
}

export interface ChatMessage {
  id: string;
  sender: "me" | "them" | "system";
  text?: string;
  isVoice?: boolean;
  voiceDuration?: string;
  time: string;
}

interface UseChatSocketOptions {
  mode: "text" | "voice" | "video";
  profile: UserProfile;
  roomId?: string | null;
  onSignal?: (data: any) => void;
  autoConnect?: boolean;
  autoNext?: boolean;
}

export function useChatSocket({ mode, profile, roomId, onSignal, autoConnect = true, autoNext = false }: UseChatSocketOptions) {
  const [status, setStatus] = useState<"disconnected" | "searching" | "connected">("disconnected");
  const [partnerProfile, setPartnerProfile] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [isInitiator, setIsInitiator] = useState(false);
  const [queueCount, setQueueCount] = useState(0);

  const socketRef = useRef<WebSocket | null>(null);
  const onSignalRef = useRef(onSignal);
  onSignalRef.current = onSignal;

  // Keep latest profile/roomId in refs so connect() doesn't recreate on every profile change
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const roomIdRef = useRef(roomId);
  roomIdRef.current = roomId;
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const autoNextRef = useRef(autoNext);
  autoNextRef.current = autoNext;
  const autoNextTimerRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;

    // Close any previous socket
    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch (_) {}
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    setStatus("searching");
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      // Send join message with latest profile/mode from refs (avoids stale closure)
      ws.send(JSON.stringify({
        type: "join",
        mode: modeRef.current,
        roomId: roomIdRef.current,
        profile: profileRef.current
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "waiting": {
            setStatus("searching");
            setPartnerProfile(null);
            setQueueCount(data.queueLength || 1);
            break;
          }

          case "matched": {
            setStatus("connected");
            setPartnerProfile(data.partnerProfile);
            setIsPartnerTyping(false);
            setIsInitiator(!!data.initiator);
            setMessages([
              {
                id: `sys-${Date.now()}`,
                sender: "system",
                text: `🎉 You are connected with ${data.partnerProfile?.name || "a stranger"} (${data.partnerProfile?.age || "18+"} • ${
                  data.partnerProfile?.gender === "female"
                    ? "Female 👩"
                    : data.partnerProfile?.gender === "male"
                    ? "Male 👨"
                    : "Other ✨"
                }). Say hi!`,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              }
            ]);
            break;
          }

          case "message": {
            setMessages((prev) => [
              ...prev,
              {
                id: `msg-${Date.now()}-${Math.random()}`,
                sender: "them",
                text: data.text,
                time: data.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              }
            ]);
            break;
          }

          case "voice-note": {
            setMessages((prev) => [
              ...prev,
              {
                id: `vn-${Date.now()}-${Math.random()}`,
                sender: "them",
                isVoice: true,
                voiceDuration: data.voiceDuration || "0:05",
                text: data.audioData, // Stored audio base64 data
                time: data.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              }
            ]);
            break;
          }

          case "typing": {
            setIsPartnerTyping(!!data.isTyping);
            break;
          }

          case "signal": {
            if (onSignalRef.current) {
              onSignalRef.current(data.data);
            }
            break;
          }

          case "partner-disconnected": {
            setIsPartnerTyping(false);
            if (autoNextRef.current) {
              setStatus("searching");
              setPartnerProfile(null);
              setMessages((prev) => [
                ...prev,
                {
                  id: `sys-${Date.now()}`,
                  sender: "system",
                  text: `🔄 Stranger disconnected. Auto-connecting to the next free stranger...`,
                  time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                }
              ]);
              if (autoNextTimerRef.current) clearTimeout(autoNextTimerRef.current);
              autoNextTimerRef.current = setTimeout(() => {
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({
                    type: "next",
                    mode: modeRef.current,
                    profile: profileRef.current,
                    roomId: roomIdRef.current
                  }));
                }
              }, 800);
            } else {
              setStatus("disconnected");
              setMessages((prev) => [
                ...prev,
                {
                  id: `sys-${Date.now()}`,
                  sender: "system",
                  text: `⚠️ Stranger has disconnected. Click "Find Stranger" or enable Auto-Next to connect to someone new.`,
                  time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                }
              ]);
            }
            break;
          }
        }
      } catch (err) {
        console.error("Error parsing WS message:", err);
      }
    };

    ws.onclose = () => {
      setStatus("disconnected");
    };

    ws.onerror = (err) => {
      console.warn("WebSocket error:", err);
      setStatus("disconnected");
    };
  // connect() is stable — no deps other than autoConnect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  // Only run on mount — profile/mode/roomId changes are handled via refs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect]);

  const sendMessage = useCallback((text: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    socketRef.current.send(JSON.stringify({
      type: "message",
      text,
      time
    }));
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}-${Math.random()}`,
        sender: "me",
        text,
        time
      }
    ]);
  }, []);

  const sendVoiceNote = useCallback((audioData: string, voiceDuration: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    socketRef.current.send(JSON.stringify({
      type: "voice-note",
      audioData,
      voiceDuration,
      time
    }));
    setMessages((prev) => [
      ...prev,
      {
        id: `vn-${Date.now()}-${Math.random()}`,
        sender: "me",
        isVoice: true,
        voiceDuration,
        text: audioData,
        time
      }
    ]);
  }, []);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(JSON.stringify({
      type: "typing",
      isTyping
    }));
  }, []);

  const sendSignal = useCallback((data: any) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(JSON.stringify({
      type: "signal",
      data
    }));
  }, []);

  const nextStranger = useCallback(() => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      connect();
      return;
    }
    setStatus("searching");
    setPartnerProfile(null);
    setMessages([
      {
        id: `sys-${Date.now()}`,
        sender: "system",
        text: "🔍 Looking for an available stranger online...",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
    // Send full join payload so server re-queues with correct mode & profile
    socketRef.current.send(JSON.stringify({
      type: "next",
      mode: modeRef.current,
      profile: profileRef.current,
      roomId: roomIdRef.current
    }));
  }, [connect]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.send(JSON.stringify({ type: "leave" }));
      socketRef.current.close();
    }
    setStatus("disconnected");
  }, []);

  return {
    status,
    partnerProfile,
    messages,
    isPartnerTyping,
    isInitiator,
    queueCount,
    sendMessage,
    sendVoiceNote,
    sendTyping,
    sendSignal,
    nextStranger,
    disconnect,
    reconnect: connect
  };
}
