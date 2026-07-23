import Link from 'next/link';
import { Upload, Clock, HardDrive, Coins, Film } from 'lucide-react';

const STATS = [
  { label: 'Credits', value: '30', icon: Coins, hint: 'Free plan' },
  { label: 'Projects', value: '3', icon: Film, hint: '2 active' },
  { label: 'In queue', value: '1', icon: Clock, hint: 'Transcribing' },
  { label: 'Storage', value: '1.2 GB', icon: HardDrive, hint: 'of 3 GB' },
];

const RECENT = [
  { name: 'Founder interview.mp4', status: 'READY', clips: 6, style: 'Interview' },
  { name: 'Podcast ep. 42.mp4', status: 'PROCESSING', clips: 0, style: 'Podcast' },
  { name: 'Product demo.mov', status: 'READY', clips: 4, style: 'Educational' },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">Your projects, queue, and usage at a glance.</p>
        </div>
        <Link href="/upload" className="btn-primary !py-2.5"><Upload className="mr-2 h-4 w-4" /> New upload</Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="card">
            <s.icon className="h-5 w-5 text-brand-400" />
            <div className="mt-3 text-2xl font-bold text-white">{s.value}</div>
            <div className="text-sm text-slate-400">{s.label}</div>
            <div className="mt-1 text-xs text-slate-500">{s.hint}</div>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-lg font-semibold text-white">Recent uploads</h2>
      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              <th className="px-5 py-3 font-medium">Video</th>
              <th className="px-5 py-3 font-medium">Style</th>
              <th className="px-5 py-3 font-medium">Clips</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {RECENT.map((r) => (
              <tr key={r.name} className="hover:bg-white/5">
                <td className="px-5 py-3 text-white">
                  <Link href="/workspace" className="hover:text-brand-300">{r.name}</Link>
                </td>
                <td className="px-5 py-3 text-slate-400">{r.style}</td>
                <td className="px-5 py-3 text-slate-400">{r.clips}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs ${r.status === 'READY' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
