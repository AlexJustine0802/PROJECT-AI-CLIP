import { cn } from '@/lib/utils';
import type { TimelineEventName } from '@clipforge/types';

export interface TimelineMark {
  type: TimelineEventName;
  startSec: number;
  endSec?: number;
  score?: number;
}

const COLORS: Record<TimelineEventName, string> = {
  hook: 'bg-brand-500',
  emotion: 'bg-rose-500',
  silence: 'bg-slate-500',
  scene_change: 'bg-amber-500',
  speaker_change: 'bg-cyan-500',
  keyword: 'bg-emerald-500',
};

/** Insight timeline (differentiator): hooks, emotions, silence, scene changes on one track. */
export function InsightTimeline({ duration, marks }: { duration: number; marks: TimelineMark[] }) {
  return (
    <div>
      <div className="relative h-12 overflow-hidden rounded-xl border border-white/10 bg-ink-900">
        {marks.map((m, i) => {
          const left = (m.startSec / duration) * 100;
          const width = Math.max(0.6, (((m.endSec ?? m.startSec + 1) - m.startSec) / duration) * 100);
          return (
            <div
              key={i}
              title={`${m.type} @ ${Math.round(m.startSec)}s`}
              className={cn('absolute top-0 h-full opacity-70', COLORS[m.type])}
              style={{ left: `${left}%`, width: `${width}%` }}
            />
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400">
        {Object.entries(COLORS).map(([k, c]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className={cn('h-2.5 w-2.5 rounded-sm', c)} /> {k.replace('_', ' ')}
          </span>
        ))}
      </div>
    </div>
  );
}
