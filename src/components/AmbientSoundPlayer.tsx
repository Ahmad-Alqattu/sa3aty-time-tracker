import { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Cloud, Flame, Waves, Coffee, Settings, RotateCcw, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { audioManager, SoundType, setManuallyPaused, getManuallyPaused } from '@/lib/audioManager';

export type AmbientPlayerMode = 'inline' | 'floating' | 'sidebar' | 'header-icon' | 'side-panel' | 'fixed-top';

interface AmbientSoundPlayerProps {
  mode?: AmbientPlayerMode;
  /** @deprecated Use mode instead */
  compact?: boolean;
}

interface SoundOption {
  id: SoundType;
  name: string;
  nameAr: string;
  localPath: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const SOUND_OPTIONS: SoundOption[] = [
  {
    id: 'rain',
    name: 'Rain',
    nameAr: 'مطر',
    localPath: '/rain.mp3',
    icon: Cloud,
    color: 'bg-blue-500'
  },
  {
    id: 'fireplace',
    name: 'Fireplace',
    nameAr: 'مدفأة',
    localPath: '/fiar.mp3',
    icon: Flame,
    color: 'bg-orange-500'
  },
  {
    id: 'waves',
    name: 'Waves',
    nameAr: 'أمواج',
    localPath: '/waves.mp3',
    icon: Waves,
    color: 'bg-cyan-500'
  },
  {
    id: 'cafe',
    name: 'Cafe',
    nameAr: 'مقهى',
    localPath: '/cafe.mp3',
    icon: Coffee,
    color: 'bg-amber-700'
  }
];

// Audio Visualizer Component
function AudioVisualizer({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;
  
  return (
    <div className="flex items-end justify-center gap-0.5 h-3 absolute bottom-1 left-1/2 -translate-x-1/2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-0.5 rounded-full bg-white/90"
          style={{
            animation: `visualizer ${0.25 + i * 0.1}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.06}s`,
            height: '2px'
          }}
        />
      ))}
      <style>{`
        @keyframes visualizer {
          0% { height: 2px; opacity: 0.5; }
          100% { height: 8px; opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// Sound Button Component
function SoundButton({ 
  sound, 
  isEnabled, 
  onToggle 
}: { 
  sound: SoundOption; 
  isEnabled: boolean; 
  onToggle: () => void;
}) {
  const Icon = sound.icon;
  
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isEnabled ? "default" : "outline"}
            size="icon"
            onClick={onToggle}
            className={cn(
              "relative h-12 w-12 rounded-xl transition-all duration-300 border-0",
              isEnabled && "shadow-lg scale-105",
            isEnabled ? sound.color : "bg-white/20 hover:bg-white/30 border border-white/20"
            )}
          >
            <AudioVisualizer isActive={isEnabled} />
            <Icon className={cn(
              "h-5 w-5 transition-transform",
              isEnabled && "text-white"
            )} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p>{sound.nameAr}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Mixer Slider for individual sound volume
function MixerSlider({
  sound,
  volume,
  isEnabled,
  onVolumeChange,
  onToggle
}: {
  sound: SoundOption;
  volume: number;
  isEnabled: boolean;
  onVolumeChange: (value: number) => void;
  onToggle: () => void;
}) {
  const Icon = sound.icon;
  
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-xl transition-all",
      isEnabled ? "bg-muted/50" : "opacity-50"
    )}>
      <Button
        variant={isEnabled ? "default" : "outline"}
        size="icon"
        onClick={onToggle}
        className={cn(
          "h-10 w-10 rounded-lg shrink-0",
          isEnabled && sound.color
        )}
      >
        <Icon className="h-4 w-4" />
      </Button>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium">{sound.nameAr}</span>
          <span className="text-muted-foreground">{volume}%</span>
        </div>
        <Slider
          value={[volume]}
          onValueChange={(values) => onVolumeChange(values[0])}
          max={100}
          step={1}
          disabled={!isEnabled}
          className="w-full"
        />
      </div>
    </div>
  );
}

export default function AmbientSoundPlayer({ mode = 'sidebar', compact = false }: AmbientSoundPlayerProps) {
  // Handle legacy compact prop
  const effectiveMode = compact ? 'floating' : mode;
  
  const [masterVolume, setMasterVolume] = useState(50);
  const [individualVolumes, setIndividualVolumes] = useState<Record<SoundType, number>>({
    rain: 50,
    fireplace: 50,
    waves: 50,
    cafe: 50
  });
  const [enabledSounds, setEnabledSounds] = useState<Set<SoundType>>(new Set());
  const [isPaused, setIsPaused] = useState(false); // Paused state (keeps settings)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [soundTimerSync, setSoundTimerSync] = useState(false);
  const isInitialized = useRef(false);
  const preferencesLoaded = useRef(false);

  // Initialize audio manager
  useEffect(() => {
    if (!isInitialized.current) {
      const basePath = import.meta.env.BASE_URL || '/';
      audioManager.init(basePath.endsWith('/') ? basePath.slice(0, -1) : basePath);
      isInitialized.current = true;
    }
    
    return () => {
      // Don't cleanup on unmount to keep audio playing during navigation
    };
  }, []);

  // Load saved preferences
  useEffect(() => {
    const savedMasterVolume = localStorage.getItem('ambientMasterVolume');
    const savedIndividualVolumes = localStorage.getItem('ambientIndividualVolumes');
    const savedEnabledSounds = localStorage.getItem('ambientEnabledSounds');
    const savedTimerSync = localStorage.getItem('ambientSoundTimerSync');
    const savedPaused = getManuallyPaused();
    
    if (savedMasterVolume) {
      setMasterVolume(parseInt(savedMasterVolume, 10));
    }
    if (savedIndividualVolumes) {
      try {
        setIndividualVolumes(JSON.parse(savedIndividualVolumes));
      } catch (e) {
        console.error('Failed to parse individual volumes', e);
      }
    }
    if (savedEnabledSounds) {
      try {
        const sounds = JSON.parse(savedEnabledSounds) as SoundType[];
        setEnabledSounds(new Set(sounds));
      } catch (e) {
        console.error('Failed to parse enabled sounds', e);
      }
    }
    if (savedTimerSync) {
      setSoundTimerSync(savedTimerSync === 'true');
    }
    setIsPaused(savedPaused);
    preferencesLoaded.current = true;
  }, []);

  // Sync audio state with enabledSounds and isPaused (only after preferences loaded)
  useEffect(() => {
    if (!preferencesLoaded.current) return;
    
    SOUND_OPTIONS.forEach(sound => {
      const isEnabled = enabledSounds.has(sound.id);
      const isPlaying = audioManager.isPlaying(sound.id);
      
      if (isPaused) {
        // If paused, stop all sounds
        if (isPlaying) {
          audioManager.pause(sound.id);
        }
      } else {
        // If not paused, play enabled sounds
        if (isEnabled && !isPlaying) {
          audioManager.play(sound.id);
        } else if (!isEnabled && isPlaying) {
          audioManager.pause(sound.id);
        }
      }
    });
    
    if (preferencesLoaded.current) {
      localStorage.setItem('ambientEnabledSounds', JSON.stringify(Array.from(enabledSounds)));
    }
  }, [enabledSounds, isPaused]);

  // Update volumes
  useEffect(() => {
    if (!preferencesLoaded.current) return;
    
    SOUND_OPTIONS.forEach(sound => {
      const finalVolume = (masterVolume / 100) * (individualVolumes[sound.id] / 100);
      audioManager.setVolume(sound.id, finalVolume);
    });
    
    localStorage.setItem('ambientMasterVolume', masterVolume.toString());
    localStorage.setItem('ambientIndividualVolumes', JSON.stringify(individualVolumes));
  }, [masterVolume, individualVolumes]);

  const toggleSound = useCallback((soundId: SoundType) => {
    setEnabledSounds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(soundId)) {
        newSet.delete(soundId);
        audioManager.pause(soundId); // Immediately pause
      } else {
        newSet.add(soundId);
        audioManager.play(soundId); // Immediately play
      }
      return newSet;
    });
  }, []);

  const updateIndividualVolume = useCallback((soundId: SoundType, volume: number) => {
    setIndividualVolumes(prev => ({
      ...prev,
      [soundId]: volume
    }));
  }, []);

  const resetToMasterVolume = useCallback(() => {
    setIndividualVolumes({
      rain: masterVolume,
      fireplace: masterVolume,
      waves: masterVolume,
      cafe: masterVolume
    });
  }, [masterVolume]);

  const toggleTimerSync = useCallback(() => {
    setSoundTimerSync(prev => {
      const newValue = !prev;
      localStorage.setItem('ambientSoundTimerSync', newValue.toString());
      return newValue;
    });
  }, []);

  // Settings content
  const SettingsContent = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
        <Label htmlFor="timer-sync" className="text-sm cursor-pointer">
          إيقاف/تشغيل مع المؤقت
        </Label>
        <Switch
          id="timer-sync"
          checked={soundTimerSync}
          onCheckedChange={toggleTimerSync}
        />
      </div>
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={resetToMasterVolume}
          className="text-xs gap-1"
        >
          <RotateCcw className="h-3 w-3" />
          توحيد الصوت
        </Button>
      </div>
      <div className="space-y-2">
        {SOUND_OPTIONS.map(sound => (
          <MixerSlider
            key={sound.id}
            sound={sound}
            volume={individualVolumes[sound.id]}
            isEnabled={enabledSounds.has(sound.id)}
            onVolumeChange={(v) => updateIndividualVolume(sound.id, v)}
            onToggle={() => toggleSound(sound.id)}
          />
        ))}
      </div>
    </div>
  );

  // Pause all sounds (keeps settings)
  const pauseAll = useCallback(() => {
    setIsPaused(true);
    setManuallyPaused(true);
    SOUND_OPTIONS.forEach(sound => {
      audioManager.pause(sound.id);
    });
  }, []);

  // Resume all sounds
  const resumeAll = useCallback(() => {
    setIsPaused(false);
    setManuallyPaused(false);
    enabledSounds.forEach(soundId => {
      audioManager.play(soundId);
    });
  }, [enabledSounds]);

  // Toggle pause state
  const togglePause = useCallback(() => {
    if (isPaused) {
      resumeAll();
    } else {
      pauseAll();
    }
  }, [isPaused, pauseAll, resumeAll]);

  const hasActiveSounds = enabledSounds.size > 0;
  const isPlaying = hasActiveSounds && !isPaused;

  // Header icon mode - just a toggle button
  if (effectiveMode === 'header-icon') {
    return (
      <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "relative h-9 w-9 rounded-lg",
              hasActiveSounds && "text-primary"
            )}
          >
            {hasActiveSounds ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            {hasActiveSounds && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-3xl pb-safe">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-center">أصوات محيطة</SheetTitle>
          </SheetHeader>
          <div className="space-y-4">
            <div className="flex justify-center gap-2">
              {SOUND_OPTIONS.map(sound => (
                <SoundButton
                  key={sound.id}
                  sound={sound}
                  isEnabled={enabledSounds.has(sound.id)}
                  onToggle={() => toggleSound(sound.id)}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <VolumeX className="h-4 w-4 text-muted-foreground" />
              <Slider
                value={[masterVolume]}
                onValueChange={(values) => setMasterVolume(values[0])}
                max={100}
                step={1}
                className="flex-1"
              />
              <Volume2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <SettingsContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Inline mode - scrollable with the page, with glass effect
  if (effectiveMode === 'inline') {
    return (
      <div 
        className="rounded-2xl p-4 space-y-4 border border-white/20"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">أصوات محيطة</span>
          <div className="flex items-center gap-1">
            {hasActiveSounds && (
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePause}
                className="h-8 px-2 text-xs gap-1 hover:bg-white/20"
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {isPaused ? 'استئناف' : 'إيقاف'}
              </Button>
            )}
            <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/20">
                  <Settings className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-3xl pb-safe">
                <SheetHeader className="pb-4">
                  <SheetTitle className="text-center">مكسر الأصوات</SheetTitle>
                </SheetHeader>
                <SettingsContent />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex justify-center gap-2">
          {SOUND_OPTIONS.map(sound => (
            <SoundButton
              key={sound.id}
              sound={sound}
              isEnabled={enabledSounds.has(sound.id)}
              onToggle={() => toggleSound(sound.id)}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <VolumeX className="h-4 w-4 text-muted-foreground" />
          <Slider
            value={[masterVolume]}
            onValueChange={(values) => setMasterVolume(values[0])}
            max={100}
            step={1}
            className="flex-1"
          />
          <Volume2 className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Floating mode (collapsible) for mobile on other pages
  if (effectiveMode === 'floating') {
    return (
      <div className="fixed bottom-20 end-4 z-40">
        {isCollapsed ? (
          // Collapsed state - just a small button
          <Button
            onClick={() => setIsCollapsed(false)}
            size="icon"
            className={cn(
              "h-12 w-12 rounded-full shadow-lg",
              isPlaying && "bg-primary"
            )}
          >
            {isPlaying ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            {isPlaying && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            )}
          </Button>
        ) : (
          // Expanded state
          <div 
            className="flex flex-col items-center gap-3 bg-white/15 backdrop-blur-3xl rounded-3xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/30"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.3)'
            }}
          >
            {/* Collapse button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(true)}
              className="absolute -top-2 -end-2 h-6 w-6 rounded-full bg-muted p-0 text-xs"
            >
              ×
            </Button>
            
            <div className="flex items-center gap-2">
              {/* Pause/Play button */}
              {hasActiveSounds && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={togglePause}
                  className="h-12 w-12 rounded-2xl bg-white/20 hover:bg-white/30 border border-white/20 transition-all"
                  title={isPaused ? 'استئناف' : 'إيقاف'}
                >
                  {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                </Button>
              )}
              
              {SOUND_OPTIONS.map(sound => (
                <SoundButton
                  key={sound.id}
                  sound={sound}
                  isEnabled={enabledSounds.has(sound.id)}
                  onToggle={() => toggleSound(sound.id)}
                />
              ))}
              
              <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <SheetTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-12 w-12 rounded-2xl bg-white/20 hover:bg-white/30 border border-white/20 transition-all"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-3xl">
                  <SheetHeader className="pb-4">
                    <SheetTitle className="text-center">مكسر الأصوات</SheetTitle>
                  </SheetHeader>
                  <SettingsContent />
                </SheetContent>
              </Sheet>
            </div>

            <div className="flex items-center gap-2 w-full px-1">
              <VolumeX className="h-4 w-4 text-white/70 shrink-0" />
              <Slider
                value={[masterVolume]}
                onValueChange={(values) => setMasterVolume(values[0])}
                max={100}
                step={1}
                className="flex-1"
              />
              <Volume2 className="h-4 w-4 text-white/70 shrink-0" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Side panel mode - glass effect panel on the side for desktop
  if (effectiveMode === 'side-panel') {
    return (
      <div 
        className={cn(
          "fixed end-0 top-1/2 -translate-y-1/2 z-40 transition-all duration-300",
          isPanelCollapsed ? "translate-x-[calc(100%-3rem)]" : ""
        )}
      >
        <div 
          className="flex"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {/* Collapse toggle */}
          <button
            onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
            className="flex items-center justify-center w-12 h-24 bg-white/10 hover:bg-white/20 border-s border-white/20 rounded-s-2xl transition-colors"
          >
            {isPanelCollapsed ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            {hasActiveSounds && isPanelCollapsed && (
              <span className="absolute top-2 end-2 w-2 h-2 bg-primary rounded-full animate-pulse" />
            )}
          </button>
          
          {/* Panel content */}
          <div 
            className={cn(
              "flex flex-col gap-4 p-4 border border-white/20 border-e-0 rounded-s-2xl",
              "bg-gradient-to-br from-white/15 to-white/5",
              "shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
            )}
            style={{ minWidth: '280px' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">أصوات محيطة</span>
              <div className="flex items-center gap-1">
                {hasActiveSounds && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={togglePause}
                    className="h-8 w-8 hover:bg-white/20"
                    title={isPaused ? 'استئناف' : 'إيقاف الكل'}
                  >
                    {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </Button>
                )}
                <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/20">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-center">مكسر الأصوات</DialogTitle>
                    </DialogHeader>
                    <SettingsContent />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-2">
              {SOUND_OPTIONS.map(sound => (
                <SoundButton
                  key={sound.id}
                  sound={sound}
                  isEnabled={enabledSounds.has(sound.id)}
                  onToggle={() => toggleSound(sound.id)}
                />
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-white/70">
                <span>مستوى الصوت</span>
                <span className="font-mono">{masterVolume}%</span>
              </div>
              <div className="flex items-center gap-2">
                <VolumeX className="h-4 w-4 text-white/70" />
                <Slider
                  value={[masterVolume]}
                  onValueChange={(values) => setMasterVolume(values[0])}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <Volume2 className="h-4 w-4 text-white/70" />
              </div>
            </div>

            {hasActiveSounds && (
              <div className="text-center text-xs text-white/70">
                {enabledSounds.size} صوت مفعّل
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Sidebar/Desktop version (default)
  return (
    <div className="p-4 bg-muted/50 rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">أصوات محيطة</span>
        <div className="flex items-center gap-1">
          {hasActiveSounds && (
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePause}
              className="h-8 w-8"
              title={isPaused ? 'استئناف' : 'إيقاف الكل'}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
          )}
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-center">مكسر الأصوات</DialogTitle>
              </DialogHeader>
              <SettingsContent />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="flex justify-center gap-2">
        {SOUND_OPTIONS.map(sound => (
          <SoundButton
            key={sound.id}
            sound={sound}
            isEnabled={enabledSounds.has(sound.id)}
            onToggle={() => toggleSound(sound.id)}
          />
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>مستوى الصوت</span>
          <span className="font-mono">{masterVolume}%</span>
        </div>
        <div className="flex items-center gap-2">
          <VolumeX className="h-4 w-4 text-muted-foreground" />
          <Slider
            value={[masterVolume]}
            onValueChange={(values) => setMasterVolume(values[0])}
            max={100}
            step={1}
            className="flex-1"
          />
          <Volume2 className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {hasActiveSounds && (
        <div className="text-center text-xs text-muted-foreground">
          {enabledSounds.size} صوت مفعّل
        </div>
      )}
    </div>
  );
}
