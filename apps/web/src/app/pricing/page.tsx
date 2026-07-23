import Link from 'next/link';
import { Check } from 'lucide-react';
import { Nav } from '@/components/Nav';

const PLANS = [
  { tier: 'Free', price: '$0', credits: '30 credits / mo', features: ['1080p export', 'Story detection', 'Editable reasoning', 'Community support'] },
  { tier: 'Pro', price: '$19', credits: '500 credits / mo', highlight: true, features: ['1440p export', 'Clip series', 'All editing styles', 'Priority queue'] },
  { tier: 'Business', price: '$49', credits: '2,000 credits / mo', features: ['4K export', 'AI profiles', 'Team seats', 'Analytics dashboard'] },
  { tier: 'Enterprise', price: 'Custom', credits: 'Unlimited', features: ['SSO / SAML', 'Dedicated workers', 'SLA', 'Custom models'] },
];

export default function PricingPage() {
  return (
    <div>
      <Nav />
      <main className="mx-auto max-w-6xl px-6 py-20">
        <h1 className="text-center text-4xl font-bold text-white">Simple, credit-based pricing</h1>
        <p className="mt-4 text-center text-slate-400">Subscribe for monthly credits, or top up a credit wallet any time.</p>
        <div className="mt-14 grid gap-6 lg:grid-cols-4">
          {PLANS.map((p) => (
            <div key={p.tier} className={`card flex flex-col ${p.highlight ? 'ring-2 ring-brand-500' : ''}`}>
              <h3 className="text-lg font-semibold text-white">{p.tier}</h3>
              <div className="mt-4 text-4xl font-bold text-white">{p.price}<span className="text-base font-normal text-slate-400">/mo</span></div>
              <p className="mt-1 text-sm text-brand-300">{p.credits}</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-300">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> {f}</li>
                ))}
              </ul>
              <Link href="/login" className={`mt-8 ${p.highlight ? 'btn-primary' : 'btn-ghost'}`}>
                {p.tier === 'Enterprise' ? 'Contact us' : 'Get started'}
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
