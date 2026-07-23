import Link from 'next/link';
import {
  LayoutDashboard,
  FolderKanban,
  Upload,
  CreditCard,
  Settings,
  Shield,
  Clapperboard,
} from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/workspace', label: 'Workspace', icon: FolderKanban },
  { href: '/upload', label: 'Upload', icon: Upload },
  { href: '/billing', label: 'Billing', icon: CreditCard },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/admin', label: 'Admin', icon: Shield },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-white/5 bg-ink-900/60 p-4 md:block">
        <Link href="/dashboard" className="mb-8 flex items-center gap-2 px-2 font-semibold text-white">
          <Clapperboard className="h-5 w-5 text-brand-400" /> ClipForge
        </Link>
        <nav className="space-y-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 px-6 py-8 lg:px-10">{children}</main>
    </div>
  );
}
