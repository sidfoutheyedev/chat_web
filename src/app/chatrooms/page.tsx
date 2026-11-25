"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Search,
  Users,
  MapPin,
  Mic,
  Radio,
  ChevronRight
} from "lucide-react";

interface CityRoom {
  id: string;
  city: string;
  state: string;
  onlineCount: number;
  maxCount: number;
  users: { name: string; color: string; initial: string }[];
  talkingUser?: string;
}

const COLORS = [
  "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-yellow-500",
  "bg-lime-500", "bg-green-500", "bg-emerald-500", "bg-teal-500",
  "bg-cyan-500", "bg-sky-500", "bg-blue-500", "bg-indigo-500",
  "bg-violet-500", "bg-purple-500", "bg-fuchsia-500", "bg-pink-500",
  "bg-rose-500",
];

const NAMES = [
  "Arjun","Priya","Rohan","Sneha","Vikram","Ananya","Rahul","Meera",
  "Amit","Pooja","Dev","Riya","Nikhil","Kavya","Suresh","Deepa",
  "Arun","Swati","Kiran","Lata","Yash","Ruby","Dylan","Kabir",
  "Vivek","Hugo","Saanvi","Noah","Liam","Meera","Neha","Arjun"
];

const CITIES: Omit<CityRoom,"users"|"onlineCount"|"talkingUser">[] = [
  { id: "new-delhi",        city: "New Delhi",        state: "Delhi NCR",         maxCount: 10 },
  { id: "ghaziabad",       city: "Ghaziabad",        state: "Uttar Pradesh",     maxCount: 10 },
  { id: "mumbai-cst",      city: "Mumbai CST",       state: "Mumbai · Maharashtra", maxCount: 10 },
  { id: "pune",            city: "Pune Junction",    state: "Pune · Maharashtra", maxCount: 10 },
  { id: "bengaluru",       city: "Bengaluru City",   state: "Karnataka",         maxCount: 10 },
  { id: "hyderabad",       city: "Hyderabad",        state: "Telangana",         maxCount: 10 },
  { id: "chennai",         city: "Chennai Central",  state: "Tamil Nadu",        maxCount: 10 },
  { id: "kolkata",         city: "Kolkata",          state: "West Bengal",       maxCount: 10 },
  { id: "guwahati",        city: "Guwahati",         state: "Guwahati · Assam",  maxCount: 10 },
  { id: "ernakulam",       city: "Ernakulam Junction",state: "Kochi · Kerala",   maxCount: 10 },
  { id: "kozhikode",       city: "Kozhikode",        state: "Kozhikode · Kerala",maxCount: 10 },
  { id: "mathura",         city: "Mathura Junction", state: "Mathura · Uttar Pradesh", maxCount: 10 },
  { id: "solapur",         city: "Solapur Junction", state: "Solapur · Maharashtra", maxCount: 10 },
  { id: "raipur",          city: "Raipur Junction",  state: "Raipur · Chhattisgarh", maxCount: 10 },
  { id: "bhubaneswar",     city: "Bhubaneswar",      state: "Bhubaneswar · Odisha", maxCount: 10 },
  { id: "new-jalpaiguri",  city: "New Jalpaiguri",   state: "Siliguri · West Bengal", maxCount: 10 },
  { id: "asansol",         city: "Asansol Junction", state: "Asansol · West Bengal", maxCount: 10 },
  { id: "gwalior",         city: "Gwalior Junction", state: "Gwalior · Madhya Pradesh", maxCount: 10 },
  { id: "lucknow",         city: "Lucknow Charbagh", state: "Lucknow · Uttar Pradesh", maxCount: 10 },
  { id: "tirupati",        city: "Tirupati",         state: "Tirupati · Andhra Pradesh", maxCount: 10 },
  { id: "jaipur",          city: "Jaipur Junction",  state: "Jaipur · Rajasthan", maxCount: 10 },
  { id: "ahmedabad",       city: "Ahmedabad",        state: "Ahmedabad · Gujarat", maxCount: 10 },
  { id: "patna",           city: "Patna Junction",   state: "Patna · Bihar",     maxCount: 10 },
  { id: "chandigarh",      city: "Chandigarh",       state: "Chandigarh · Punjab", maxCount: 10 },
];

