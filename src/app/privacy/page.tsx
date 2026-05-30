import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Voice2WA handles your voice recordings, generated messages, payments and advertising data.",
  alternates: { canonical: "/privacy" },
};

const EFFECTIVE_DATE = "30 May 2026";
const CONTACT_EMAIL = "support@voice2wa.app";

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-zinc-800 dark:text-zinc-200">
      <Link href="/" className="text-green-600 text-sm font-semibold">← Back to Voice2WA</Link>
      <h1 className="text-3xl font-extrabold mt-6 mb-2">Privacy Policy</h1>
      <p className="text-sm text-zinc-500 mb-8">Last updated: {EFFECTIVE_DATE}</p>

      <div className="space-y-6 leading-relaxed text-[15px]">
        <p>
          Voice2WA (&quot;we&quot;, &quot;us&quot;) helps you turn voice notes into professionally
          formatted text messages. This policy explains what we collect, how we use it, and the
          third parties involved. By using Voice2WA you agree to this policy.
        </p>

        <section>
          <h2 className="text-xl font-bold mb-2">Information We Process</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Voice recordings:</strong> When you record, your audio is sent to our AI
              providers solely to transcribe and format it. We do <strong>not</strong> store your
              audio on our servers after processing.
            </li>
            <li>
              <strong>Generated messages &amp; history:</strong> Your formatted messages and history
              are stored <strong>locally in your browser</strong> (localStorage) on your device. We
              do not upload or store them on our servers.
            </li>
            <li>
              <strong>Usage counters &amp; plan status:</strong> Stored locally in your browser to
              enforce free limits and remember your plan.
            </li>
            <li>
              <strong>Payment information:</strong> Payments are processed by Razorpay. We never see
              or store your card or UPI details; we only receive a confirmation of payment status.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">Third-Party Services</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Groq</strong> and <strong>OpenAI</strong> — speech-to-text and text formatting.</li>
            <li><strong>Razorpay</strong> — secure payment processing for upgrades.</li>
            <li><strong>Google AdSense</strong> — displays ads to support the free tier (see below).</li>
            <li><strong>Vercel</strong> — hosting and standard server logs.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">Advertising &amp; Cookies</h2>
          <p>
            We use Google AdSense. Third-party vendors, including Google, use cookies to serve ads
            based on prior visits to this and other websites. Google&apos;s use of advertising
            cookies enables it and its partners to serve ads based on your visits. You can opt out of
            personalised advertising via{" "}
            <a
              className="text-green-600 underline"
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Ads Settings
            </a>
            . For more, see{" "}
            <a
              className="text-green-600 underline"
              href="https://policies.google.com/technologies/ads"
              target="_blank"
              rel="noopener noreferrer"
            >
              How Google uses information from sites that use its services
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">Data Retention</h2>
          <p>
            Audio is processed transiently and not retained by us. Your message history and settings
            live only in your browser and can be cleared anytime from the History panel or by
            clearing your browser storage.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">Children</h2>
          <p>Voice2WA is intended for users aged 13 and above and is not directed at children.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">Your Rights</h2>
          <p>
            Because your content stays on your device, you control it directly. For questions about
            data we may process (e.g. server logs), contact us below.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">Changes</h2>
          <p>We may update this policy. Material changes will be reflected by the date above.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">Contact</h2>
          <p>
            Questions? Email us at{" "}
            <a className="text-green-600 underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
