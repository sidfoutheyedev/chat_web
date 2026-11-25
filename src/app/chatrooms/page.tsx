"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MicOff } from "lucide-react";

interface CityRoom {
  id: string;
  city: string;
  state: string;
  onlineCount: number;
  maxCount: number;
  users: { name: string; color: string; initial: string }[];
  talkingUser?: string;
  highlighted?: boolean;
}

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

const NAMES = [
  "Rohan", "Yash", "Anaya", "Rahul", "Arjun", "Kabir",
  "Hugo", "Vivek", "Meera", "Ruby", "Liam", "Neha",
  "Dylan", "Saanvi", "Noah", "Priya", "Aarav", "Sneha"
];

const CITIES: Omit<CityRoom, "users" | "onlineCount" | "talkingUser">[] = [
  { id: "new-delhi",      city: "New Delhi",          state: "New Delhi · Delhi NCR",        maxCount: 10 },
  { id: "ghaziabad",      city: "Ghaziabad",          state: "Ghaziabad · Uttar Pradesh",    maxCount: 10 },
  { id: "pune",           city: "Pune Junction",      state: "Pune · Maharashtra",           maxCount: 10 },
  { id: "solapur",        city: "Solapur Junction",   state: "Solapur · Maharashtra",        maxCount: 10 },
  { id: "mumbai-cst",     city: "Mumbai CST",         state: "Mumbai · Maharashtra",         maxCount: 10 },
  { id: "guwahati",       city: "Guwahati",           state: "Guwahati · Assam",             maxCount: 10 },
  { id: "raipur",         city: "Raipur Junction",    state: "Raipur · Chhattisgarh",        maxCount: 10, highlighted: true },
  { id: "bhubaneswar",    city: "Bhubaneswar",        state: "Bhubaneswar · Odisha",         maxCount: 10 },
  { id: "ernakulam",      city: "Ernakulam Junction", state: "Kochi · Kerala",               maxCount: 10 },
  { id: "new-jalpaiguri", city: "New Jalpaiguri",     state: "Siliguri · West Bengal",       maxCount: 10 },
  { id: "asansol",        city: "Asansol Junction",   state: "Asansol · West Bengal",        maxCount: 10 },
  { id: "kozhikode",      city: "Kozhikode",          state: "Kozhikode · Kerala",           maxCount: 10 },
  { id: "gwalior",        city: "Gwalior Junction",   state: "Gwalior · Madhya Pradesh",     maxCount: 10 },
  { id: "lucknow",        city: "Lucknow Charbagh",   state: "Lucknow · Uttar Pradesh",      maxCount: 10 },
  { id: "mathura",        city: "Mathura Junction",   state: "Mathura · Uttar Pradesh",      maxCount: 10 },
  { id: "tirupati",       city: "Tirupati",           state: "Tirupati · Andhra Pradesh",    maxCount: 10 },
  { id: "bengaluru",      city: "Bengaluru City",     state: "Bengaluru · Karnataka",        maxCount: 10 },
  { id: "hyderabad",      city: "Hyderabad",          state: "Hyderabad · Telangana",        maxCount: 10 },
  { id: "chennai",        city: "Chennai Central",    state: "Chennai · Tamil Nadu",         maxCount: 10 },
  { id: "kolkata",        city: "Kolkata",            state: "Kolkata · West Bengal",        maxCount: 10 },
  { id: "jaipur",         city: "Jaipur Junction",    state: "Jaipur · Rajasthan",           maxCount: 10 },
  { id: "ahmedabad",      city: "Ahmedabad",          state: "Ahmedabad · Gujarat",          maxCount: 10 },
  { id: "patna",          city: "Patna Junction",     state: "Patna · Bihar",                maxCount: 10 },
  { id: "chandigarh",     city: "Chandigarh",         state: "Chandigarh · Punjab",          maxCount: 10 },
];

function generateRooms(): CityRoom[] {
  return CITIES.map((city, idx) => {
    const count = idx === 5 ? 1 : 2 + ((idx * 3) % 9);
    const users = Array.from({ length: Math.min(count, 4) }, (_, i) => {
      const n = NAMES[(idx * 3 + i) % NAMES.length];
      return {
        name: n,
        initial: n[0].toUpperCase(),
        color: AVATAR_COLORS[(idx + i) % AVATAR_COLORS.length],
      };
    });
    return {
      ...city,
      onlineCount: count,
      users,
      talkingUser: count === 1 ? users[0].name : undefined,
    };
  });
}

