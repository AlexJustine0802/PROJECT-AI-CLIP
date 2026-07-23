'use client';
import { useState } from 'react';
import { UploadCloud, Film } from 'lucide-react';
import { useJobProgress } from '@/hooks/useJobProgress';

const STYLES = ['auto', 'podcast', 'educational', 'gaming', 'interview', 'vlog', 'news'];

export default function UploadPage() {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [style, setStyle] = useState('auto');
  const [series, setSeries] = useState(true);
  const [jobId, setJobId] = useState<string | null>(null);
  const progress = useJobProgress(jobId);

  // In production: client.videos.createUploadUrl → PUT to presigned URL → client.videos.process
  function onFiles(files: FileList | null) {
    if (files && files[0]) setFile(files[0]);
  }
  function startProcessing() {
    // Demo: simulate a job id; real flow returns one from the API.
    setJobId('demo-job');
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-white">Upload a video</h1>
      <p className="mt-1 text-sm text-slate-400">Drag & drop a long-form video. We’ll find the stories.</p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); onFiles(e.dataTransfer.files); }}
        className={`mt-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition ${dragging ? 'border-brand-500 bg-brand-500/5' : 'border-white/15'}`}
      >
        <UploadCloud className="h-10 w-10 text-brand-400" />
        <p className="mt-4 text-white">{file ? file.name : 'Drop your video here'}</p>
        <p className="mt-1 text-xs text-slate-500">MP4, MOV, MKV · up to your plan limit · resumable</p>
        <label className="btn-ghost mt-5 cursor-pointer !py-2 text-sm">
          Browse files
          <input type="file" accept="video/*" className="hidden" onChange={(e) => onFiles(e.target.files)} multiple />
        </label>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="card">
          <label className="text-sm font-medium text-white">Editing style</label>
          <div className="mt-3 flex flex-wrap gap-2">
            {STYLES.map((s) => (
              <button
                key={s}
                onClick={() => setStyle(s)}
                className={`rounded-lg px-3 py-1.5 text-sm capitalize ${style === s ? 'bg-brand-600 text-white' : 'border border-white/10 text-slate-300'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="card">
          <label className="flex items-center justify-between text-sm text-white">
            Generate clip series (Part 1 / 2 / 3)
            <input type="checkbox" checked={series} onChange={(e) => setSeries(e.target.checked)} className="h-4 w-4 accent-brand-500" />
          </label>
          <p className="mt-2 text-xs text-slate-500">Splits your video into connected, standalone parts.</p>
        </div>
      </div>

      <button disabled={!file} onClick={startProcessing} className="btn-primary mt-6 w-full disabled:opacity-40">
        <Film className="mr-2 h-4 w-4" /> Find the stories
      </button>

      {jobId && (
        <div className="card mt-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white">{progress.done ? 'Done' : `Processing · ${progress.stage ?? 'starting'}`}</span>
            <span className="text-slate-400">{Math.round(progress.progress * 100)}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-brand-500 transition-all" style={{ width: `${progress.progress * 100}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
