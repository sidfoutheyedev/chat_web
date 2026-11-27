import type { Metadata } from "next";
import { ShieldCheck, Ban, Flag, Lock, AlertTriangle, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Safety Center & Rules | TalkToStranger",
  description: "Stay safe on TalkToStranger. Learn how our instant reporting, 1-click block, and automated safety filters protect anonymous users.",
  alternates: {
    canonical: "/safety",
  },
};

export default function SafetyPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 text-slate-300">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Trust &amp; Safety Hub</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white">
          Your Safety is Our <span className="text-emerald-400">#1 Priority</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400">
          TalkToStranger is built with multiple layers of proactive defense so you can communicate anonymously with confidence.
        </p>
      </div>

      {/* 4 Pillars of Protection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/5 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">100% Peer Encryption</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            All text packets, voice streams, and video calls are transmitted over encrypted HTTPS/WSS protocols. Intermediate eavesdropping is technically prevented.
          </p>
        </div>

        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/5 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center">
            <Ban className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Instant 1-Click Block</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            If anyone makes you uncomfortable or behaves inappropriately, tap the Block button. You are instantly disconnected and will never be paired with them again.
          </p>
        </div>

        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/5 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-yellow-600/20 text-yellow-400 flex items-center justify-center">
            <Flag className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Rapid Report Review</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Reported users trigger automatic moderation review. Malicious IPs and repeat offenders are permanently blacklisted across our network.
          </p>
        </div>

        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/5 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Zero Personal Data Exposure</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Your real location, email, phone number, and name are never revealed to anyone. You chat under complete anonymity unless you choose otherwise.
          </p>
        </div>

      </div>

      {/* Community Standards Checklist */}
      <section className="glass-panel p-8 sm:p-10 rounded-3xl border border-white/10 space-y-6" id="rules">
        <h2 className="text-2xl font-bold text-white">Community Rules &amp; Best Practices</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.02]">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block">Be Respectful</strong>
              <span className="text-slate-400">Treat conversation partners with courtesy and open-mindedness.</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.02]">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block">Protect Your Privacy</strong>
              <span className="text-slate-400">Never give strangers your home address, workplace, or banking info.</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.02]">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block">No Harassment or Bullying</strong>
              <span className="text-slate-400">Hate speech, racism, or targeted harassment results in instant permanent bans.</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.02]">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block">Strictly 18+ Only</strong>
              <span className="text-slate-400">Minors are prohibited from accessing TalkToStranger services.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Report Section */}
      <section className="mt-12 text-center p-8 rounded-2xl bg-white/[0.01] border border-white/5 space-y-3" id="report">
        <h3 className="text-lg font-bold text-white">Need to report an urgent safety concern?</h3>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Contact our Trust &amp; Safety team 24/7 at{" "}
          <a href="mailto:safety@talktostranger.online" className="text-purple-400 underline font-semibold">
            safety@talktostranger.online
          </a>
          . We review and act upon urgent safety reports within hours.
        </p>
      </section>

    </div>
  );
}
