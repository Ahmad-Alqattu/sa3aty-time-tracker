import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Project, TimeEntry, TimePause, TimerState, Language } from '@/types';
import translations, { TranslationKey } from '@/i18n/translations';
import { useAuth } from './AuthContext';
import { 
  subscribeToProjects, 
  subscribeToEntries, 
  syncProjectToFirestore, 
  syncEntryToFirestore,
  deleteProjectFromFirestore,
  deleteEntryFromFirestore,
  bulkSyncToFirestore
} from '@/lib/firestoreSync';
import { pauseAllSounds, resumeAllSounds, getSoundTimerSyncEnabled } from '@/lib/audioManager';

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
  fixForgotStop: (minutesAgo: number) => void;
  updateEntry: (id: string, updates: Partial<Pick<TimeEntry, 'projectId' | 'startAt' | 'endAt' | 'note'>>) => void;
  updateActiveProject: (projectId?: string) => void;
  todayTotalMinutes: number;
  deleteEntry: (id: string) => void;
  getProject: (id?: string) => Project | undefined;
}

const AppContext = createContext<AppContextType | null>(null);

function loadJson<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (error) {
    console.error(`Failed to load ${key} from localStorage:`, error);
    return fallback;
  }
}

function saveJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save ${key} to localStorage:`, error);
    // Check if quota exceeded
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      // TODO: Replace alert with toast notification system (e.g., sonner is already installed)
      // Using alert as fallback for now to ensure users are notified of critical storage issues
      alert('Storage quota exceeded. Please export and clear old data.');
    }
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>(() =>
    (localStorage.getItem('sa3aty-lang') as Language) || 'ar'
  );
  const [projects, setProjects] = useState<Project[]>(() => loadJson('sa3aty-projects', []));
  const [entries, setEntries] = useState<TimeEntry[]>(() => loadJson('sa3aty-entries', []));
  const [tick, setTick] = useState(0);
  const [isSynced, setIsSynced] = useState(false);
  const hasMigratedRef = useRef(false);

  // Subscribe to Firestore when user logs in
  useEffect(() => {
    if (!user) {
      setIsSynced(false);
      hasMigratedRef.current = false;
      return;
    }

    // Migrate localStorage data to Firestore on first login
    const migrateData = async () => {
      if (hasMigratedRef.current) return;
      
      const localProjects = loadJson<Project[]>('sa3aty-projects', []);
      const localEntries = loadJson<TimeEntry[]>('sa3aty-entries', []);
      
      if (localProjects.length > 0 || localEntries.length > 0) {
        try {
          await bulkSyncToFirestore(user.uid, localProjects, localEntries);
          console.log('Migrated local data to Firestore');
        } catch (error) {
          console.error('Failed to migrate data:', error);
        }
      }
      hasMigratedRef.current = true;
    };

    migrateData();

    // Subscribe to projects
    const unsubProjects = subscribeToProjects(user.uid, (firestoreProjects) => {
      setProjects(firestoreProjects);
      setIsSynced(true);
    });

    // Subscribe to entries
    const unsubEntries = subscribeToEntries(user.uid, (firestoreEntries) => {
      // Sort entries by startAt for proper display (newest first)
      setEntries(firestoreEntries.sort((a, b) => 
        new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
      ));
    });

    return () => {
      unsubProjects();
      unsubEntries();
    };
  }, [user]);

  // Derived
  const activeEntry = useMemo(() => entries.find(e => !e.endAt) || null, [entries]);
  const timerState: TimerState = useMemo(() => {
    if (!activeEntry) return 'idle';
    return activeEntry.pauses.some(p => !p.pauseEnd) ? 'paused' : 'running';
  }, [activeEntry]);

  // Sync sounds with timer state
  const prevTimerStateRef = useRef<TimerState>(timerState);
  useEffect(() => {
    const prevState = prevTimerStateRef.current;
    prevTimerStateRef.current = timerState;
    
    // Only sync if setting is enabled
    if (!getSoundTimerSyncEnabled()) return;
    
    // Pause sounds when timer stops or pauses
    if ((timerState === 'idle' || timerState === 'paused') && prevState === 'running') {
      pauseAllSounds();
    }
    // Resume sounds when timer starts or resumes
    else if (timerState === 'running' && (prevState === 'idle' || prevState === 'paused')) {
      resumeAllSounds();
    }
  }, [timerState]);

  // Tick
  useEffect(() => {
    if (timerState === 'running') {
      const interval = setInterval(() => setTick(t => t + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timerState]);

  // Persist to localStorage only when not logged in (Firestore handles it when logged in)
  useEffect(() => { 
    if (!user) saveJson('sa3aty-projects', projects); 
  }, [projects, user]);
  useEffect(() => { 
    if (!user) saveJson('sa3aty-entries', entries); 
  }, [entries, user]);

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
  }, [language]);

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
    // Note: `tick` is intentionally included to force re-calculation every second
    // when timer is running, despite not being directly used in the calculation
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // Note: `tick` is intentionally included to update the total in real-time
    // for running timers, despite not being directly used in the calculation
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (user) syncEntryToFirestore(user.uid, entry).catch(console.error);
  }, [activeEntry, user]);

  const stopTimer = useCallback(() => {
    if (!activeEntry) return;
    const updatedEntry = {
      ...activeEntry,
      pauses: activeEntry.pauses.map(p =>
        p.pauseEnd ? p : { ...p, pauseEnd: new Date().toISOString() }
      ),
      endAt: new Date().toISOString()
    };
    setEntries(prev => prev.map(e => e.id === activeEntry.id ? updatedEntry : e));
    if (user) syncEntryToFirestore(user.uid, updatedEntry).catch(console.error);
  }, [activeEntry]);

  const pauseTimer = useCallback(() => {
    if (!activeEntry || timerState !== 'running') return;
    const pause: TimePause = {
      id: crypto.randomUUID(),
      pauseStart: new Date().toISOString(),
    };
    const updatedEntry = { ...activeEntry, pauses: [...activeEntry.pauses, pause] };
    setEntries(prev => prev.map(e => e.id === activeEntry.id ? updatedEntry : e));
    if (user) syncEntryToFirestore(user.uid, updatedEntry).catch(console.error);
  }, [activeEntry, timerState, user]);

  const resumeTimer = useCallback(() => {
    if (!activeEntry || timerState !== 'paused') return;
    const updatedEntry = {
      ...activeEntry,
      pauses: activeEntry.pauses.map(p =>
        p.pauseEnd ? p : { ...p, pauseEnd: new Date().toISOString() }
      )
    };
    setEntries(prev => prev.map(e => e.id === activeEntry.id ? updatedEntry : e));
    if (user) syncEntryToFirestore(user.uid, updatedEntry).catch(console.error);
  }, [activeEntry, timerState, user]);

  const addQuickTime = useCallback((minutes: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - minutes * 60000);
    // Use last used project
    const sorted = [...entries].filter(e => e.projectId).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const lastProjectId = sorted[0]?.projectId;
    const entry: TimeEntry = {
      id: crypto.randomUUID(),
      projectId: lastProjectId,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      pauses: [],
      source: 'manual',
      createdAt: new Date().toISOString(),
    };
    setEntries(prev => [...prev, entry]);
    if (user) syncEntryToFirestore(user.uid, entry).catch(console.error);
  }, [entries, user]);

  const addRetroEntry = useCallback((projectId: string | undefined, startAt: Date, endAt: Date | null, note?: string) => {
    // Validate dates
    if (!(startAt instanceof Date) || isNaN(startAt.getTime())) {
      console.error('Invalid start date');
      return;
    }
    if (endAt && (!(endAt instanceof Date) || isNaN(endAt.getTime()))) {
      console.error('Invalid end date');
      return;
    }
    if (endAt && endAt < startAt) {
      console.error('End date cannot be before start date');
      return;
    }
    
    const entry: TimeEntry = {
      id: crypto.randomUUID(),
      projectId,
      startAt: startAt.toISOString(),
      endAt: endAt?.toISOString(),
      pauses: [],
      note: note?.trim(),
      source: 'retro',
      createdAt: new Date().toISOString(),
    };
    setEntries(prev => [...prev, entry]);
    if (user) syncEntryToFirestore(user.uid, entry).catch(console.error);
  }, [user]);

  const fixForgotPause = useCallback((minutesAgo: number, action: 'end' | 'resume') => {
    if (!activeEntry) return;
    const pauseStart = new Date(Date.now() - minutesAgo * 60000);
    const now = new Date();

    const newPause: TimePause = {
      id: crypto.randomUUID(),
      pauseStart: pauseStart.toISOString(),
      pauseEnd: now.toISOString(),
    };
    const updatedEntry = action === 'end'
      ? { ...activeEntry, pauses: [...activeEntry.pauses, newPause], endAt: now.toISOString() }
      : { ...activeEntry, pauses: [...activeEntry.pauses, newPause] };
    
    setEntries(prev => prev.map(e => e.id === activeEntry.id ? updatedEntry : e));
    if (user) syncEntryToFirestore(user.uid, updatedEntry).catch(console.error);
  }, [activeEntry, user]);

  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    if (user) deleteEntryFromFirestore(user.uid, id).catch(console.error);
  }, [user]);

  const fixForgotStop = useCallback((minutesAgo: number) => {
    if (!activeEntry) return;
    const endTime = new Date(Date.now() - minutesAgo * 60000);
    const updatedEntry = {
      ...activeEntry,
      pauses: activeEntry.pauses.map(p =>
        p.pauseEnd ? p : { ...p, pauseEnd: endTime.toISOString() }
      ),
      endAt: endTime.toISOString()
    };
    setEntries(prev => prev.map(e => e.id === activeEntry.id ? updatedEntry : e));
    if (user) syncEntryToFirestore(user.uid, updatedEntry).catch(console.error);
  }, [activeEntry, user]);

  const updateEntry = useCallback((id: string, updates: Partial<Pick<TimeEntry, 'projectId' | 'startAt' | 'endAt' | 'note'>>) => {
    setEntries(prev => {
      const updated = prev.map(e => e.id === id ? { ...e, ...updates } : e);
      const entry = updated.find(e => e.id === id);
      if (user && entry) syncEntryToFirestore(user.uid, entry).catch(console.error);
      return updated;
    });
  }, [user]);

  const updateActiveProject = useCallback((projectId?: string) => {
    if (!activeEntry) return;
    const updatedEntry = { ...activeEntry, projectId };
    setEntries(prev => prev.map(e => e.id === activeEntry.id ? updatedEntry : e));
    if (user) syncEntryToFirestore(user.uid, updatedEntry).catch(console.error);
  }, [activeEntry, user]);

  const addProject = useCallback((name: string, color: string, rate?: number) => {
    // Validate inputs
    if (!name || name.trim().length === 0) {
      console.error('Project name cannot be empty');
      return;
    }
    if (!color || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      console.error('Invalid color format');
      return;
    }
    if (rate !== undefined && (isNaN(rate) || rate < 0)) {
      console.error('Invalid rate value');
      return;
    }
    
    const project: Project = {
      id: crypto.randomUUID(),
      name: name.trim(),
      color,
      rate,
      archived: false,
      createdAt: new Date().toISOString(),
    };
    setProjects(prev => [...prev, project]);
    if (user) syncProjectToFirestore(user.uid, project).catch(console.error);
  }, [user]);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (user) deleteProjectFromFirestore(user.uid, id).catch(console.error);
  }, [user]);

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
      addQuickTime, addRetroEntry, fixForgotPause, fixForgotStop,
      updateEntry, updateActiveProject,
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
