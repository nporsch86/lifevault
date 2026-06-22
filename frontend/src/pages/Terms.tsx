import { FileText, CheckCircle, AlertTriangle, Ban, Mail } from 'lucide-react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#0f1115] text-slate-200 py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center space-x-4 mb-12">
          <FileText className="w-10 h-10 text-blue-500" />
          <h1 className="text-4xl font-black text-white tracking-tight">Terms of Service</h1>
        </div>
        <p className="text-slate-500 text-sm mb-8">Last updated: October 2025</p>

        <div className="space-y-10">
          <Section icon={CheckCircle} title="What You Get">
            <p>Lifevault provides a digital life planner with calendar views, tasks, notes, expense tracking, and related features. The free tier includes basic functionality. Premium subscriptions unlock additional features as described on the pricing page.</p>
          </Section>

          <Section icon={AlertTriangle} title="What We Expect">
            <p>You agree to use Lifevault for lawful purposes only. Don't store illegal content, attempt to break the app, or share your account credentials.</p>
            <p className="mt-2">You're responsible for backing up important data. While we provide cloud sync, we recommend keeping independent backups of critical information.</p>
          </Section>

          <Section icon={Ban} title="Limitations">
            <p>Lifevault is provided "as is" without warranty. We're not liable for missed appointments, data loss, or any damages arising from use of the app.</p>
            <p className="mt-2">We reserve the right to modify or discontinue features with reasonable notice (email for paid subscribers, in-app notice for free users).</p>
          </Section>

          <Section icon={CheckCircle} title="Subscriptions & Refunds">
            <p>Premium subscriptions billed monthly or annually auto-renew unless cancelled. You can cancel anytime — access continues until the end of the billing period.</p>
            <p className="mt-2">Refunds are handled on a case-by-case basis. Contact us within 7 days of purchase for issues.</p>
            <p className="mt-2">Lifetime access is a one-time purchase for the lifetime of the product as offered at the time of purchase.</p>
          </Section>

          <Section icon={Mail} title="Contact">
            <p>Questions or concerns? Email: <a href="mailto:lifevault-49b38e18@ctomail.io" className="text-blue-500 hover:text-blue-400">lifevault-49b38e18@ctomail.io</a></p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-slate-800 pb-8">
      <div className="flex items-center space-x-3 mb-4">
        <Icon className="w-5 h-5 text-blue-500" />
        <h2 className="text-xl font-black text-white">{title}</h2>
      </div>
      <div className="text-slate-400 font-medium leading-relaxed space-y-2">{children}</div>
    </div>
  );
}