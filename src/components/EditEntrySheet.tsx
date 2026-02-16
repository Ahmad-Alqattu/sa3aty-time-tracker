import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TimeEntry } from '@/types';

interface Props {
  entry: TimeEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditEntrySheet({ entry, open, onOpenChange }: Props) {
  const { t, projects, updateEntry, getProject } = useApp();
  const [projectId, setProjectId] = useState<string | undefined>();
  const [note, setNote] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    if (entry) {
      setProjectId(entry.projectId);
      setNote(entry.note || '');
      setStartTime(new Date(entry.startAt).toTimeString().slice(0, 5));
      setEndTime(entry.endAt ? new Date(entry.endAt).toTimeString().slice(0, 5) : '');
    }
  }, [entry]);

  const handleSave = () => {
    if (!entry) return;
    const updates: Partial<Pick<TimeEntry, 'projectId' | 'startAt' | 'endAt' | 'note'>> = {
      projectId,
      note: note || undefined,
    };
    if (startTime) {
      const d = new Date(entry.startAt);
      const [h, m] = startTime.split(':').map(Number);
      d.setHours(h, m);
      updates.startAt = d.toISOString();
    }
    if (endTime && entry.endAt) {
      const d = new Date(entry.endAt);
      const [h, m] = endTime.split(':').map(Number);
      d.setHours(h, m);
      updates.endAt = d.toISOString();
    }
    updateEntry(entry.id, updates);
    onOpenChange(false);
  };

  if (!entry) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-safe">
        <SheetHeader>
          <SheetTitle>{t('editEntry')}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          {/* Project select */}
          {projects.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">{t('editProject')}</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setProjectId(undefined)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    !projectId ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {t('noProject')}
                </button>
                {projects.filter(p => !p.archived).map(p => (
                  <button
                    key={p.id}
                    onClick={() => setProjectId(p.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      projectId === p.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <span className="inline-block w-2 h-2 rounded-full me-1.5" style={{ backgroundColor: p.color }} />
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Start time */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">{t('startTime')}</label>
            <Input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="rounded-xl h-12"
            />
          </div>

          {/* End time */}
          {entry.endAt && (
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">{t('endTime')}</label>
              <Input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="rounded-xl h-12"
              />
            </div>
          )}

          {/* Note */}
          <Input
            placeholder={t('note')}
            value={note}
            onChange={e => setNote(e.target.value)}
            className="rounded-xl"
          />

          <div className="flex gap-3">
            <Button onClick={handleSave} className="flex-1 rounded-xl h-12">
              {t('save')}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl h-12">
              {t('cancel')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
