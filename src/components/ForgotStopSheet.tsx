import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { StopCircle } from 'lucide-react';

export default function ForgotStopSheet() {
  const { t, timerState, fixForgotStop } = useApp();
  const [open, setOpen] = useState(false);

  if (timerState !== 'running' && timerState !== 'paused') return null;

  const presets = [
    { label: t('min10ago'), value: 10 },
    { label: t('min30ago'), value: 30 },
    { label: t('hour1ago'), value: 60 },
  ];

  const handleSelect = (mins: number) => {
    fixForgotStop(mins);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
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
      </SheetContent>
    </Sheet>
  );
}
