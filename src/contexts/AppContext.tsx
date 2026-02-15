import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Project, TimeEntry, TimePause, TimerState, Language } from '@/types';
import translations, { TranslationKey } from '@/i18n/translations';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  projects: Project[];
  addProject: (name: string, color: string, rate?: number) => void;
  deleteProject: (id: string) => void;
  entries: TimeEntry[];
  timerState: TimerState;
  activeEntry: TimeEntry | null;
  elapsedSeconds: number;
  startTimer: (projectId?: string) => void;
  stopTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  addQuickTime: (minutes: number) => void;
  addRetroEntry: (projectId: string | undefined, startAt: Date, endAt: Date | null, note?: string) => void;
  fixForgotPause: (minutesAgo: number, action: 'end' | 'resume') => void;
  todayTotalMinutes: number;
  deleteEntry: (id: string) => void;
  getProject: (id?: string) => Project | undefined;
}

const AppContext = createContext<AppContextType | null>(null);

function loadJson<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() =>
    (localStorage.getItem('sa3aty-lang') as Language) || 'ar'
  );
  const [projects, setProjects] = useState<Project[]>(() => loadJson('sa3aty-projects', []));
  const [entries, setEntries] = useState<TimeEntry[]>(() => loadJson('sa3aty-entries', []));
  const [tick, setTick] = useState(0);

  // Derived
  const activeEntry = useMemo(() => entries.find(e => !e.endAt) || null, [entries]);
  const timerState: TimerState = useMemo(() => {
    if (!activeEntry) return 'idle';
    return activeEntry.pauses.some(p => !p.pauseEnd) ? 'paused' : 'running';
  }, [activeEntry]);

  // Tick
  useEffect(() => {
    if (timerState === 'running') {
      const interval = setInterval(() => setTick(t => t + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timerState]);

  // Persist
  useEffect(() => { localStorage.setItem('sa3aty-projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('sa3aty-entries', JSON.stringify(entries)); }, [entries]);

  // Language
  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('sa3aty-lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, []);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, []);

  const t = useCallback((key: TranslationKey) => {
    return translations[language][key] || key;
  }, [language]);

  // Elapsed seconds
  const elapsedSeconds = useMemo(() => {
    if (!activeEntry) return 0;
    const start = new Date(activeEntry.startAt).getTime();
    let end: number;
    if (timerState === 'paused') {
      const activePause = activeEntry.pauses.find(p => !p.pauseEnd);
      end = activePause ? new Date(activePause.pauseStart).getTime() : Date.now();
    } else {
      end = Date.now();
    }
    const totalPausedMs = activeEntry.pauses.reduce((sum, p) => {
      const ps = new Date(p.pauseStart).getTime();
      const pe = p.pauseEnd ? new Date(p.pauseEnd).getTime() : ps;
      return sum + (pe - ps);
    }, 0);
    return Math.max(0, Math.floor((end - start - totalPausedMs) / 1000));
  }, [activeEntry, timerState, tick]);

  // Today total
  const todayTotalMinutes = useMemo(() => {
    const todayStr = new Date().toDateString();
    return entries
      .filter(e => new Date(e.startAt).toDateString() === todayStr)
      .reduce((sum, e) => {
        const start = new Date(e.startAt).getTime();
        const end = e.endAt ? new Date(e.endAt).getTime() : Date.now();
        const pausedMs = e.pauses.reduce((ps, p) => {
          const pStart = new Date(p.pauseStart).getTime();
          const pEnd = p.pauseEnd ? new Date(p.pauseEnd).getTime() : Date.now();
          return ps + (pEnd - pStart);
        }, 0);
        return sum + (end - start - pausedMs);
      }, 0) / 60000;
  }, [entries, tick]);

  // Actions
  const startTimer = useCallback((projectId?: string) => {
    if (activeEntry) return;
    const entry: TimeEntry = {
      id: crypto.randomUUID(),
      projectId,
      startAt: new Date().toISOString(),
      pauses: [],
      source: 'timer',
      createdAt: new Date().toISOString(),
    };
    setEntries(prev => [...prev, entry]);
  }, [activeEntry]);

  const stopTimer = useCallback(() => {
    if (!activeEntry) return;
    setEntries(prev => prev.map(e => {
      if (e.id !== activeEntry.id) return e;
      const pauses = e.pauses.map(p =>
        p.pauseEnd ? p : { ...p, pauseEnd: new Date().toISOString() }
      );
      return { ...e, pauses, endAt: new Date().toISOString() };
    }));
  }, [activeEntry]);

  const pauseTimer = useCallback(() => {
    if (!activeEntry || timerState !== 'running') return;
    const pause: TimePause = {
      id: crypto.randomUUID(),
      pauseStart: new Date().toISOString(),
    };
    setEntries(prev => prev.map(e =>
      e.id === activeEntry.id ? { ...e, pauses: [...e.pauses, pause] } : e
    ));
  }, [activeEntry, timerState]);

  const resumeTimer = useCallback(() => {
    if (!activeEntry || timerState !== 'paused') return;
    setEntries(prev => prev.map(e => {
      if (e.id !== activeEntry.id) return e;
      const pauses = e.pauses.map(p =>
        p.pauseEnd ? p : { ...p, pauseEnd: new Date().toISOString() }
      );
      return { ...e, pauses };
    }));
  }, [activeEntry, timerState]);

  const addQuickTime = useCallback((minutes: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - minutes * 60000);
    const entry: TimeEntry = {
      id: crypto.randomUUID(),
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      pauses: [],
      source: 'manual',
      createdAt: new Date().toISOString(),
    };
    setEntries(prev => [...prev, entry]);
  }, []);

  const addRetroEntry = useCallback((projectId: string | undefined, startAt: Date, endAt: Date | null, note?: string) => {
    const entry: TimeEntry = {
      id: crypto.randomUUID(),
      projectId,
      startAt: startAt.toISOString(),
      endAt: endAt?.toISOString(),
      pauses: [],
      note,
      source: 'retro',
      createdAt: new Date().toISOString(),
    };
    setEntries(prev => [...prev, entry]);
  }, []);

  const fixForgotPause = useCallback((minutesAgo: number, action: 'end' | 'resume') => {
    if (!activeEntry) return;
    const pauseStart = new Date(Date.now() - minutesAgo * 60000);
    const now = new Date();

    setEntries(prev => prev.map(e => {
      if (e.id !== activeEntry.id) return e;
      const newPause: TimePause = {
        id: crypto.randomUUID(),
        pauseStart: pauseStart.toISOString(),
        pauseEnd: now.toISOString(),
      };
      if (action === 'end') {
        return { ...e, pauses: [...e.pauses, newPause], endAt: now.toISOString() };
      }
      return { ...e, pauses: [...e.pauses, newPause] };
    }));
  }, [activeEntry]);

  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  const addProject = useCallback((name: string, color: string, rate?: number) => {
    const project: Project = {
      id: crypto.randomUUID(),
      name,
      color,
      rate,
      archived: false,
      createdAt: new Date().toISOString(),
    };
    setProjects(prev => [...prev, project]);
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  }, []);

  const getProject = useCallback((id?: string) => {
    if (!id) return undefined;
    return projects.find(p => p.id === id);
  }, [projects]);

  return (
    <AppContext.Provider value={{
      language, setLanguage, t,
      projects, addProject, deleteProject, getProject,
      entries, timerState, activeEntry, elapsedSeconds,
      startTimer, stopTimer, pauseTimer, resumeTimer,
      addQuickTime, addRetroEntry, fixForgotPause,
      todayTotalMinutes, deleteEntry,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
