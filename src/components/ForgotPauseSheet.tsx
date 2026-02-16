import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle } from 'lucide-react';

export default function ForgotPauseSheet() {
  const { t, timerState, fixForgotPause } = useApp();
  const [open, setOpen] = useState(false);
  const [minutesAgo, setMinutesAgo] = useState<number | null>(null);
  const [step, setStep] = useState<'select' | 'custom' | 'action'>('select');
  const [customMinutes, setCustomMinutes] = useState('');

  if (timerState !== 'running') return null;

  const presets = [
    { label: t('min10ago'), value: 10 },
    { label: t('min30ago'), value: 30 },
    { label: t('hour1ago'), value: 60 },
  ];

  const handleSelect = (mins: number) => {
    setMinutesAgo(mins);
    setStep('action');
  };

  const handleCustomConfirm = () => {
    const mins = parseInt(customMinutes);
    if (mins > 0) {
      setMinutesAgo(mins);
      setStep('action');
    }
  };

  const handleAction = (action: 'end' | 'resume') => {
    if (minutesAgo !== null) {
      fixForgotPause(minutesAgo, action);
    }
    resetAndClose();
  };

  const resetAndClose = () => {
    setOpen(false);
    setStep('select');
    setMinutesAgo(null);
    setCustomMinutes('');
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) resetAndClose(); else setOpen(true); }}>
      <SheetTrigger asChild>
        <button className="flex items-center gap-2 px-4 py-3 rounded-xl bg-accent/10 text-accent-foreground text-sm font-medium hover:bg-accent/20 transition-colors border border-accent/20">
          <AlertTriangle className="w-4 h-4 text-timer-paused" />
          {t('forgotPause')}
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl pb-safe">
        <SheetHeader>
          <SheetTitle>{t('whenDidYouStop')}</SheetTitle>
        </SheetHeader>

        {step === 'select' && (
          <div className="mt-4 space-y-3">
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
              onClick={() => setStep('custom')}
              className="w-full px-4 py-4 rounded-xl bg-accent/10 text-accent-foreground text-start font-medium hover:bg-accent/20 transition-colors border border-accent/20"
            >
              {t('customTime')}
            </button>
          </div>
        )}

        {step === 'custom' && (
          <div className="mt-4 space-y-4">
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
              <Button onClick={handleCustomConfirm} disabled={!customMinutes || parseInt(customMinutes) <= 0} className="flex-1 rounded-xl h-12">
                {t('next')}
              </Button>
              <Button variant="outline" onClick={() => setStep('select')} className="rounded-xl h-12">
                {t('cancel')}
              </Button>
            </div>
          </div>
        )}

        {step === 'action' && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              {minutesAgo} {t('minutes')}
            </p>
            <Button
              onClick={() => handleAction('end')}
              variant="outline"
              className="w-full rounded-xl h-14 text-base"
            >
              {t('endSession')}
            </Button>
            <Button
              onClick={() => handleAction('resume')}
              className="w-full rounded-xl h-14 text-base"
            >
              {t('resumeFromNow')}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
