"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  MessageSquare, 
  Mic, 
  Video, 
  Compass, 
  ShieldCheck, 
  Menu, 
  X,
  Sparkles,
  Radio
} from "lucide-react";
import { useLiveCounter } from "@/hooks/useLiveCounter";
import { InstallAppButton } from "@/components/InstallAppButton";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { online } = useLiveCounter();

  const navLinks = [
    { name: "Random Text", href: "/chat", icon: MessageSquare },
    { name: "Voice Call", href: "/voice", icon: Mic, highlight: true },
    { name: "Video Cam", href: "/video", icon: Video },
    { name: "City Rooms", href: "/chatrooms", icon: Radio },
    { name: "Chat Rooms", href: "/rooms", icon: Compass },
    { name: "Safety", href: "/safety", icon: ShieldCheck },
  ];

  const mobileModeTabs = [
    { name: "Text", href: "/chat", icon: MessageSquare },
    { name: "Voice", href: "/voice", icon: Mic, live: true },
    { name: "Video", href: "/video", icon: Video },
    { name: "City", href: "/chatrooms", icon: Radio },
    { name: "Rooms", href: "/rooms", icon: Compass },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full bg-[#09090f]/90 backdrop-blur-md border-b border-white/5 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white glow-purple group-hover:scale-105 transition duration-200 shrink-0">
            <MessageSquare className="w-4 h-4 fill-white/20" />
          </div>
          <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white whitespace-nowrap">
            TalkTo<span className="text-neon-gradient">Stranger</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex items-center gap-0.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs xl:text-sm font-medium whitespace-nowrap transition duration-150 ${
                  isActive
                    ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                    : link.highlight
                    ? "text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-purple-400" : link.highlight ? "text-cyan-400" : "text-slate-400"}`} />
                <span>{link.name}</span>
                {link.highlight && (
                  <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Live
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Right CTA + Live Badge */}
        <div className="hidden sm:flex items-center gap-2.5 shrink-0">
          {/* Live Counter Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-medium text-slate-300 whitespace-nowrap" title="Active users worldwide">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot shrink-0"></span>
            <span><strong className="text-emerald-400 font-bold">{online.toLocaleString()}</strong> online</span>
          </div>

          <InstallAppButton variant="compact" />

          {/* Quick Launch CTA */}
          <Link
            href="/chat"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-cyan-500 hover:opacity-90 transition glow-btn whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Start Chat</span>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex lg:hidden items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-medium text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot"></span>
            <span className="text-emerald-400 font-semibold">{online.toLocaleString()}</span>
          </div>

          <span className="sm:hidden">
            <InstallAppButton variant="compact" />
          </span>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile-Only Top Mode Strip */}
      <div className="lg:hidden border-t border-white/5 bg-[#09090f]/95 px-3 py-1.5 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 min-w-max">
          {mobileModeTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive =
              tab.href === "/chatrooms"
                ? pathname.startsWith("/chatrooms")
                : pathname === tab.href;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-sm"
                    : "bg-white/[0.04] border border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-white" : tab.live ? "text-cyan-400" : "text-purple-400"}`} />
                <span>{tab.name}</span>
                {tab.live && !isActive && (
                  <span className="text-[9px] uppercase font-bold tracking-wider px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 leading-none">
                    Live
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/5 bg-[#09090f] px-4 pt-3 pb-6 flex flex-col gap-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between p-3 rounded-xl text-sm font-medium ${
                  isActive
                    ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-purple-400" />
                  <span>{link.name}</span>
                </div>
                {link.highlight && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                    Live
                  </span>
                )}
              </Link>
            );
          })}

          <InstallAppButton variant="drawer" />

          <Link
            href="/chat"
            onClick={() => setMobileMenuOpen(false)}
            className="mt-1 flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-cyan-500"
          >
            <Sparkles className="w-4 h-4" />
            <span>Start Anonymous Chat</span>
          </Link>
        </div>
      )}
    </nav>
  );
}
