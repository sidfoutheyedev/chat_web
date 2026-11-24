"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldAlert, CheckCircle2, XCircle } from "lucide-react";

export function AgeGateModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const verified = localStorage.getItem("cs_age_verified");
    if (!verified) {
      setIsOpen(true);
    }
  }, []);

  const handleConfirm = () => {
    localStorage.setItem("cs_age_verified", "true");
    setIsOpen(false);
  };

  const handleDecline = () => {
    window.location.href = "https://www.google.com";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl glass-panel border border-purple-500/30 text-center shadow-2xl shadow-purple-950/50">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-rose-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/30">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
          Adults Only (18+)
        </h2>

        <p className="text-sm text-slate-300 leading-relaxed mb-6">
          ChatSphere is designed strictly for adults. By clicking enter, you confirm that you are at least{" "}
          <strong className="text-purple-400">18 years of age</strong> and agree to our{" "}
          <Link href="/terms" className="text-cyan-400 underline hover:text-cyan-300">
            Terms of Service
          </Link>
          ,{" "}
          <Link href="/privacy" className="text-cyan-400 underline hover:text-cyan-300">
            Privacy Policy
          </Link>
          , and{" "}
          <Link href="/safety" className="text-cyan-400 underline hover:text-cyan-300">
            Community Rules
          </Link>
          .
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleConfirm}
            className="w-full py-3.5 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 glow-btn transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            I am 18 or older — Enter
          </button>

          <button
            onClick={handleDecline}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <XCircle className="w-4 h-4" />
            I am under 18 (Exit)
          </button>
        </div>

        <p className="mt-5 text-xs text-slate-400">
          Zero tolerance for harassment, hate speech, or non-consensual content.
        </p>
      </div>
    </div>
  );
}
