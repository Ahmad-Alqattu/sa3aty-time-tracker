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
    // Determine the base path based on environment
    const basePath = import.meta.env.PROD ? '/sa3aty-time-tracker' : '';
    
    // Try local audio file first, then fallback to CDN
    const audioSources = [
      `${basePath}/rain-ambient.mp3`,
      'https://cdn.pixabay.com/download/audio/2022/05/13/audio_257112e488.mp3'
    ];
    
    let currentSourceIndex = 0;
    let currentErrorHandler: (() => void) | null = null;
    let currentLoadedHandler: (() => void) | null = null;
    
    const cleanupCurrentAudio = () => {
      if (audioRef.current) {
        if (currentErrorHandler) {
          audioRef.current.removeEventListener('error', currentErrorHandler);
        }
        if (currentLoadedHandler) {
          audioRef.current.removeEventListener('canplaythrough', currentLoadedHandler);
        }
        audioRef.current.pause();
      }
    };
    
    const tryNextSource = () => {
      if (currentSourceIndex >= audioSources.length) {
        console.warn('All audio sources failed to load');
        setAudioError(true);
        setIsPlaying(false);
        return;
      }
      
      // Clean up previous audio element and listeners
      cleanupCurrentAudio();
      
      audioRef.current = new Audio(audioSources[currentSourceIndex]);
      audioRef.current.loop = true;
      audioRef.current.volume = volume / 100;
      
      currentErrorHandler = () => {
        console.warn(`Failed to load audio from source ${currentSourceIndex + 1}/${audioSources.length}`);
        currentSourceIndex++;
        tryNextSource();
      };
      
      currentLoadedHandler = () => {
        console.log('Audio loaded successfully');
        setAudioError(false);
      };
      
      audioRef.current.addEventListener('error', currentErrorHandler);
      audioRef.current.addEventListener('canplaythrough', currentLoadedHandler);
    };
    
    tryNextSource();

    return () => {
      cleanupCurrentAudio();
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
    // Volume is intentionally excluded - it's handled by the volume effect (lines 102-107)
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
