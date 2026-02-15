import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Plus, Trash2 } from 'lucide-react';
import { PROJECT_COLORS } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function Projects() {
  const { t, projects, addProject, deleteProject } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [rate, setRate] = useState('');

  const handleSave = () => {
    if (!name.trim()) return;
    addProject(name.trim(), color, rate ? parseFloat(rate) : undefined);
    setName('');
    setRate('');
    setColor(PROJECT_COLORS[0]);
    setShowForm(false);
  };

  return (
    <div className="min-h-screen pb-24 pt-safe">
      <header className="px-6 pt-8 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t('projects')}</h1>
        <Button
          onClick={() => setShowForm(true)}
          size="sm"
          className="rounded-xl gap-1.5"
        >
          <Plus className="w-4 h-4" />
          {t('addProject')}
        </Button>
      </header>

      {projects.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">{t('noProjects')}</p>
        </div>
      ) : (
        <div className="px-4 space-y-2">
          <AnimatePresence>
            {projects.filter(p => !p.archived).map(project => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="bg-card rounded-2xl border border-border px-4 py-4 flex items-center gap-3"
              >
                <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{project.name}</p>
                  {project.rate && (
                    <p className="text-xs text-muted-foreground">{project.rate}/hr</p>
                  )}
                </div>
                <button
                  onClick={() => deleteProject(project.id)}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-safe">
          <SheetHeader>
            <SheetTitle>{t('addProject')}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <Input
              placeholder={t('projectName')}
              value={name}
              onChange={e => setName(e.target.value)}
              className="rounded-xl h-12"
              autoFocus
            />

            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-9 h-9 rounded-full transition-all ${
                    color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <Input
              type="number"
              placeholder={t('hourlyRate')}
              value={rate}
              onChange={e => setRate(e.target.value)}
              className="rounded-xl h-12"
            />

            <div className="flex gap-3">
              <Button onClick={handleSave} className="flex-1 rounded-xl h-12">
                {t('save')}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl h-12">
                {t('cancel')}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