function makeUser(name: string, seed: number) {
  return {
    name,
    initial: name[0].toUpperCase(),
    color: COLORS[seed % COLORS.length],
  };
}

function generateRooms(): CityRoom[] {
  return CITIES.map((city, idx) => {
    const count = 2 + Math.floor(Math.random() * 9);
    const users = Array.from({ length: Math.min(count, 4) }, (_, i) =>
      makeUser(NAMES[(idx * 4 + i) % NAMES.length], idx * 4 + i)
    );
    return {
      ...city,
      onlineCount: count,
      users,
      talkingUser: idx % 5 === 1 ? NAMES[(idx * 3) % NAMES.length] : undefined,
    };
  });
}

export default function ChatRoomsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [rooms, setRooms] = useState<CityRoom[]>([]);

  useEffect(() => {
    setRooms(generateRooms());
    // Simulate live updates
    const interval = setInterval(() => {
      setRooms(prev => prev.map(r => ({
        ...r,
        onlineCount: Math.max(1, r.onlineCount + (Math.random() > 0.5 ? 1 : -1)),
      })));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const filtered = rooms.filter(r =>
    r.city.toLowerCase().includes(search.toLowerCase()) ||
    r.state.toLowerCase().includes(search.toLowerCase())
  );

  const full = (r: CityRoom) => r.onlineCount >= r.maxCount;

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-[#09090f]">

      {/* Top Header */}
      <div className="bg-[#0d0d16] border-b border-white/5 px-4 py-3 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-purple-400" />
          <span className="text-white font-bold text-base">City Chat Rooms</span>
          <span className="ml-2 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot inline-block" />
            {rooms.reduce((s, r) => s + r.onlineCount, 0).toLocaleString()} online
          </span>
        </div>
        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search cities..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#141420] border border-white/5 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500 transition"
          />
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-purple-950/20 border-b border-purple-500/10 px-4 py-2 shrink-0">
        <p className="text-xs text-slate-400 text-center">
          🎙️ Join any city room for <strong className="text-white">text + voice chat</strong> with people from that city — rooms are completely isolated
        </p>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 divide-x divide-y divide-white/5">
          {filtered.map(room => (
            <button
              key={room.id}
              onClick={() => router.push(`/chatrooms/${room.id}`)}
              disabled={full(room)}
              className={`text-left p-5 flex items-center gap-4 transition group
                ${full(room)
                  ? "opacity-50 cursor-not-allowed bg-transparent"
                  : "hover:bg-white/[0.03] cursor-pointer"
                }`}
            >
              {/* User Avatar Stack */}
              <div className="relative shrink-0 w-14 h-10">
                {room.users.slice(0, 3).map((u, i) => (
                  <div
                    key={i}
                    className={`absolute w-9 h-9 rounded-full ${u.color} flex items-center justify-center text-white font-bold text-sm border-2 border-[#09090f] shadow`}
                    style={{ left: i * 16, zIndex: 3 - i }}
                  >
                    {u.initial}
                  </div>
                ))}
                {room.onlineCount > 3 && (
                  <div
                    className="absolute w-7 h-7 rounded-full bg-[#1a1a2e] border-2 border-[#09090f] flex items-center justify-center text-[10px] font-bold text-slate-300"
                    style={{ left: 3 * 16, zIndex: 0, top: 5 }}
                  >
                    +{room.onlineCount - 3}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-sm group-hover:text-purple-300 transition truncate">
                  {room.city}
                </h3>
                <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 inline shrink-0" />
                  {room.state}
                </p>
                {room.talkingUser ? (
                  <p className="text-xs text-amber-400 mt-1 flex items-center gap-1 truncate">
                    <Mic className="w-3 h-3" />
                    {room.talkingUser} is talking
                  </p>
                ) : (
                  <p className={`text-xs mt-1 flex items-center gap-1 ${full(room) ? "text-rose-400" : "text-emerald-400"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${full(room) ? "bg-rose-400" : "bg-emerald-400 animate-pulse-dot"}`} />
                    live {room.onlineCount}/{room.maxCount} {full(room) ? "· full" : "people"}
                  </p>
                )}
              </div>

              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition shrink-0" />
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-2">
            <Search className="w-8 h-8 opacity-40" />
            <p className="text-sm">No city found for "<strong>{search}</strong>"</p>
          </div>
        )}
      </div>
    </div>
  );
}
