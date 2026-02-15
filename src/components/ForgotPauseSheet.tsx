import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function ForgotPauseSheet() {
  const { t, timerState, fixForgotPause } = useApp();
  const [open, setOpen] = useState(false);
  const [minutesAgo, setMinutesAgo] = useState<number | null>(null);
  const [step, setStep] = useState<'select' | 'action'>('select');

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

  const handleAction = (action: 'end' | 'resume') => {
    if (minutesAgo !== null) {
      fixForgotPause(minutesAgo, action);
    }
    setOpen(false);
    setStep('select');
    setMinutesAgo(null);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setStep('select'); setMinutesAgo(null); } }}>
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
