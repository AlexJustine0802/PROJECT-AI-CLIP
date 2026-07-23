'use client';
import { useState } from 'react';
import { ClipCard, type ClipVM } from '@/components/ClipCard';
import { InsightTimeline, type TimelineMark } from '@/components/InsightTimeline';
import { GitCompareArrows } from 'lucide-react';

// Representative data shaped exactly like the AI service output. In production this comes from
// the SDK (client.clips.listForVideo) + the video's timeline events.
const DURATION = 67;
const MARKS: TimelineMark[] = [
  { type: 'hook', startSec: 0, endSec: 7, score: 76 },
  { type: 'scene_change', startSec: 14, endSec: 15 },
  { type: 'emotion', startSec: 14, endSec: 23, score: 66 },
  { type: 'silence', startSec: 30.5, endSec: 31.5 },
  { type: 'hook', startSec: 31.5, endSec: 40, score: 72 },
  { type: 'scene_change', startSec: 40, endSec: 41 },
  { type: 'emotion', startSec: 49, endSec: 58, score: 61 },
];
const CLIPS: ClipVM[] = [
  { id: 'c1', title: "The lesson that changed everything", startSec: 31.5, endSec: 49, qualityScore: 84, viralityScore: 81, hookScore: 76, seriesPart: 1, editingStyle: 'podcast', reasoning: 'Selected as a self-contained insight that works without surrounding context. Hook strength 76/100, emotional pull 66/100. Opens on a pattern-interrupt hook. Estimated virality 81/100.' },
  { id: 'c2', title: "I lost 300 users in a weekend", startSec: 14.2, endSec: 31, qualityScore: 78, viralityScore: 74, hookScore: 70, seriesPart: 2, editingStyle: 'podcast', reasoning: 'A candid failure story with high emotional pull. Hook strength 70/100, emotional pull 66/100. Estimated virality 74/100.' },
  { id: 'c3', title: "Your best roadmap is a conversation", startSec: 49, endSec: 67, qualityScore: 71, viralityScore: 69, hookScore: 64, seriesPart: 3, editingStyle: 'podcast', reasoning: 'A strong closing takeaway that resolves the narrative. Hook strength 64/100. Estimated virality 69/100.' },
];

export default function WorkspacePage() {
  const [compare, setCompare] = useState<string[]>([]);
  const toggle = (id: string) =>
    setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id].slice(-2)));
  const comparing = CLIPS.filter((c) => compare.includes(c.id));

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Founder interview.mp4</h1>
          <p className="mt-1 text-sm text-slate-400">3 clips · auto series · podcast style</p>
        </div>
        {comparing.length === 2 && (
          <span className="flex items-center gap-2 text-sm text-brand-300">
            <GitCompareArrows className="h-4 w-4" /> Comparing 2 clips
          </span>
        )}
      </div>

      <section className="card mt-6">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-slate-500">Insight timeline</h2>
        <InsightTimeline duration={DURATION} marks={MARKS} />
      </section>

      {comparing.length === 2 && (
        <section className="mt-6 grid gap-4 md:grid-cols-2">
          {comparing.map((c) => <ClipCard key={c.id} clip={c} />)}
        </section>
      )}

      <h2 className="mt-8 text-lg font-semibold text-white">Generated clips</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {CLIPS.map((c) => (
          <ClipCard key={c.id} clip={c} selectable selected={compare.includes(c.id)} onToggle={toggle} />
        ))}
      </div>
    </div>
  );
}