export default function ChatRoomsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [rooms, setRooms] = useState<CityRoom[]>(() => generateRooms());

  useEffect(() => {
    const interval = setInterval(() => {
      setRooms((prev) =>
        prev.map((r) => {
          const delta = Math.random() > 0.5 ? 1 : -1;
          const nextCount = Math.max(1, Math.min(r.maxCount, r.onlineCount + delta));
          return { ...r, onlineCount: nextCount };
        })
      );
    }, 9000);
    return () => clearInterval(interval);
  }, []);

  const filtered = rooms.filter(
    (r) =>
      r.city.toLowerCase().includes(search.toLowerCase()) ||
      r.state.toLowerCase().includes(search.toLowerCase())
  );

  const isFull = (r: CityRoom) => r.onlineCount >= r.maxCount;

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-64px)] bg-[#0b0d11] text-slate-100">
      {/* Top Bar */}
      <div className="border-b border-white/[0.06] bg-[#0e1117] px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
            City Chat Rooms
          </h1>
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {rooms.reduce((acc, r) => acc + r.onlineCount, 0).toLocaleString()} online
          </span>
        </div>

        <div className="relative w-48 sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search city or state..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#161a22] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400/50 transition"
          />
        </div>
      </div>

      {/* 3-Column City Grid (matching reference layout) */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((room) => {
            const full = isFull(room);
            const extra = room.onlineCount > 4 ? room.onlineCount - 4 : 0;

            return (
              <button
                key={room.id}
                onClick={() => router.push(`/chatrooms/${room.id}`)}
                disabled={full}
                className={`text-left rounded-xl p-4 sm:p-5 border transition flex items-center justify-between gap-4 ${
                  room.highlighted
                    ? "bg-[#1a2629] border-teal-500/20 hover:border-teal-400/40"
                    : "bg-[#12151b] border-white/[0.06] hover:bg-[#171b23] hover:border-white/15"
                } ${full ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
              >
                {/* Left Info */}
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="text-[15px] font-bold text-white truncate">
                    {room.city}
                  </h3>
                  <p className="text-xs text-slate-400 truncate">
                    {room.state}
                  </p>
                  <p className="text-xs text-slate-300 pt-1 truncate">
                    {room.talkingUser ? (
                      <span>{room.talkingUser} is talking</span>
                    ) : (
                      <span>
                        <strong className="font-semibold text-white">{room.users[0]?.name}</strong>
                        {room.onlineCount > 1 && (
                          <span className="text-slate-400"> +{room.onlineCount - 1} more</span>
                        )}
                      </span>
                    )}
                  </p>
                  <p className="text-xs flex items-center gap-1.5 pt-0.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        full ? "bg-rose-400" : "bg-emerald-400"
                      }`}
                    />
                    <span className={full ? "text-slate-400" : "text-slate-300"}>
                      live {room.onlineCount}/{room.maxCount}{" "}
                      {room.onlineCount === 1 ? "person" : "people"}
                      {full ? " · full" : ""}
                    </span>
                  </p>
                </div>

                {/* Right Clustered Circular Avatars */}
                <div className="relative w-20 h-16 shrink-0 flex items-center justify-center">
                  {room.users.length === 1 && (
                    <div
                      className={`w-10 h-10 rounded-full ${room.users[0].color} flex items-center justify-center text-white font-bold text-sm shadow`}
                    >
                      {room.users[0].initial}
                    </div>
                  )}

                  {room.users.length === 2 && (
                    <div className="flex items-center -space-x-2">
                      {room.users.map((u, i) => (
                        <div
                          key={i}
                          className={`w-9 h-9 rounded-full ${u.color} flex items-center justify-center text-white font-bold text-xs border-2 border-[#12151b] shadow`}
                        >
                          {u.initial}
                        </div>
                      ))}
                    </div>
                  )}

                  {room.users.length >= 3 && (
                    <div className="relative w-16 h-14">
                      <div
                        className={`absolute top-0 left-1 w-8 h-8 rounded-full ${room.users[0].color} flex items-center justify-center text-white font-bold text-xs border-2 border-[#12151b]`}
                      >
                        {room.users[0].initial}
                      </div>
                      <div
                        className={`absolute top-0 right-1 w-8 h-8 rounded-full ${room.users[1].color} flex items-center justify-center text-white font-bold text-xs border-2 border-[#12151b]`}
                      >
                        {room.users[1].initial}
                      </div>
                      <div
                        className={`absolute bottom-0 left-3 w-8 h-8 rounded-full ${room.users[2].color} flex items-center justify-center text-white font-bold text-xs border-2 border-[#12151b]`}
                      >
                        {room.users[2].initial}
                      </div>
                      {room.users[3] && (
                        <div
                          className={`absolute bottom-0 right-0 w-8 h-8 rounded-full ${room.users[3].color} flex items-center justify-center text-white font-bold text-xs border-2 border-[#12151b]`}
                        >
                          {room.users[3].initial}
                        </div>
                      )}
                      {extra > 0 && (
                        <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-[#0b0d11] border border-white/15 text-[10px] font-bold text-white">
                          +{extra}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-slate-500 text-sm">
            No city found for &ldquo;{search}&rdquo;
          </div>
        )}
      </div>

      {/* Bottom-right floating mic indicator (matching reference UI) */}
      <div className="fixed bottom-5 right-5 w-11 h-11 rounded-full bg-[#e68a86] text-[#111318] flex items-center justify-center shadow-lg pointer-events-none opacity-90">
        <MicOff className="w-5 h-5" />
      </div>
    </div>
  );
}
