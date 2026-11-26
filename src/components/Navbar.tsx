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

  return (
    <nav className="sticky top-0 z-40 w-full bg-[#09090f]/90 backdrop-blur-md border-b border-white/5 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white glow-purple group-hover:scale-105 transition duration-200">
            <MessageSquare className="w-5 h-5 fill-white/20" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight text-white flex items-center">
              TalkTo<span className="text-neon-gradient">Stranger</span>
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition duration-150 ${
                  isActive
                    ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                    : link.highlight
                    ? "text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-purple-400" : link.highlight ? "text-cyan-400" : "text-slate-400"}`} />
                <span>{link.name}</span>
                {link.highlight && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Live
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Right CTA + Live Badge */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Live Counter Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-medium text-slate-300" title="Active users worldwide">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot"></span>
            <span><strong className="text-emerald-400 font-bold">{online.toLocaleString()}</strong> online</span>
          </div>

          {/* Quick Launch CTA */}
          <Link
            href="/chat"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-cyan-500 hover:opacity-90 transition glow-btn"
          >
            <Sparkles className="w-4 h-4" />
            <span>Start Chat</span>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-medium text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot"></span>
            <span className="text-emerald-400 font-semibold">{online.toLocaleString()}</span>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/5 bg-[#09090f] px-4 pt-3 pb-6 flex flex-col gap-2">
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

          <Link
            href="/chat"
            onClick={() => setMobileMenuOpen(false)}
            className="mt-3 flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-cyan-500"
          >
            <Sparkles className="w-4 h-4" />
            <span>Start Anonymous Chat</span>
          </Link>
        </div>
      )}
    </nav>
  );
}
