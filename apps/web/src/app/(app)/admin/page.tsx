import { Users, DollarSign, Cpu, HardDrive, Activity } from 'lucide-react';

const KPI = [
  { label: 'Users', value: '1,284', icon: Users },
  { label: 'MRR', value: '$8,420', icon: DollarSign },
  { label: 'Minutes processed', value: '42,190', icon: Cpu },
  { label: 'Storage used', value: '318 GB', icon: HardDrive },
];

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-brand-400" />
        <h1 className="text-2xl font-bold text-white">Admin</h1>
      </div>
      <p className="mt-1 text-sm text-slate-400">Platform health, revenue, and AI usage. Gated by ENABLE_ADMIN + admin role.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI.map((k) => (
          <div key={k.label} className="card">
            <k.icon className="h-5 w-5 text-brand-400" />
            <div className="mt-3 text-2xl font-bold text-white">{k.value}</div>
            <div className="text-sm text-slate-400">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="font-semibold text-white">System health</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            <li className="flex justify-between"><span>API</span><span className="text-emerald-400">healthy</span></li>
            <li className="flex justify-between"><span>AI service</span><span className="text-emerald-400">healthy</span></li>
            <li className="flex justify-between"><span>Queue depth</span><span className="text-slate-400">3 jobs</span></li>
            <li className="flex justify-between"><span>Redis</span><span className="text-emerald-400">up</span></li>
          </ul>
        </div>
        <div className="card">
          <h2 className="font-semibold text-white">AI usage (30d)</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            <li className="flex justify-between"><span>Clips generated</span><span>12,904</span></li>
            <li className="flex justify-between"><span>Words transcribed</span><span>4.2M</span></li>
            <li className="flex justify-between"><span>GPU seconds</span><span>18,340</span></li>
            <li className="flex justify-between"><span>Est. inference cost</span><span>$212.40</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
