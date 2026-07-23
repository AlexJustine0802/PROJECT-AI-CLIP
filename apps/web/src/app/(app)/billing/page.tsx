import { Coins, Plus, FileText } from 'lucide-react';

const HISTORY = [
  { type: 'Monthly allocation', amount: '+30', date: 'Jul 1' },
  { type: 'Usage · Founder interview', amount: '-6', date: 'Jul 12' },
  { type: 'Top-up', amount: '+100', date: 'Jul 15' },
];

export default function BillingPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-white">Billing & credits</h1>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="card md:col-span-1">
          <Coins className="h-6 w-6 text-brand-400" />
          <div className="mt-3 text-3xl font-bold text-white">124</div>
          <div className="text-sm text-slate-400">credits available</div>
          <button className="btn-primary mt-4 w-full !py-2 text-sm"><Plus className="mr-2 h-4 w-4" /> Top up</button>
        </div>
        <div className="card md:col-span-2">
          <h2 className="font-semibold text-white">Current plan: Pro</h2>
          <p className="mt-1 text-sm text-slate-400">$19 / month · 500 credits · renews Aug 1</p>
          <div className="mt-4 flex gap-3">
            <button className="btn-ghost !py-2 text-sm">Change plan</button>
            <button className="btn-ghost !py-2 text-sm">Cancel</button>
          </div>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold text-white">Wallet history</h2>
      <div className="mt-4 divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10">
        {HISTORY.map((h, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-3 text-sm">
            <span className="text-slate-300">{h.type}</span>
            <div className="flex items-center gap-6">
              <span className="text-slate-500">{h.date}</span>
              <span className={h.amount.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}>{h.amount}</span>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-semibold text-white">Invoices</h2>
      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 px-5 py-4 text-sm text-slate-300">
        <FileText className="h-4 w-4 text-slate-500" /> July 2026 · $19.00 · Paid
      </div>
    </div>
  );
}
