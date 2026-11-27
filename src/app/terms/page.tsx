import type { Metadata } from "next";
import { FileText, ShieldAlert, CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | TalkToStranger",
  description: "TalkToStranger terms and conditions for anonymous text, voice, and video chat.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-slate-300">
      
      {/* Header */}
      <div className="border-b border-white/10 pb-8 mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-3">
          <FileText className="w-3.5 h-3.5" />
          <span>User Agreement</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-3">Terms of Service</h1>
        <p className="text-sm text-slate-400">Please read carefully before using TalkToStranger services.</p>
      </div>

      <div className="space-y-8 text-sm sm:text-base leading-relaxed">
        
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">1. Acceptance of Terms</h2>
          <p>
            By accessing or using TalkToStranger, you acknowledge that you have read, understood, and agreed to be bound by these Terms of Service. If you do not agree to every clause, do not access or use the platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">2. Strict 18+ Age Requirement</h2>
          <p>
            You must be at least 18 years of age (or the legal age of majority in your jurisdiction) to use TalkToStranger. Any use of the platform by minors is strictly forbidden and constitutes a material breach of this agreement.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">3. Zero-Tolerance Prohibited Conduct</h2>
          <p>You agree not to use TalkToStranger to:</p>
          <ul className="list-disc pl-6 space-y-2 text-slate-400">
            <li>Transmit any child sexual abuse material (CSAM) or exploit minors in any capacity. Violators will be immediately reported to law enforcement agencies and NCMEC.</li>
            <li>Harass, stalk, threaten, or bully other users.</li>
            <li>Broadcast non-consensual sexual content, violence, animal cruelty, or self-harm.</li>
            <li>Transmit malicious software, worms, viruses, or automated bot scripts.</li>
            <li>Engage in financial scams, phishing, or unsolicited commercial advertisements.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">4. Disclaimers &amp; Limitation of Liability</h2>
          <p>
            TalkToStranger is provided strictly on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind. We do not screen all real-time peer transmissions in advance. You understand that you communicate with anonymous strangers at your own discretion and risk.
          </p>
        </section>

        <section className="space-y-3 pt-6 border-t border-white/10">
          <h2 className="text-xl font-bold text-white">5. Violations &amp; Termination</h2>
          <p className="text-slate-400">
            We reserve the right to ban or block IP ranges or client tokens without notice for violations of these Terms. For support, contact{" "}
            <a href="mailto:support@talktostranger.online" className="text-purple-400 underline">
              support@talktostranger.online
            </a>
          </p>
        </section>

      </div>
    </div>
  );
}
