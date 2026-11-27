"use client";

import { useEffect, useState } from "react";
import { Download, Share, MoreVertical, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallAppButton({ variant = "compact" }: { variant?: "compact" | "drawer" }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) {
      setIsInstalled(true);
      return;
    }

    const ua = window.navigator.userAgent;
    setIsIos(/iPad|iPhone|iPod/.test(ua));

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowGuide(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (isInstalled) return null;

  const handleClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
      return;
    }
    // Fallback if browser suppressed native prompt or on iOS Safari
    setShowGuide(true);
  };

  return (
    <>
      {variant === "drawer" ? (
        <button
          type="button"
          onClick={handleClick}
          className="flex items-center justify-between p-3 rounded-xl text-sm font-semibold text-cyan-300 bg-cyan-500/10 border border-cyan-500/25 hover:bg-cyan-500/20 transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 text-cyan-400" />
            <span>Install App on Phone</span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
            PWA
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-200 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
          title="Install TalkToStranger App"
        >
          <Download className="w-3.5 h-3.5 text-purple-300 shrink-0" />
          <span>Install</span>
        </button>
      )}

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm p-5 rounded-2xl glass-panel border border-purple-500/30 text-left space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-purple-400" />
                <span>Install TalkToStranger App</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIos ? (
              <ol className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-400">1.</span>
                  <span>
                    Safari ke bottom bar mein <Share className="w-3.5 h-3.5 inline text-cyan-400 mx-0.5" /> <strong>Share</strong> button par tap karein.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-400">2.</span>
                  <span>
                    Neeche scroll karke <strong>&ldquo;Add to Home Screen&rdquo;</strong> select karein.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-400">3.</span>
                  <span>
                    Top-right mein <strong>Add</strong> par tap karein — app home screen par aa jayega!
                  </span>
                </li>
              </ol>
            ) : (
              <ol className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-400">1.</span>
                  <span>
                    Browser ke top-right mein <MoreVertical className="w-3.5 h-3.5 inline text-cyan-400 mx-0.5" /> <strong>Menu (3 dots)</strong> par tap karein.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-400">2.</span>
                  <span>
                    <strong>&ldquo;Install app&rdquo;</strong> ya <strong>&ldquo;Add to Home screen&rdquo;</strong> par tap karein.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-purple-400">3.</span>
                  <span>
                    <strong>Install</strong> confirm karein — app bina browser bar ke phone mein khulega!
                  </span>
                </li>
              </ol>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-purple-600 to-cyan-500 cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
