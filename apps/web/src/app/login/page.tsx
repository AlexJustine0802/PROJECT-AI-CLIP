'use client';
import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Clapperboard, Github, Chrome } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('demo@clipforge.local');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await signIn('credentials', { email, password, redirect: false, callbackUrl: '/dashboard' });
    if (res?.error) setError('Invalid credentials');
    else window.location.href = '/dashboard';
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="card w-full max-w-md">
        <div className="flex items-center gap-2 text-white">
          <Clapperboard className="h-6 w-6 text-brand-400" />
          <span className="text-xl font-semibold">ClipForge</span>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-white">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-400">Sign in to your workspace.</p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button onClick={() => signIn('google', { callbackUrl: '/dashboard' })} className="btn-ghost !py-2.5 text-sm">
            <Chrome className="mr-2 h-4 w-4" /> Google
          </button>
          <button onClick={() => signIn('github', { callbackUrl: '/dashboard' })} className="btn-ghost !py-2.5 text-sm">
            <Github className="mr-2 h-4 w-4" /> GitHub
          </button>
        </div>

        <div className="my-6 flex items-center gap-3 text-xs text-slate-500">
          <div className="h-px flex-1 bg-white/10" /> or <div className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-3 text-sm outline-none focus:border-brand-500"
            placeholder="you@example.com"
          />
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-3 text-sm outline-none focus:border-brand-500"
            placeholder="••••••••"
          />
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <button type="submit" className="btn-primary w-full">Sign in</button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          No account? <Link href="/login" className="text-brand-400">Create one</Link>
        </p>
        <p className="mt-2 text-center text-xs text-slate-500">Demo: demo@clipforge.local / password123</p>
      </div>
    </div>
  );
}
