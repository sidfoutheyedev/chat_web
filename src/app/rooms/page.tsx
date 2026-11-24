"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Users, 
  Gamepad2, 
  Tv, 
  Heart, 
  Sparkles, 
  Flame, 
  Music2, 
  Coffee,
  ArrowRight
} from "lucide-react";

interface Room {
  id: string;
  name: string;
  category: string;
  onlineCount: number;
  description: string;
  icon: string;
  badge?: string;
}

const ROOMS_DATA: Room[] = [
  {
    id: "general",
    name: "General Hangout",
    category: "casual",
    onlineCount: 4890,
    description: "The global living room. Talk about anything and everything with strangers worldwide.",
    icon: "💬",
    badge: "Most Popular",
  },
  {
    id: "gaming",
    name: "Gamer Lounge",
    category: "gaming",
    onlineCount: 1420,
    description: "Valorant, GTA, Minecraft, Steam, and console gaming discussions.",
    icon: "🎮",
    badge: "Trending",
  },
  {
    id: "anime",
    name: "Anime & Manga Hub",
    category: "anime",
    onlineCount: 960,
    description: "Share anime recommendations, seasonal episodes, and favorite manga.",
    icon: "🎌",
  },
  {
    id: "dating",
    name: "Singles & Dating (18+)",
    category: "dating",
    onlineCount: 1250,
    description: "Flirt, meet singles, and build genuine romantic connections.",
    icon: "💘",
    badge: "Hot",
  },
  {
    id: "music",
    name: "Music & Beats",
    category: "music",
    onlineCount: 680,
    description: "Discover new artists, share Spotify tracks, and discuss instruments.",
    icon: "🎵",
  },
  {
    id: "lgbt",
    name: "LGBTQ+ Community",
    category: "identity",
    onlineCount: 790,
    description: "Safe, inclusive, and welcoming space for gay, lesbian, trans & queer individuals.",
    icon: "🏳️‍🌈",
  },
  {
    id: "late-night",
    name: "Late Night Thoughts",
    category: "casual",
    onlineCount: 840,
    description: "Deep conversations, life stories, and chill nighttime vibes.",
    icon: "🌙",
  },
  {
    id: "tech",
    name: "Tech & Coding",
    category: "gaming",
    onlineCount: 430,
    description: "Web dev, AI, gadgets, startups, and software engineering chatter.",
    icon: "💻",
  },
];

export default function RoomsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", label: "All Rooms" },
    { id: "casual", label: "Casual & Social" },
    { id: "gaming", label: "Gaming" },
    { id: "anime", label: "Anime" },
    { id: "dating", label: "Dating (18+)" },
    { id: "music", label: "Music" },
    { id: "identity", label: "LGBTQ+" },
  ];

  const filteredRooms = ROOMS_DATA.filter((room) => {
    const matchesCategory = selectedCategory === "all" || room.category === selectedCategory;
    const matchesSearch =
      room.name.toLowerCase().includes(search.toLowerCase()) ||
      room.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleJoin = (room: Room) => {
    router.push(`/chat?room=${encodeURIComponent(room.id)}`);
  };

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-12">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Topic-Based Communities</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white">
          Explore Public <span className="text-neon-gradient">Chat Rooms</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400">
          Join thousands of active people in public topic rooms. No registration required.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-4 mb-8">
        
        {/* Search Input */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rooms (e.g. gaming, anime, music)..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#10101b] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/10 border border-white/5"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredRooms.map((room) => (
          <div
            key={room.id}
            onClick={() => handleJoin(room)}
            className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-purple-500/40 hover:bg-[#151524] transition duration-200 cursor-pointer flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-3xl p-2 rounded-xl bg-white/5 inline-block">{room.icon}</span>
                {room.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
                    {room.badge}
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-bold text-lg text-white group-hover:text-purple-300 transition">
                  {room.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {room.description}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot" />
                <span>{room.onlineCount.toLocaleString()} online</span>
              </div>

              <div className="text-xs text-purple-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition duration-150">
                <span>Join</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRooms.length === 0 && (
        <div className="text-center py-16 text-slate-500 space-y-2">
          <p className="text-2xl">🔍</p>
          <p className="text-base font-semibold text-slate-400">No rooms found</p>
          <p className="text-xs">Try searching for something else or reset your filter.</p>
        </div>
      )}

    </div>
  );
}
