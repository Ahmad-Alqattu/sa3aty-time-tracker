import { useApp } from '@/contexts/AppContext';
import TimerButton from '@/components/TimerButton';
import TodaySummary from '@/components/TodaySummary';
import ForgotStartSheet from '@/components/ForgotStartSheet';
import ForgotPauseSheet from '@/components/ForgotPauseSheet';
import { Plus } from 'lucide-react';

export default function Index() {
  const { t, addQuickTime, timerState } = useApp();

  return (
    <div className="min-h-screen pb-24 pt-safe">
      {/* Header */}
      <header className="px-6 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-foreground">{t('appName')}</h1>
      </header>

      {/* Timer section */}
      <section className="flex flex-col items-center justify-center py-8 px-6">
        <TimerButton />
      </section>

      {/* Quick actions */}
      <section className="px-6 space-y-3">
        {/* Quick add */}
        {timerState === 'idle' && (
          <div className="flex gap-2">
            <button
              onClick={() => addQuickTime(15)}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('min15')}
            </button>
            <button
              onClick={() => addQuickTime(30)}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('min30')}
            </button>
          </div>
        )}

        {/* Forgot buttons */}
        <div className="flex gap-2">
          {timerState === 'idle' && <ForgotStartSheet />}
          {timerState === 'running' && <ForgotPauseSheet />}
        </div>
      </section>

      {/* Today summary */}
      <section className="px-6 mt-6">
        <TodaySummary />
      </section>
    </div>
  );
}
