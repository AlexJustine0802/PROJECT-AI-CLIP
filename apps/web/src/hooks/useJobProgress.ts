'use client';
import { useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { JobEvent } from '@clipforge/types';

export interface JobProgress {
  stage?: string;
  progress: number;
  logs: string[];
  done: boolean;
  error?: string;
}

/**
 * Realtime job progress over WebSocket (#14) — replaces polling. Subscribes to the /jobs
 * namespace room for a given jobId and reduces incoming events into UI state.
 */
export function useJobProgress(jobId: string | null): JobProgress {
  const [state, setState] = useState<JobProgress>({ progress: 0, logs: [], done: false });

  useEffect(() => {
    if (!jobId) return;
    const base = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:4000';
    const socket: Socket = io(`${base}/jobs`, { transports: ['websocket'] });
    socket.emit('subscribe', { jobId });
    socket.on('job', (evt: JobEvent) => {
      setState((prev) => {
        switch (evt.type) {
          case 'progress':
            return { ...prev, stage: evt.stage, progress: evt.progress };
          case 'log':
            return { ...prev, logs: [...prev.logs, evt.message].slice(-50) };
          case 'stage':
            return { ...prev, stage: evt.stage };
          case 'completed':
            return { ...prev, progress: 1, done: true };
          case 'failed':
            return { ...prev, error: evt.error, done: true };
          default:
            return prev;
        }
      });
    });
    return () => {
      socket.disconnect();
    };
  }, [jobId]);

  return state;
}
