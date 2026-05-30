import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of Voice2WA.",
  alternates: { canonical: "/terms" },
};

const EFFECTIVE_DATE = "30 May 2026";
const CONTACT_EMAIL = "support@voice2wa.app";

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-zinc-800 dark:text-zinc-200">
      <Link href="/" className="text-green-600 text-sm font-semibold">← Back to Voice2WA</Link>
      <h1 className="text-3xl font-extrabold mt-6 mb-2">Terms of Service</h1>
      <p className="text-sm text-zinc-500 mb-8">Last updated: {EFFECTIVE_DATE}</p>

      <div className="space-y-6 leading-relaxed text-[15px]">
        <section>
          <h2 className="text-xl font-bold mb-2">1. Acceptance</h2>
          <p>By accessing or using Voice2WA, you agree to these Terms. If you do not agree, please do not use the service.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">2. The Service</h2>
          <p>
            Voice2WA converts your voice notes into formatted text messages using AI. Output is
            generated automatically and may contain errors — always review messages before sending.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">3. Acceptable Use</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Do not use Voice2WA for unlawful, harmful, hateful, or fraudulent content.</li>
            <li>Do not attempt to disrupt, reverse engineer, or abuse the service or its APIs.</li>
            <li>You are responsible for the content you create and where you send it.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">4. Plans &amp; Payments</h2>
          <p>
            Voice2WA offers a free tier with daily limits and paid plans (Pro and Lifetime) processed
            securely via Razorpay. Prices are shown at checkout in INR. Subscription plans renew for
            the stated period unless cancelled. For billing questions, contact us.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">5. AI Output Disclaimer</h2>
          <p>
            We do not guarantee the accuracy, completeness, or suitability of AI-generated messages.
            You use the output at your own discretion and risk.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">6. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Voice2WA is provided &quot;as is&quot; without
            warranties, and we are not liable for any indirect or consequential damages arising from
            its use.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">7. Changes</h2>
          <p>We may update these Terms from time to time. Continued use means you accept the changes.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">8. Contact</h2>
          <p>
            Email{" "}
            <a className="text-green-600 underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
