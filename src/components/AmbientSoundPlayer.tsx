import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';

interface AmbientSoundPlayerProps {
  compact?: boolean;
}

type SoundType = 'rain' | 'cafe' | 'brownNoise';

interface SoundOption {
  id: SoundType;
  name: string;
  nameAr: string;
  localPath: string;
}

const SOUND_OPTIONS: SoundOption[] = [
  {
    id: 'rain',
    name: 'Rain',
    nameAr: 'مطر',
    localPath: '/rain-07.mp3'
  },
  {
    id: 'cafe',
    name: 'Cafe',
    nameAr: 'مقهى',
    localPath: '/cafe-ambience.mp3'
  },
  {
    id: 'brownNoise',
    name: 'Brown Noise',
    nameAr: 'ضجيج بني',
    localPath: '/brown-noise.mp3'
  }
];

export default function AmbientSoundPlayer({ compact = false }: AmbientSoundPlayerProps) {
  const { t } = useApp();
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [selectedSound, setSelectedSound] = useState<SoundType>('rain');
  const [audioError, setAudioError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load saved preferences
  useEffect(() => {
    const savedVolume = localStorage.getItem('ambientVolume');
    const savedIsPlaying = localStorage.getItem('ambientIsPlaying');
    const savedSound = localStorage.getItem('ambientSound') as SoundType;
    
    if (savedVolume) {
      setVolume(parseInt(savedVolume, 10));
    }
    if (savedIsPlaying === 'true') {
      setIsPlaying(true);
    }
    if (savedSound && SOUND_OPTIONS.find(s => s.id === savedSound)) {
      setSelectedSound(savedSound);
    }
  }, []);

  // Initialize audio element
  useEffect(() => {
    // Determine the base path based on environment
    const basePath = import.meta.env.PROD ? '/sa3aty-time-tracker' : '';
    
    // Get the current sound option
    const currentSound = SOUND_OPTIONS.find(s => s.id === selectedSound) || SOUND_OPTIONS[0];
    
    // Use local audio file only
    const audioSource = `${basePath}${currentSound.localPath}`;
    
    let errorHandler: (() => void) | null = null;
    let loadedHandler: (() => void) | null = null;
    
    const cleanupCurrentAudio = () => {
      if (audioRef.current) {
        if (errorHandler) {
          audioRef.current.removeEventListener('error', errorHandler);
        }
        if (loadedHandler) {
          audioRef.current.removeEventListener('canplaythrough', loadedHandler);
        }
        audioRef.current.pause();
      }
    };
    
    // Clean up previous audio element and listeners
    cleanupCurrentAudio();
    
    audioRef.current = new Audio(audioSource);
    audioRef.current.loop = true;
    audioRef.current.volume = volume / 100;
    
    errorHandler = () => {
      console.error(`Failed to load audio file: ${audioSource}`);
      setAudioError(true);
      setIsPlaying(false);
    };
    
    loadedHandler = () => {
      console.log('Audio loaded successfully from local file:', selectedSound);
      setAudioError(false);
    };
    
    audioRef.current.addEventListener('error', errorHandler);
    audioRef.current.addEventListener('canplaythrough', loadedHandler);

    return () => {
      cleanupCurrentAudio();
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
    // Only re-initialize when selectedSound changes (not volume - handled separately below)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSound]);

  // Handle play/pause
  useEffect(() => {
    if (!audioRef.current || audioError) return;

    if (isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Error playing audio:', error);
          setIsPlaying(false);
        });
      }
    } else {
      audioRef.current.pause();
    }

    localStorage.setItem('ambientIsPlaying', isPlaying.toString());
  }, [isPlaying, audioError]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
      localStorage.setItem('ambientVolume', volume.toString());
    }
  }, [volume]);

  // Save selected sound preference
  useEffect(() => {
    localStorage.setItem('ambientSound', selectedSound);
  }, [selectedSound]);

  const togglePlay = () => {
    if (audioError) {
      console.warn('Audio not available');
      return;
    }
    setIsPlaying(!isPlaying);
  };

  const handleSoundChange = (value: string) => {
    setSelectedSound(value as SoundType);
    // Stop current playback when changing sound
    setIsPlaying(false);
  };

  if (compact) {
    // Compact floating version for mobile
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            variant="secondary"
            className="h-12 w-12 rounded-full shadow-lg"
            disabled={audioError}
          >
            {isPlaying ? (
              <Volume2 className="h-5 w-5" />
            ) : (
              <VolumeX className="h-5 w-5" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" side="top" align="end">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t('ambientSounds')}</span>
              <Button
                size="sm"
                variant={isPlaying ? "default" : "outline"}
                onClick={togglePlay}
                disabled={audioError}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">نوع الصوت</div>
              <Select value={selectedSound} onValueChange={handleSoundChange} disabled={audioError}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOUND_OPTIONS.map(sound => (
                    <SelectItem key={sound.id} value={sound.id}>
                      {sound.nameAr} ({sound.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>الصوت</span>
                <span>{volume}%</span>
              </div>
              <Slider
                value={[volume]}
                onValueChange={(values) => setVolume(values[0])}
                max={100}
                step={1}
                className="w-full"
                disabled={audioError}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Full version for desktop sidebar
  return (
    <div className="p-3 bg-muted/50 rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{t('ambientSounds')}</span>
        <Button
          size="sm"
          variant={isPlaying ? "default" : "outline"}
          onClick={togglePlay}
          disabled={audioError}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
      </div>
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">نوع الصوت</div>
        <Select value={selectedSound} onValueChange={handleSoundChange} disabled={audioError}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SOUND_OPTIONS.map(sound => (
              <SelectItem key={sound.id} value={sound.id}>
                {sound.nameAr} ({sound.name})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>الصوت</span>
          <span>{volume}%</span>
        </div>
        <Slider
          value={[volume]}
          onValueChange={(values) => setVolume(values[0])}
          max={100}
          step={1}
          className="w-full"
          disabled={audioError}
        />
      </div>
    </div>
  );
}
