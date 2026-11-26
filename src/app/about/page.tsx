import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquare, Heart, Globe2, ShieldCheck, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us | TalkToStranger",
  description: "Learn about TalkToStranger, our mission to connect human beings across the world anonymously, safely, and effortlessly.",
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-slate-300">
      
      {/* Header */}
      <div className="border-b border-white/10 pb-8 mb-10 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-3">
          <Heart className="w-3.5 h-3.5 text-rose-400" />
          <span>Our Story &amp; Purpose</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-3">
          About <span className="text-neon-gradient">TalkToStranger</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400">
          Reinventing spontaneous, genuine stranger conversation for the modern web.
        </p>
      </div>

      <div className="space-y-10 text-sm sm:text-base leading-relaxed">
        
        {/* Mission Card */}
        <section className="glass-panel p-8 rounded-3xl border border-white/10 space-y-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>🌍</span> Our Mission
          </h2>
          <p className="text-slate-300">
            Social media today is filled with algorithms, follower counts, and filtered personas. People rarely get to talk to real humans without preconceived expectations.
          </p>
          <p className="text-slate-300">
            TalkToStranger was created to revive the magic of spontaneous, anonymous human interaction. Whether you want to practice a foreign language, discuss anime, seek advice from someone across the globe, or just laugh during a late night, we provide the cleanest, safest, zero-friction canvas for that conversation to happen.
          </p>
        </section>

        {/* 3 Core Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-2">
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-bold text-white">Zero Friction</h3>
            <p className="text-xs text-slate-400">
              No account creation, no password to remember. Open the site and you are chatting in 1 second.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-2">
            <div className="text-2xl mb-2">🔒</div>
            <h3 className="font-bold text-white">Complete Privacy</h3>
            <p className="text-xs text-slate-400">
              Zero message archiving. Conversations happen purely in memory and evaporate upon disconnect.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-2">
            <div className="text-2xl mb-2">🎙️</div>
            <h3 className="font-bold text-white">Multi-Channel</h3>
            <p className="text-xs text-slate-400">
              Freedom to switch seamlessly between fast text, private voice call, and camera streams.
            </p>
          </div>
        </div>

        {/* Call to action */}
        <section className="text-center pt-8 border-t border-white/10 space-y-4">
          <h3 className="text-xl font-bold text-white">Ready to talk to someone new?</h3>
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 to-cyan-500 glow-btn"
          >
            <span>Start a Free Chat</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

      </div>
    </div>
  );
}
