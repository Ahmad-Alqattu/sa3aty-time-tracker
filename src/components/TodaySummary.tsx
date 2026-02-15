import { useApp } from '@/contexts/AppContext';
import { Clock } from 'lucide-react';

export default function TodaySummary() {
  const { todayTotalMinutes, t } = useApp();

  const hours = Math.floor(todayTotalMinutes / 60);
  const minutes = Math.round(todayTotalMinutes % 60);

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
      <div className="flex items-center gap-3 mb-2">
        <Clock className="w-5 h-5 text-primary" />
        <span className="text-sm font-medium text-muted-foreground">{t('todayTotal')}</span>
      </div>
      <div className="text-3xl font-bold text-foreground tabular-nums">
        {hours > 0 && <>{hours}<span className="text-lg text-muted-foreground">{t('hours')}</span>{' '}</>}
        {minutes}<span className="text-lg text-muted-foreground">{t('minutes')}</span>
      </div>
    </div>
  );
}
