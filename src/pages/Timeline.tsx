import { useMemo, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Trash2, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EditEntrySheet from '@/components/EditEntrySheet';
import { TimeEntry } from '@/types';

function formatDuration(ms: number): string {
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatTimeOfDay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Timeline() {
  const { t, entries, deleteEntry, getProject } = useApp();
  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const grouped = useMemo(() => {
    const sorted = [...entries].sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
    const groups: Record<string, typeof entries> = {};
    sorted.forEach(e => {
      const day = new Date(e.startAt).toLocaleDateString();
      if (!groups[day]) groups[day] = [];
      groups[day].push(e);
    });
    return Object.entries(groups);
  }, [entries]);

  const handleEdit = (entry: TimeEntry) => {
    setEditEntry(entry);
    setEditOpen(true);
  };

  return (
    <div className="min-h-screen pb-24 pt-safe">
      <header className="px-6 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-foreground">{t('timeline')}</h1>
      </header>

      {grouped.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">{t('noEntries')}</p>
        </div>
      ) : (
        <div className="px-4 space-y-4">
          <AnimatePresence>
            {grouped.map(([day, dayEntries]) => (
              <motion.div
                key={day}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl border border-border overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-border bg-muted/50">
                  <span className="text-sm font-semibold text-foreground">{day}</span>
                </div>
                <div className="divide-y divide-border">
                  {dayEntries.map(entry => {
                    const project = getProject(entry.projectId);
                    const start = new Date(entry.startAt).getTime();
                    const end = entry.endAt ? new Date(entry.endAt).getTime() : Date.now();
                    const pausedMs = entry.pauses.reduce((s, p) => {
                      const ps = new Date(p.pauseStart).getTime();
                      const pe = p.pauseEnd ? new Date(p.pauseEnd).getTime() : Date.now();
                      return s + (pe - ps);
                    }, 0);
                    const duration = end - start - pausedMs;

                    return (
                      <div key={entry.id} className="px-4 py-3 flex items-center gap-3">
                        {project && (
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-medium text-foreground">
                              {project?.name || t('noProject')}
                            </span>
                            {entry.pauses.length > 0 && (
                              <span className="text-xs text-timer-paused">
                                ⏸ {entry.pauses.length}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {formatTimeOfDay(entry.startAt)}
                            {entry.endAt && <> — {formatTimeOfDay(entry.endAt)}</>}
                            {!entry.endAt && <> — …</>}
                          </div>
                          {entry.note && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">{entry.note}</p>
                          )}
                        </div>
                        <span className="text-sm font-semibold tabular-nums text-foreground">
                          {formatDuration(duration)}
                        </span>
                        <button
                          onClick={() => handleEdit(entry)}
                          className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-lg"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <EditEntrySheet entry={editEntry} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}
