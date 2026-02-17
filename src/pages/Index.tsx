import { useApp } from '@/contexts/AppContext';
import TimerButton from '@/components/TimerButton';
import TodaySummary from '@/components/TodaySummary';
import ForgotStartSheet from '@/components/ForgotStartSheet';
import ForgotPauseSheet from '@/components/ForgotPauseSheet';
import ForgotStopSheet from '@/components/ForgotStopSheet';
import AmbientSoundPlayer from '@/components/AmbientSoundPlayer';
import { Plus } from 'lucide-react';

export default function Index() {
  const { t, addQuickTime, timerState, projects, activeEntry, updateActiveProject } = useApp();

  return (
    <div className="min-h-screen pb-24 pt-safe">
      <header className="px-6 pt-8 pb-4 lg:hidden">
        <h1 className="text-2xl font-bold text-foreground">{t('appName')}</h1>
      </header>

      <section className="flex flex-col items-center justify-center py-8 px-6">
        <TimerButton />
      </section>

      {/* Active project selector when timer running */}
      {timerState !== 'idle' && projects.length > 0 && (
        <section className="px-6 mb-3">
          <label className="text-sm text-muted-foreground mb-2 block">{t('selectProject')}</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => updateActiveProject(undefined)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                !activeEntry?.projectId ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              {t('noProject')}
            </button>
            {projects.filter(p => !p.archived).map(p => (
              <button
                key={p.id}
                onClick={() => updateActiveProject(p.id)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  activeEntry?.projectId === p.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                <span className="inline-block w-2 h-2 rounded-full me-1.5" style={{ backgroundColor: p.color }} />
                {p.name}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="px-6 space-y-3">
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

        <div className="flex gap-2">
          {timerState === 'idle' && <ForgotStartSheet />}
          {timerState === 'running' && <ForgotPauseSheet />}
          {(timerState === 'running' || timerState === 'paused') && <ForgotStopSheet />}
        </div>
      </section>

      <section className="px-6 mt-6">
        <TodaySummary />
      </section>

      {/* Ambient Sounds - Mobile inline, Desktop in sidebar */}
      <section className="px-6 mt-6 lg:hidden">
        <AmbientSoundPlayer mode="inline" />
      </section>
    </div>
  );
}
