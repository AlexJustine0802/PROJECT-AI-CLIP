'use client';
import { useState } from 'react';
import { Star, Flame, Sparkles, Pencil, Check, Download } from 'lucide-react';
import { cn, formatDuration, scoreColor } from '@/lib/utils';

export interface ClipVM {
  id: string;
  title: string;
  startSec: number;
  endSec: number;
  qualityScore: number;
  viralityScore: number;
  hookScore: number;
  reasoning: string;
  seriesPart?: number;
  editingStyle: string;
}

/** Clip card with quality score + editable AI reasoning (both differentiators). */
export function ClipCard({ clip, selectable, selected, onToggle }: {
  clip: ClipVM;
  selectable?: boolean;
  selected?: boolean;
  onToggle?: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [reason, setReason] = useState(clip.reasoning);

  return (
    <div className={cn('card', selected && 'ring-2 ring-brand-500')}>
      <div className="flex items-start justify-between">
        <div>
          {clip.seriesPart != null && (
            <span className="mb-2 inline-block rounded-md bg-brand-500/15 px-2 py-0.5 text-xs text-brand-300">
              Part {clip.seriesPart}
            </span>
          )}
          <h3 className="font-semibold text-white">{clip.title}</h3>
          <p className="mt-1 text-xs text-slate-500">
            {formatDuration(clip.startSec)}–{formatDuration(clip.endSec)} · {clip.editingStyle}
          </p>
        </div>
        {selectable && (
          <button
            onClick={() => onToggle?.(clip.id)}
            className={cn('rounded-lg border px-2 py-1 text-xs', selected ? 'border-brand-500 text-brand-300' : 'border-white/10 text-slate-400')}
          >
            {selected ? 'Comparing' : 'Compare'}
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Metric icon={Star} label="Quality" value={clip.qualityScore} />
        <Metric icon={Flame} label="Virality" value={clip.viralityScore} />
        <Metric icon={Sparkles} label="Hook" value={clip.hookScore} />
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Why this clip</span>
          <button onClick={() => setEditing((e) => !e)} className="text-slate-400 hover:text-white">
            {editing ? <Check className="h-4 w-4" /> : <Pencil className="h-3.5 w-3.5" />}
          </button>
        </div>
        {editing ? (
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-white/10 bg-ink-900 p-3 text-sm text-slate-200 outline-none focus:border-brand-500"
          />
        ) : (
          <p className="text-sm text-slate-400">{reason}</p>
        )}
      </div>

      <button className="btn-ghost mt-4 w-full !py-2 text-sm"><Download className="mr-2 h-4 w-4" /> Export</button>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Star; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-ink-900 py-2">
      <Icon className={cn('mx-auto h-4 w-4', scoreColor(value))} />
      <div className={cn('mt-1 text-lg font-bold', scoreColor(value))}>{Math.round(value)}</div>
      <div className="text-[10px] uppercase text-slate-500">{label}</div>
    </div>
  );
}
