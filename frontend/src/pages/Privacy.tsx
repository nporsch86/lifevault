import { Shield, Mail, Database, Lock, Eye, Trash2 } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#0f1115] text-slate-200 py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center space-x-4 mb-12">
          <Shield className="w-10 h-10 text-blue-500" />
          <h1 className="text-4xl font-black text-white tracking-tight">Privacy Policy</h1>
        </div>
        <p className="text-slate-500 text-sm mb-8">Last updated: October 2025</p>

        <div className="space-y-10">
          <Section icon={Database} title="What We Collect">
            <p>Lifevault stores the data you enter: calendar events, tasks, notes, expenses, and settings. This data lives in your browser's local storage and is optionally synced to our cloud servers if you create an account.</p>
            <p className="mt-2">We collect your email address if you sign up for the waitlist, create an account, or purchase a subscription.</p>
          </Section>

          <Section icon={Lock} title="How We Use It">
            <p>Your data is used solely to power the Lifevault app — display your planner, sync across devices, and provide AI summaries (if enabled). We never sell your data.</p>
          </Section>

          <Section icon={Eye} title="Data Sharing">
            <p>If you use calendar sharing, the specific events you choose to share are visible to the people you invite. No data is shared outside of that.</p>
            <p className="mt-2">We use Stripe to process payments. Stripe handles your payment details — we never see or store credit card numbers.</p>
          </Section>

          <Section icon={Trash2} title="Data Deletion">
            <p>You can delete your data at any time through Settings → Reset All Data. To delete your account entirely, email us and we'll remove everything within 14 days.</p>
          </Section>

          <Section icon={Mail} title="Contact">
            <p>Questions? Email us at: <a href="mailto:lifevault-49b38e18@ctomail.io" className="text-blue-500 hover:text-blue-400">lifevault-49b38e18@ctomail.io</a></p>
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