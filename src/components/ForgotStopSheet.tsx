import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StopCircle } from 'lucide-react';

export default function ForgotStopSheet() {
  const { t, timerState, fixForgotStop } = useApp();
  const [open, setOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');

  if (timerState !== 'running' && timerState !== 'paused') return null;

  const presets = [
    { label: t('min10ago'), value: 10 },
    { label: t('min30ago'), value: 30 },
    { label: t('hour1ago'), value: 60 },
  ];

  const handleSelect = (mins: number) => {
    fixForgotStop(mins);
    setOpen(false);
    setCustomMode(false);
    setCustomMinutes('');
  };

  const handleCustomSave = () => {
    const mins = parseInt(customMinutes);
    if (mins > 0) handleSelect(mins);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setCustomMode(false); setCustomMinutes(''); } }}>
      <SheetTrigger asChild>
        <button className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors border border-destructive/20">
          <StopCircle className="w-4 h-4" />
          {t('forgotStop')}
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl pb-safe">
        <SheetHeader>
          <SheetTitle>{t('whenDidYouFinish')}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          {!customMode ? (
            <>
              {presets.map(p => (
                <button
                  key={p.value}
                  onClick={() => handleSelect(p.value)}
                  className="w-full px-4 py-4 rounded-xl bg-muted text-foreground text-start font-medium hover:bg-muted/70 transition-colors"
                >
                  {p.label}
                </button>
              ))}
              <button
                onClick={() => setCustomMode(true)}
                className="w-full px-4 py-4 rounded-xl bg-accent/10 text-accent-foreground text-start font-medium hover:bg-accent/20 transition-colors border border-accent/20"
              >
                {t('customTime')}
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <label className="text-sm text-muted-foreground">{t('minutesAgo')}</label>
              <Input
                type="number"
                min={1}
                value={customMinutes}
                onChange={e => setCustomMinutes(e.target.value)}
                placeholder="45"
                className="rounded-xl h-14 text-lg text-center"
                autoFocus
              />
              <div className="flex gap-3">
                <Button onClick={handleCustomSave} disabled={!customMinutes || parseInt(customMinutes) <= 0} className="flex-1 rounded-xl h-12">
                  {t('save')}
                </Button>
                <Button variant="outline" onClick={() => setCustomMode(false)} className="rounded-xl h-12">
                  {t('cancel')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
