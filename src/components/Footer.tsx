import Link from "next/link";
import { MessageSquare, ShieldCheck, Lock, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full bg-[#07070b] border-t border-white/5 pt-16 pb-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white glow-purple">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                Chat<span className="text-neon-gradient">Sphere</span>
              </span>
            </Link>

            <p className="text-sm text-slate-400 leading-relaxed">
              Modern anonymous stranger chat. Connect with verified adults worldwide across text, voice call, and video webcam. 100% free with no sign-up required.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-xs text-slate-300">
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              <span>SSL Encrypted &amp; Privacy First</span>
            </div>
          </div>

          {/* Chat Products */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold tracking-wider uppercase text-slate-300">
              Communication
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/chat" className="hover:text-purple-400 transition">
                  Random Text Chat
                </Link>
              </li>
              <li>
                <Link href="/voice" className="hover:text-cyan-400 transition flex items-center gap-1.5">
                  <span>Voice Call</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-semibold">New</span>
                </Link>
              </li>
              <li>
                <Link href="/video" className="hover:text-purple-400 transition">
                  Random Video Cam
                </Link>
              </li>
              <li>
                <Link href="/rooms" className="hover:text-purple-400 transition">
                  Topic Chat Rooms
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust & Safety */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold tracking-wider uppercase text-slate-300">
              Trust &amp; Safety
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/safety" className="hover:text-purple-400 transition flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Safety Center</span>
                </Link>
              </li>
              <li>
                <Link href="/safety#rules" className="hover:text-purple-400 transition">
                  Community Standards
                </Link>
              </li>
              <li>
                <Link href="/safety#report" className="hover:text-purple-400 transition">
                  Report Abuse
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-purple-400 transition">
                  About ChatSphere
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal (Essential for AdSense) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold tracking-wider uppercase text-slate-300">
              Legal &amp; Compliance
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/privacy" className="hover:text-purple-400 transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-purple-400 transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy#cookies" className="hover:text-purple-400 transition">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <span className="text-xs text-rose-400/90 font-semibold flex items-center gap-1">
                  🔞 18+ Adults Only Platform
                </span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} ChatSphere. All rights reserved. Strictly 18+.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-slate-400 transition">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-400 transition">Terms</Link>
            <Link href="/safety" className="hover:text-slate-400 transition">Safety</Link>
            <span className="text-slate-600 flex items-center gap-1">
              Built with <Heart className="w-3 h-3 text-rose-500 inline fill-rose-500" /> for genuine connections
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
