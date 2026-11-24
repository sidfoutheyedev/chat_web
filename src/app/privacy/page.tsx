import type { Metadata } from "next";
import { ShieldCheck, Lock, EyeOff } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | ChatSphere",
  description: "Learn how ChatSphere protects user anonymity, handles zero message storage, and complies with Google AdSense and global privacy standards.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-slate-300">
      
      {/* Header */}
      <div className="border-b border-white/10 pb-8 mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-3">
          <Lock className="w-3.5 h-3.5" />
          <span>Legal Document</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-3">Privacy Policy</h1>
        <p className="text-sm text-slate-400">Effective Date: January 1, 2026 · Last Updated: 2026</p>
      </div>

      <div className="space-y-8 text-sm sm:text-base leading-relaxed">
        
        {/* Intro */}
        <section className="p-6 rounded-2xl bg-purple-950/20 border border-purple-500/20">
          <p className="font-medium text-purple-200">
            ChatSphere is built on a strict <strong>Privacy-First &amp; Ephemeral Architecture</strong>. 
            We do not require accounts, we do not store chat logs, and your communications are deleted immediately when your connection closes.
          </p>
        </section>

        {/* 1. Information We Collect */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">1. Information We Do (and Do Not) Collect</h2>
          <p>
            <strong>What we DO NOT collect:</strong> We do not require your real name, email address, phone number, passwords, social media accounts, or credit card details.
          </p>
          <p>
            <strong>What we collect for technical operations:</strong>
          </p>
          <ul className="list-disc pl-6 space-y-1 text-slate-400">
            <li>Temporary IP address (used solely for abuse mitigation and server rate-limiting, purged on automated cycles).</li>
            <li>Browser user-agent and device viewport (to render responsive WebRTC views).</li>
            <li>Local browser storage keys (such as confirming you are 18+ so the age verification prompt doesn&apos;t bother you on every click).</li>
          </ul>
        </section>

        {/* 2. Chat Data Ephemerality */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">2. Ephemeral Chat Messages &amp; Audio Streams</h2>
          <p>
            All text messages, voice calls, and video streams sent through ChatSphere are strictly peer-to-peer or transient socket relays. We do not record, archive, index, or sell any chat transcripts or audio recordings. Once you click &quot;Skip&quot; or close your tab, the session data ceases to exist on our servers.
          </p>
        </section>

        {/* 3. Google AdSense & Third-Party Cookies */}
        <section className="space-y-3" id="cookies">
          <h2 className="text-xl font-bold text-white">3. Advertising &amp; Google AdSense Compliance</h2>
          <p>
            ChatSphere displays third-party advertisements via Google AdSense to maintain free servers for users worldwide.
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-400">
            <li>
              Google, as a third-party vendor, uses cookies to serve ads on our site based on users&apos; prior visits to this and other websites across the Internet.
            </li>
            <li>
              Google&apos;s use of advertising cookies enables it and its partners to serve personalized or non-personalized ads to our visitors.
            </li>
            <li>
              Users may opt out of personalized advertising by visiting{" "}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 underline hover:text-cyan-300"
              >
                Google Ad Settings
              </a>{" "}
              or via{" "}
              <a
                href="https://www.aboutads.info/choices/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 underline hover:text-cyan-300"
              >
                aboutads.info
              </a>
              .
            </li>
          </ul>
        </section>

        {/* 4. Children's Online Privacy */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">4. Underage Users &amp; COPPA</h2>
          <p>
            ChatSphere is strictly for users aged <strong>18 and older</strong>. We enforce an age gate upon entry. We do not knowingly permit minors to use this service. If we become aware that someone under 18 is accessing the platform, their access is terminated immediately.
          </p>
        </section>

        {/* 5. Contact */}
        <section className="space-y-3 pt-6 border-t border-white/10">
          <h2 className="text-xl font-bold text-white">5. Contact Our Privacy Officer</h2>
          <p className="text-slate-400">
            For privacy inquiries, DMCA notices, or legal requests, reach out directly to:{" "}
            <a href="mailto:privacy@chatsphere.com" className="text-purple-400 underline">
              privacy@chatsphere.com
            </a>
          </p>
        </section>

      </div>
    </div>
  );
}
