import Link from 'next/link';
import { Clapperboard } from 'lucide-react';

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-900/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-white">
          <Clapperboard className="h-5 w-5 text-brand-400" />
          ClipForge
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
          <Link href="/#features" className="hover:text-white">Features</Link>
          <Link href="/pricing" className="hover:text-white">Pricing</Link>
          <Link href="/#pipeline" className="hover:text-white">Pipeline</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-slate-300 hover:text-white">Sign in</Link>
          <Link href="/login" className="btn-primary !px-4 !py-2 text-sm">Start free</Link>
        </div>
      </div>
    </header>
  );
}
