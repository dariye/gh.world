"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import {
  isSoundEnabled,
  setSoundEnabled,
  getVolume,
  setVolume,
  initAudio,
} from "@/lib/audio";

// Store for syncing sound enabled state
let soundEnabledListeners: Array<() => void> = [];
function subscribeSoundEnabled(callback: () => void) {
  soundEnabledListeners.push(callback);
  return () => {
    soundEnabledListeners = soundEnabledListeners.filter((l) => l !== callback);
  };
}
function notifySoundEnabledChange() {
  soundEnabledListeners.forEach((l) => l());
}

// Store for syncing volume state
let volumeListeners: Array<() => void> = [];
function subscribeVolume(callback: () => void) {
  volumeListeners.push(callback);
  return () => {
    volumeListeners = volumeListeners.filter((l) => l !== callback);
  };
}
function notifyVolumeChange() {
  volumeListeners.forEach((l) => l());
}

export function SoundToggle() {
  // Use useSyncExternalStore for hydration-safe localStorage access
  const enabled = useSyncExternalStore(
    subscribeSoundEnabled,
    () => isSoundEnabled(),
    () => false // Server snapshot
  );

  const volume = useSyncExternalStore(
    subscribeVolume,
    () => getVolume(),
    () => 0.3 // Server snapshot
  );

  const handleToggle = useCallback(() => {
    const newEnabled = !enabled;
    setSoundEnabled(newEnabled);
    notifySoundEnabledChange();

    // Initialize audio on first enable (requires user gesture)
    if (newEnabled) {
      initAudio();
    }
  }, [enabled]);

  const handleVolumeChange = useCallback((values: number[]) => {
    const newVolume = values[0] / 100; // Slider is 0-100, we want 0-1
    setVolume(newVolume);
    notifyVolumeChange();
  }, []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`text-white/60 hover:text-white hover:bg-white/10 ${
            enabled ? "text-white/90" : ""
          }`}
          onClick={handleToggle}
          aria-label={enabled ? "Mute sounds" : "Enable sounds"}
        >
          {enabled ? (
            <Volume2 className="h-[1.2rem] w-[1.2rem]" />
          ) : (
            <VolumeX className="h-[1.2rem] w-[1.2rem]" />
          )}
          <span className="sr-only">Toggle sound</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-48 bg-[#000510] border-white/10 text-white p-4"
        align="end"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/60 uppercase tracking-wider">
              Commit Sounds
            </span>
            <button
              onClick={handleToggle}
              className={`text-xs px-2 py-0.5 rounded ${
                enabled
                  ? "bg-green-500/20 text-green-400"
                  : "bg-white/10 text-white/40"
              }`}
            >
              {enabled ? "On" : "Off"}
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-white/40">
              <span>Volume</span>
              <span>{Math.round(volume * 100)}%</span>
            </div>
            <Slider
              value={[volume * 100]}
              min={0}
              max={100}
              step={5}
              onValueChange={handleVolumeChange}
              disabled={!enabled}
              className={!enabled ? "opacity-50" : ""}
            />
          </div>
          <p className="text-[10px] text-white/30 leading-tight">
            Each commit plays a note. Language determines timbre, latitude
            determines pitch.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
