'use client';
import { useState } from 'react';
import { signOut } from 'next-auth/react';

const STYLES = ['auto', 'podcast', 'educational', 'gaming', 'interview', 'vlog', 'news'];

export default function SettingsPage() {
  const [style, setStyle] = useState('auto');
  const [twoFA, setTwoFA] = useState(false);
  const [minQuality, setMinQuality] = useState(60);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      <section className="card mt-6">
        <h2 className="font-semibold text-white">AI profile</h2>
        <p className="mt-1 text-sm text-slate-400">ClipForge learns your preferences to assist your editing.</p>
        <div className="mt-4">
          <label className="text-sm text-slate-300">Preferred editing style</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {STYLES.map((s) => (
              <button key={s} onClick={() => setStyle(s)}
                className={`rounded-lg px-3 py-1.5 text-sm capitalize ${style === s ? 'bg-brand-600 text-white' : 'border border-white/10 text-slate-300'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-6">
          <label className="flex items-center justify-between text-sm text-slate-300">
            Minimum clip quality to surface: <span className="text-white">{minQuality}</span>
          </label>
          <input type="range" min={0} max={100} value={minQuality} onChange={(e) => setMinQuality(+e.target.value)} className="mt-2 w-full accent-brand-500" />
        </div>
      </section>

      <section className="card mt-6">
        <h2 className="font-semibold text-white">Security</h2>
        <label className="mt-4 flex items-center justify-between text-sm text-slate-300">
          Two-factor authentication (2FA)
          <input type="checkbox" checked={twoFA} onChange={(e) => setTwoFA(e.target.checked)} className="h-4 w-4 accent-brand-500" />
        </label>
        <p className="mt-2 text-xs text-slate-500">Sessions are managed via Auth.js. Connected: Google, GitHub, Email.</p>
      </section>

      <button onClick={() => signOut({ callbackUrl: '/' })} className="btn-ghost mt-6">Sign out</button>
    </div>
  );
}
