import { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Cloud, Flame, Waves, Coffee, Settings, RotateCcw } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface AmbientSoundPlayerProps {
  compact?: boolean;
}

type SoundType = 'rain' | 'fireplace' | 'waves' | 'cafe';

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
    <div className="flex items-end justify-center gap-0.5 h-3 absolute -top-2 left-1/2 -translate-x-1/2">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="w-0.5 rounded-full bg-white"
          style={{
            animation: `visualizer ${0.3 + i * 0.1}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.08}s`,
            height: '3px'
          }}
        />
      ))}
      <style>{`
        @keyframes visualizer {
          0% { height: 3px; opacity: 0.6; }
          100% { height: 12px; opacity: 1; }
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
              isEnabled ? sound.color : "bg-white/10 hover:bg-white/20"
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

// Audio Manager - handles all audio operations
class AudioManager {
  private audioElements: Map<SoundType, HTMLAudioElement> = new Map();
  private initialized = false;
  
  init(basePath: string) {
    if (this.initialized) return;
    
    SOUND_OPTIONS.forEach(sound => {
      const audio = new Audio(`${basePath}${sound.localPath}`);
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = 0.5;
      this.audioElements.set(sound.id, audio);
    });
    
    this.initialized = true;
  }
  
  play(soundId: SoundType) {
    const audio = this.audioElements.get(soundId);
    if (audio) {
      audio.currentTime = audio.currentTime || 0;
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch(err => console.error(`Failed to play ${soundId}:`, err));
      }
    }
  }
  
  pause(soundId: SoundType) {
    const audio = this.audioElements.get(soundId);
    if (audio) {
      audio.pause();
    }
  }
  
  setVolume(soundId: SoundType, volume: number) {
    const audio = this.audioElements.get(soundId);
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, volume));
    }
  }
  
  isPlaying(soundId: SoundType): boolean {
    const audio = this.audioElements.get(soundId);
    return audio ? !audio.paused : false;
  }
  
  cleanup() {
    this.audioElements.forEach(audio => {
      audio.pause();
      audio.src = '';
    });
    this.audioElements.clear();
    this.initialized = false;
  }
}

// Singleton audio manager
const audioManager = new AudioManager();

export default function AmbientSoundPlayer({ compact = false }: AmbientSoundPlayerProps) {
  const [masterVolume, setMasterVolume] = useState(50);
  const [individualVolumes, setIndividualVolumes] = useState<Record<SoundType, number>>({
    rain: 50,
    fireplace: 50,
    waves: 50,
    cafe: 50
  });
  const [enabledSounds, setEnabledSounds] = useState<Set<SoundType>>(new Set());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const isInitialized = useRef(false);

  // Initialize audio manager
  useEffect(() => {
    if (!isInitialized.current) {
      const basePath = import.meta.env.PROD ? '/sa3aty-time-tracker' : '';
      audioManager.init(basePath);
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
  }, []);

  // Sync audio state with enabledSounds
  useEffect(() => {
    SOUND_OPTIONS.forEach(sound => {
      const isEnabled = enabledSounds.has(sound.id);
      const isPlaying = audioManager.isPlaying(sound.id);
      
      if (isEnabled && !isPlaying) {
        audioManager.play(sound.id);
      } else if (!isEnabled && isPlaying) {
        audioManager.pause(sound.id);
      }
    });
    
    localStorage.setItem('ambientEnabledSounds', JSON.stringify(Array.from(enabledSounds)));
  }, [enabledSounds]);

  // Update volumes
  useEffect(() => {
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

  // Settings content
  const SettingsContent = () => (
    <div className="space-y-4">
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

  // Compact version for mobile
  if (compact) {
    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40">
        <div className="flex flex-col items-center gap-3 bg-black/30 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/10">
          <div className="flex items-center gap-2">
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
                  className="h-12 w-12 rounded-xl bg-white/10 hover:bg-white/20"
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
            <VolumeX className="h-4 w-4 text-white/60 shrink-0" />
            <Slider
              value={[masterVolume]}
              onValueChange={(values) => setMasterVolume(values[0])}
              max={100}
              step={1}
              className="flex-1"
            />
            <Volume2 className="h-4 w-4 text-white/60 shrink-0" />
          </div>
        </div>
      </div>
    );
  }

  // Desktop version
  return (
    <div className="p-4 bg-muted/50 rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">أصوات محيطة</span>
        
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

      {enabledSounds.size > 0 && (
        <div className="text-center text-xs text-muted-foreground">
          {enabledSounds.size} صوت مفعّل
        </div>
      )}
    </div>
  );
}
