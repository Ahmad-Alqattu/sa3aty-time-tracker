export interface Project {
  id: string;
  name: string;
  color: string;
  rate?: number;
  archived: boolean;
  createdAt: string;
}

export interface TimePause {
  id: string;
  pauseStart: string;
  pauseEnd?: string;
}

export interface TimeEntry {
  id: string;
  projectId?: string;
  startAt: string;
  endAt?: string;
  pauses: TimePause[];
  note?: string;
  source: 'timer' | 'manual' | 'retro';
  createdAt: string;
}

export type TimerState = 'idle' | 'running' | 'paused';

export type Language = 'ar' | 'en';

export const PROJECT_COLORS = [
  '#0D9488', '#2563EB', '#7C3AED', '#DB2777',
  '#EA580C', '#D97706', '#16A34A', '#64748B',
];
