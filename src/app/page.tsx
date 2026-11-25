"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  MessageSquare, 
  Mic, 
  Video, 
  Compass, 
  ShieldCheck, 
  Users, 
  Globe2, 
  Zap, 
  ArrowRight,
  Flame,
  Gamepad2,
  Tv,
  Music2,
  Sparkles,
  User,
  Heart
} from "lucide-react";
import { useLiveCounter } from "@/hooks/useLiveCounter";

export default function HomePage() {
  const router = useRouter();
  const { online, activeChats, countries } = useLiveCounter();

  // Mode Selection: 'chat' | 'voice' | 'video' | 'rooms'
  const [selectedMode, setSelectedMode] = useState<"chat" | "voice" | "video" | "rooms">("chat");
  
  // User Profile: Name, Gender, Age
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
  const [age, setAge] = useState<string>("22");
  const [lookingFor, setLookingFor] = useState<"any" | "female" | "male">("any");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Load saved profile if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cs_user_profile");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name) setName(parsed.name);
        if (parsed.gender) setGender(parsed.gender);
        if (parsed.age) setAge(parsed.age);
        if (parsed.lookingFor) setLookingFor(parsed.lookingFor);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const interestsList = [
    { id: "gaming", label: "Gaming", icon: Gamepad2 },
    { id: "anime", label: "Anime", icon: Tv },
    { id: "music", label: "Music", icon: Music2 },
    { id: "movies", label: "Movies", icon: Flame },
    { id: "travel", label: "Travel", icon: Globe2 },
    { id: "casual", label: "Casual Talk", icon: MessageSquare },
  ];

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save profile to localStorage (shared across all pages)
    const profile = {
      name: name.trim() || "Anonymous",
      gender: gender || "unspecified",
      age: age || "18+",
      lookingFor,
      interests: selectedInterests
    };
    localStorage.setItem("cs_user_profile", JSON.stringify(profile));

    if (selectedMode === "voice") router.push("/voice");
    else if (selectedMode === "video") router.push("/video");
    else if (selectedMode === "rooms") router.push("/rooms");
    else router.push("/chat");
  };

  return (
    <div className="flex flex-col items-center">
      
      {/* Hero Section */}
      <section className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-16 flex flex-col items-center text-center">
        
        {/* Subtle Background Glow orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-purple-600/15 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-1/3 right-1/4 w-[350px] h-[300px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />

        {/* Safe pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs sm:text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Next-Gen Stranger Communication</span>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
          <span className="text-cyan-400 font-semibold">100% Free &amp; Private</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.1] text-white mb-6">
          Meet strangers without the{" "}
          <span className="text-neon-gradient">complexity.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed mb-8">
          Instant 1-click connections. Set your profile, choose Text, Voice Call, or Video Cam, and start talking to real people instantly.
        </p>

        {/* Main Clean Launchpad Box */}
        <div className="w-full max-w-2xl glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10 glow-purple">
          
          {/* 4 Clear Mode Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
            
            {/* Random Text */}
            <button
              type="button"
              onClick={() => setSelectedMode("chat")}
              className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                selectedMode === "chat"
                  ? "bg-purple-600/25 border-purple-500 text-white shadow-lg shadow-purple-600/20"
                  : "bg-white/[0.02] border-white/5 text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedMode === "chat" ? "bg-purple-600 text-white" : "bg-white/5 text-slate-400"}`}>
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="text-xs sm:text-sm font-semibold">Text Chat</span>
            </button>

            {/* Voice Call */}
            <button
              type="button"
              onClick={() => setSelectedMode("voice")}
              className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                selectedMode === "voice"
                  ? "bg-cyan-600/25 border-cyan-500 text-white shadow-lg shadow-cyan-600/20"
                  : "bg-white/[0.02] border-white/5 text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="absolute -top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 uppercase">
                Hot
              </span>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedMode === "voice" ? "bg-cyan-500 text-slate-950" : "bg-white/5 text-slate-400"}`}>
                <Mic className="w-5 h-5" />
              </div>
              <span className="text-xs sm:text-sm font-semibold">Voice Call</span>
            </button>

            {/* Video Cam */}
            <button
              type="button"
              onClick={() => setSelectedMode("video")}
              className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                selectedMode === "video"
                  ? "bg-rose-600/25 border-rose-500 text-white shadow-lg shadow-rose-600/20"
                  : "bg-white/[0.02] border-white/5 text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedMode === "video" ? "bg-rose-600 text-white" : "bg-white/5 text-slate-400"}`}>
                <Video className="w-5 h-5" />
              </div>
              <span className="text-xs sm:text-sm font-semibold">Video Cam</span>
            </button>

            {/* Chat Rooms */}
            <button
              type="button"
              onClick={() => setSelectedMode("rooms")}
              className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                selectedMode === "rooms"
                  ? "bg-emerald-600/25 border-emerald-500 text-white shadow-lg shadow-emerald-600/20"
                  : "bg-white/[0.02] border-white/5 text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedMode === "rooms" ? "bg-emerald-600 text-white" : "bg-white/5 text-slate-400"}`}>
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-xs sm:text-sm font-semibold">Chat Rooms</span>
            </button>

          </div>

          {/* Quick Input Form with Name, Gender & Age */}
          <form onSubmit={handleStart} className="space-y-4">
            
            {/* Row 1: Name and Age */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              
              {/* Name / Nickname */}
              <div className="sm:col-span-2">
                <label htmlFor="name" className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-purple-400" />
                  <span>Your Name / Nickname</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul, StarGazer, Shadow..."
                  maxLength={25}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition text-sm"
                />
              </div>

              {/* Age (18+) */}
              <div>
                <label htmlFor="age" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Age <span className="text-rose-400 font-bold">(18+)</span>
                </label>
                <select
                  id="age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-purple-500 transition text-sm cursor-pointer"
                >
                  {Array.from({ length: 43 }, (_, i) => i + 18).map((num) => (
                    <option key={num} value={num} className="bg-[#12121e] text-white">
                      {num} years
                    </option>
                  ))}
                  <option value="60+" className="bg-[#12121e] text-white">60+ years</option>
                </select>
              </div>

            </div>

            {/* Row 2: Gender Selector */}
            <div className="text-left">
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Your Gender
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "male", label: "Male", icon: "👨" },
                  { id: "female", label: "Female", icon: "👩" },
                  { id: "other", label: "Other", icon: "🌈" },
                  { id: "", label: "Secret", icon: "👤" },
                ].map((g) => (
                  <button
                    type="button"
                    key={g.id}
                    onClick={() => setGender(g.id as any)}
                    className={`py-2 px-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      gender === g.id
                        ? "bg-purple-600/30 border-purple-400 text-white shadow-sm"
                        : "bg-white/[0.03] border-white/5 text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span>{g.icon}</span>
                    <span>{g.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Row 3: Looking For Match Preference */}
            <div className="text-left pt-1">
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>Prefer to Connect With:</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "any", label: "Anyone (Fastest)", icon: "👥" },
                  { id: "female", label: "Female", icon: "👩" },
                  { id: "male", label: "Male", icon: "👨" },
                ].map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setLookingFor(p.id as any)}
                    className={`py-2 px-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      lookingFor === p.id
                        ? "bg-cyan-600/30 border-cyan-400 text-cyan-200"
                        : "bg-white/[0.02] border-white/5 text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span>{p.icon}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Interest Tags */}
            <div className="text-left pt-1">
              <span className="block text-xs font-medium text-slate-400 mb-2">
                Interests <span className="text-slate-500">(Optional)</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {interestsList.map((interest) => {
                  const Icon = interest.icon;
                  const isSelected = selectedInterests.includes(interest.id);

                  return (
                    <button
                      type="button"
                      key={interest.id}
                      onClick={() => toggleInterest(interest.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                        isSelected
                          ? "bg-purple-600 text-white border border-purple-400 shadow-sm"
                          : "bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{interest.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Big Launch Button */}
            <button
              type="submit"
              className="w-full py-4 px-6 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:opacity-95 glow-btn transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              <span>
                {selectedMode === "voice"
                  ? "🎙️ Start Anonymous Voice Call"
                  : selectedMode === "video"
                  ? "📹 Start Random Video Cam"
                  : selectedMode === "rooms"
                  ? "🏠 Explore Group Rooms"
                  : "💬 Start Random Text Chat"}
              </span>
              <ArrowRight className="w-5 h-5" />
            </button>

          </form>

        </div>

      </section>

      {/* Live Counter Stats Bar */}
      <section className="w-full bg-[#07070d] border-y border-white/5 py-10">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-2xl sm:text-4xl font-extrabold text-white">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse-dot inline-block" />
              <span>{online.toLocaleString()}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">Strangers Online Now</p>
          </div>

          <div className="space-y-1">
            <div className="text-2xl sm:text-4xl font-extrabold text-neon-gradient">
              {activeChats.toLocaleString()}
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">Live Active Chats</p>
          </div>

          <div className="space-y-1">
            <div className="text-2xl sm:text-4xl font-extrabold text-white">
              {countries}+
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">Countries Worldwide</p>
          </div>

          <div className="space-y-1">
            <div className="text-2xl sm:text-4xl font-extrabold text-cyan-400">
              100% Free
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">No Subscription Ever</p>
          </div>

        </div>
      </section>

      {/* 3 Step Simplicity Showcase */}
      <section className="w-full max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            How it works in <span className="text-neon-gradient">3 seconds</span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto">
            Zero friction. No sign-up forms, no email confirmation, no profile pictures.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="glass-panel p-6 sm:p-8 rounded-2xl text-left border border-white/5 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold text-lg mb-4">
              1
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Pick Your Channel</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Choose from Text, Audio Voice Call, or Video. Add optional tags like gaming or anime to find like-minded people.
            </p>
          </div>

          <div className="glass-panel p-6 sm:p-8 rounded-2xl text-left border border-white/5 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-lg mb-4">
              2
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Instant Pairing</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Our WebRTC algorithm pairs you in under a second with a real person online from anywhere in the world.
            </p>
          </div>

          <div className="glass-panel p-6 sm:p-8 rounded-2xl text-left border border-white/5 relative overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-lg mb-4">
              3
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Stay in Control</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Skip anytime with a single keypress. Instant 1-click block &amp; report if anyone violates community standards.
            </p>
          </div>

        </div>
      </section>

      {/* Trust & Safety Highlights */}
      <section className="w-full max-w-6xl mx-auto px-4 pb-20">
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-[#101917]/70 to-[#0e111a]/80">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified Safe Community</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                Built from the ground up for privacy &amp; peace of mind
              </h3>
              <p className="text-slate-300 text-sm sm:text-base max-w-xl">
                ChatSphere conversations are peer-to-peer encrypted. We do not save your chats, we do not require your identity, and bad actors are swiftly blocked by automated moderation.
              </p>
            </div>

            <Link
              href="/safety"
              className="shrink-0 px-6 py-3.5 rounded-xl text-sm font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 hover:bg-emerald-900/60 transition flex items-center gap-2"
            >
              <span>Explore Safety Center</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* AdSense Compliant Banner Slot */}
      <div className="w-full max-w-4xl mx-auto px-4 pb-12">
        <div className="w-full py-4 px-6 rounded-xl border border-dashed border-white/10 bg-white/[0.01] text-center text-xs text-slate-500">
          <span>Advertisement Space (Google AdSense Ready)</span>
        </div>
      </div>

    </div>
  );
}
