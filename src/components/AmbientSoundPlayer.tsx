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
  const bars = 4;
  
  if (!isActive) return null;
  
  return (
    <div className="flex items-end justify-center gap-0.5 h-3 absolute -top-2 left-1/2 -translate-x-1/2">
      {Array.from({ length: bars }).map((_, i) => (
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

// Sound Button Component (icon only with tooltip)
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
  const audioRefsMap = useRef<Map<SoundType, HTMLAudioElement>>(new Map());

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

  // Initialize audio elements
  useEffect(() => {
    const basePath = import.meta.env.PROD ? '/sa3aty-time-tracker' : '';
    const audioRefs = audioRefsMap.current;
    
    SOUND_OPTIONS.forEach(sound => {
      if (!audioRefs.has(sound.id)) {
        const audio = new Audio(`${basePath}${sound.localPath}`);
        audio.loop = true;
        audio.volume = (masterVolume / 100) * (individualVolumes[sound.id] / 100);
        
        audio.addEventListener('error', () => {
          console.error(`Failed to load audio: ${sound.id}`);
        });
        
        audioRefs.set(sound.id, audio);
      }
    });

    return () => {
      audioRefs.forEach(audio => {
        audio.pause();
      });
      audioRefs.clear();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle volume changes
  useEffect(() => {
    audioRefsMap.current.forEach((audio, soundId) => {
      audio.volume = (masterVolume / 100) * (individualVolumes[soundId] / 100);
    });
    localStorage.setItem('ambientMasterVolume', masterVolume.toString());
    localStorage.setItem('ambientIndividualVolumes', JSON.stringify(individualVolumes));
  }, [masterVolume, individualVolumes]);

  // Play/pause sounds
  useEffect(() => {
    audioRefsMap.current.forEach((audio, soundId) => {
      if (enabledSounds.has(soundId)) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error(`Error playing ${soundId}:`, error);
          });
        }
      } else {
        audio.pause();
      }
    });

    localStorage.setItem('ambientEnabledSounds', JSON.stringify(Array.from(enabledSounds)));
  }, [enabledSounds]);

  const toggleSound = useCallback((soundId: SoundType) => {
    setEnabledSounds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(soundId)) {
        newSet.delete(soundId);
      } else {
        newSet.add(soundId);
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

  // Settings content (shared between mobile Sheet and desktop Dialog)
  const SettingsContent = () => (
    <div className="space-y-4">
      {/* Reset button */}
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

      {/* Individual sound mixers */}
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
          {/* Sound buttons row */}
          <div className="flex items-center gap-2">
            {SOUND_OPTIONS.map(sound => (
              <SoundButton
                key={sound.id}
                sound={sound}
                isEnabled={enabledSounds.has(sound.id)}
                onToggle={() => toggleSound(sound.id)}
              />
            ))}
            
            {/* Settings button - opens Sheet from bottom on mobile */}
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

          {/* Master volume slider */}
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

  // Full version for desktop sidebar
  return (
    <div className="p-4 bg-muted/50 rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">أصوات محيطة</span>
        
        {/* Settings button - opens Dialog centered on desktop */}
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
      
      {/* Sound toggle buttons */}
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

      {/* Master volume control */}
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

      {/* Active sounds indicator */}
      {enabledSounds.size > 0 && (
        <div className="text-center text-xs text-muted-foreground">
          {enabledSounds.size} صوت مفعّل
        </div>
      )}
    </div>
  );
}
