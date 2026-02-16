import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useApp } from '@/contexts/AppContext';

interface AmbientSoundPlayerProps {
  compact?: boolean;
}

export default function AmbientSoundPlayer({ compact = false }: AmbientSoundPlayerProps) {
  const { t } = useApp();
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [audioError, setAudioError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load saved preferences
  useEffect(() => {
    const savedVolume = localStorage.getItem('ambientVolume');
    const savedIsPlaying = localStorage.getItem('ambientIsPlaying');
    
    if (savedVolume) {
      setVolume(parseInt(savedVolume, 10));
    }
    if (savedIsPlaying === 'true') {
      setIsPlaying(true);
    }
  }, []);

  // Initialize audio element
  useEffect(() => {
    // Try external CDN first, with error handling
    audioRef.current = new Audio('https://cdn.pixabay.com/download/audio/2022/05/13/audio_257112e488.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = volume / 100;
    
    audioRef.current.addEventListener('error', () => {
      console.warn('Failed to load audio from CDN');
      setAudioError(true);
      setIsPlaying(false);
    });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

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

  const togglePlay = () => {
    if (audioError) {
      console.warn('Audio not available');
      return;
    }
    setIsPlaying(!isPlaying);
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
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t('rainSound')}</span>
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
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{t('rainSound')}</span>
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
