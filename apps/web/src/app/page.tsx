import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Nav } from '@/components/Nav';
import {
  Brain,
  Layers,
  MessageSquareText,
  Star,
  Activity,
  GitCompareArrows,
  Sparkles,
  Users,
} from 'lucide-react';

const DIFFERENTIATORS = [
  { icon: Brain, title: 'AI Story Detection', body: 'Finds narrative arcs, not just loud spikes — clips keep their context.' },
  { icon: Layers, title: 'Auto Clip Series', body: 'Splits one video into Part 1 / 2 / 3 that stand alone yet connect.' },
  { icon: Sparkles, title: 'Editing Styles', body: 'Podcast, Educational, Gaming, Interview, Vlog, News — style-aware selection.' },
  { icon: MessageSquareText, title: 'Editable AI Reasoning', body: 'Every clip explains why it was chosen — and you can edit that reasoning.' },
  { icon: Star, title: 'Quality Score', body: 'A 0–100 score per clip so you export only the strongest moments.' },
  { icon: Activity, title: 'Insight Timeline', body: 'Hooks, emotions, silence, and scene changes on one timeline.' },
  { icon: GitCompareArrows, title: 'Side-by-side Compare', body: 'Compare candidate clips before you commit to an export.' },
  { icon: Users, title: 'Personalized AI Profiles', body: 'Learns your editing preferences over time — assist, not autopilot.' },
];

const PIPELINE = [
  'upload', 'probe metadata', 'extract audio', 'transcribe', 'scene detect', 'silence detect',
  'story detect', 'highlight score', 'virality score', 'clip select', 'smart crop', 'subtitles',
  'captions', 'title / hashtags', 'thumbnail', 'export',
];

export default function LandingPage() {
  const t = useTranslations('landing');
  return (
    <div>
      <Nav />
      <main className="mx-auto max-w-6xl px-6">
        {/* Hero */}
        <section className="py-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-brand-300">
            <Sparkles className="h-3.5 w-3.5" /> Story-driven, not highlight-only
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-balance text-5xl font-bold leading-tight text-white">
            {t('headline')}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">{t('sub')}</p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/login" className="btn-primary">{t('cta')}</Link>
            <Link href="/#pipeline" className="btn-ghost">{t('secondary')}</Link>
          </div>
        </section>

        {/* Differentiators */}
        <section id="features" className="py-16">
          <h2 className="text-center text-3xl font-semibold text-white">What makes ClipForge different</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {DIFFERENTIATORS.map((d) => (
              <div key={d.title} className="card">
                <d.icon className="h-6 w-6 text-brand-400" />
                <h3 className="mt-4 font-semibold text-white">{d.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{d.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pipeline */}
        <section id="pipeline" className="py-16">
          <h2 className="text-center text-3xl font-semibold text-white">The pipeline</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-400">
            Every stage is a plugin behind an interface. The real path runs on CPU out of the box.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {PIPELINE.map((step, i) => (
              <span key={step} className="rounded-lg border border-white/10 bg-ink-800/60 px-3 py-2 text-sm text-slate-300">
                <span className="mr-2 text-brand-400">{i + 1}</span>{step}
              </span>
            ))}
          </div>
        </section>

        <footer className="border-t border-white/5 py-10 text-center text-sm text-slate-500">
          © 2026 ClipForge · MIT licensed · Built from scratch, no proprietary assets.
        </footer>
      </main>
    </div>
  );
}
