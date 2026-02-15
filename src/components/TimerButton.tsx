import { useApp } from '@/contexts/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Pause, RotateCcw } from 'lucide-react';

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export default function TimerButton() {
  const { timerState, elapsedSeconds, startTimer, stopTimer, pauseTimer, resumeTimer, t, activeEntry, getProject } = useApp();

  const project = getProject(activeEntry?.projectId);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Status */}
      <AnimatePresence mode="wait">
        <motion.p
          key={timerState}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className={`text-sm font-semibold ${
            timerState === 'running' ? 'text-timer-running' :
            timerState === 'paused' ? 'text-timer-paused' :
            'text-muted-foreground'
          }`}
        >
          {timerState === 'running' ? t('runningStatus') :
           timerState === 'paused' ? t('pausedStatus') :
           t('idleStatus')}
        </motion.p>
      </AnimatePresence>

      {/* Project name */}
      {project && (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
          <span className="text-sm text-muted-foreground">{project.name}</span>
        </div>
      )}

      {/* Timer display */}
      {timerState !== 'idle' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-5xl font-bold tabular-nums tracking-tight text-foreground"
        >
          {formatTime(elapsedSeconds)}
        </motion.div>
      )}

      {/* Main button area */}
      <div className="relative flex items-center justify-center">
        {timerState === 'idle' && (
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => startTimer()}
              className="relative z-10 w-40 h-40 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-shadow"
            >
              <Play className="w-16 h-16 ms-2" />
            </motion.button>
          </div>
        )}

        {timerState === 'running' && (
          <div className="flex items-center gap-5">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileTap={{ scale: 0.92 }}
              onClick={pauseTimer}
              className="w-24 h-24 rounded-full bg-timer-paused text-primary-foreground flex items-center justify-center shadow-lg shadow-accent/30"
            >
              <Pause className="w-10 h-10" />
            </motion.button>
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              whileTap={{ scale: 0.92 }}
              onClick={stopTimer}
              className="w-24 h-24 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg shadow-destructive/30"
            >
              <Square className="w-10 h-10" />
            </motion.button>
          </div>
        )}

        {timerState === 'paused' && (
          <div className="flex items-center gap-5">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileTap={{ scale: 0.92 }}
              onClick={resumeTimer}
              className="w-28 h-28 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 animate-gentle-pulse"
            >
              <RotateCcw className="w-12 h-12" />
            </motion.button>
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              whileTap={{ scale: 0.92 }}
              onClick={stopTimer}
              className="w-20 h-20 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg shadow-destructive/30"
            >
              <Square className="w-8 h-8" />
            </motion.button>
          </div>
        )}
      </div>

      {/* Action labels */}
      {timerState !== 'idle' && (
        <div className="flex gap-8 text-sm text-muted-foreground">
          {timerState === 'running' && (
            <>
              <span>{t('pause')}</span>
              <span>{t('stop')}</span>
            </>
          )}
          {timerState === 'paused' && (
            <>
              <span>{t('resume')}</span>
              <span>{t('stop')}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
