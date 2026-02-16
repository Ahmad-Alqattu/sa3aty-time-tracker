import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock } from 'lucide-react';

export default function ForgotStartSheet() {
  const { t, projects, addRetroEntry } = useApp();
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState<string | undefined>();
  const [minutesAgo, setMinutesAgo] = useState(30);
  const [customMode, setCustomMode] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');
  const [stillWorking, setStillWorking] = useState(true);
  const [note, setNote] = useState('');

  const presets = [
    { label: '15', value: 15 },
    { label: '30', value: 30 },
    { label: '60', value: 60 },
    { label: '120', value: 120 },
  ];

  const handleSave = () => {
    const startAt = new Date(Date.now() - minutesAgo * 60000);
    const endAt = stillWorking ? null : new Date();
    addRetroEntry(projectId, startAt, endAt, note || undefined);
    setOpen(false);
    setNote('');
    setMinutesAgo(30);
    setCustomMode(false);
    setCustomMinutes('');
  };

  const handleCustomConfirm = () => {
    const mins = parseInt(customMinutes);
    if (mins > 0) {
      setMinutesAgo(mins);
      setCustomMode(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setCustomMode(false); setCustomMinutes(''); } }}>
      <SheetTrigger asChild>
        <button className="flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors">
          <Clock className="w-4 h-4" />
          {t('forgotStart')}
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl pb-safe">
        <SheetHeader>
          <SheetTitle>{t('forgotStart')}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          {/* Project select */}
          {projects.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">{t('selectProject')}</label>
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

          {/* Time presets + custom */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">{t('startTime')}</label>
            {!customMode ? (
              <div className="flex flex-wrap gap-2">
                {presets.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setMinutesAgo(p.value)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      minutesAgo === p.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {p.label}{t('minutes')}
                  </button>
                ))}
                <button
                  onClick={() => { setCustomMode(true); setCustomMinutes(String(minutesAgo)); }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    !presets.some(p => p.value === minutesAgo) ? 'bg-primary text-primary-foreground' : 'bg-accent/10 text-accent-foreground border border-accent/20'
                  }`}
                >
                  {!presets.some(p => p.value === minutesAgo) ? `${minutesAgo}${t('minutes')}` : t('customTime')}
                </button>
              </div>
            ) : (
              <div className="flex gap-2 items-end">
                <Input
                  type="number"
                  min={1}
                  value={customMinutes}
                  onChange={e => setCustomMinutes(e.target.value)}
                  placeholder="45"
                  className="rounded-xl h-12 text-center flex-1"
                  autoFocus
                />
                <span className="text-sm text-muted-foreground pb-3">{t('minutes')}</span>
                <Button onClick={handleCustomConfirm} size="sm" className="rounded-xl h-12">
                  {t('save')}
                </Button>
              </div>
            )}
          </div>

          {/* Still working toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStillWorking(!stillWorking)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                stillWorking ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              {t('stillWorking')}
            </button>
          </div>

          {/* Note */}
          <Input
            placeholder={t('note')}
            value={note}
            onChange={e => setNote(e.target.value)}
            className="rounded-xl"
          />

          {/* Save */}
          <div className="flex gap-3">
            <Button onClick={handleSave} className="flex-1 rounded-xl h-12">
              {t('save')}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl h-12">
              {t('cancel')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
