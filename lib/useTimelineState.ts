import { useState, useEffect, useCallback } from "react";

export interface TimelineState {
  // Core timeline state
  isLive: boolean;
  setIsLive: (isLive: boolean) => void;
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  startTime: number;
  setStartTime: (time: number | ((prev: number) => number)) => void;

  // Derived values
  windowSizeHours: number;

  // Memoized handlers
  handleLiveToggle: (live: boolean) => void;
  handlePlayPause: (playing: boolean) => void;
  handleStepBackward: () => void;
  handleStepForward: () => void;
}

export interface UseTimelineStateOptions {
  minTimeValue: number;
  windowSizeHours?: number;
}

export function useTimelineState({
  minTimeValue,
  windowSizeHours = 6,
}: UseTimelineStateOptions): TimelineState {
  const [isLive, setIsLive] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  // Use lazy initializer to capture time at mount, not on every render
  const [startTime, setStartTime] = useState(() => Date.now() - windowSizeHours * 60 * 60 * 1000);

  // TIMELAPSE PLAYBACK MODE
  useEffect(() => {
    if (isLive || !isPlaying) return;

    const interval = setInterval(() => {
      setStartTime((prev) => {
        // Base speed 1x = 6 hours in 2 minutes (180x acceleration)
        // 50ms interval * 180 * speed
        const delta = 50 * 180 * playbackSpeed;
        const next = prev + delta;

        // Loop if we hit end (minus window size)
        const limit = Date.now() - windowSizeHours * 60 * 60 * 1000;
        if (next >= limit) {
          return minTimeValue; // Loop back to start
        }
        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isLive, isPlaying, playbackSpeed, minTimeValue, windowSizeHours]);

  // Memoized handlers
  const handleLiveToggle = useCallback((live: boolean) => {
    setIsLive(live);
    if (live) setIsPlaying(false);
  }, []);

  const handlePlayPause = useCallback(
    (playing: boolean) => {
      if (isLive && playing) {
        setIsLive(false);
      }
      setIsPlaying(playing);
    },
    [isLive]
  );

  const handleStepBackward = useCallback(() => {
    if (isLive) setIsLive(false);
    setStartTime((prev) => Math.max(minTimeValue, prev - 15 * 60 * 1000)); // Step back 15 minutes
  }, [isLive, minTimeValue]);

  const handleStepForward = useCallback(() => {
    if (isLive) setIsLive(false);
    const limit = Date.now() - windowSizeHours * 60 * 60 * 1000;
    setStartTime((prev) => Math.min(limit, prev + 15 * 60 * 1000)); // Step forward 15 minutes
  }, [isLive, windowSizeHours]);

  return {
    isLive,
    setIsLive,
    isPlaying,
    setIsPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    startTime,
    setStartTime,
    windowSizeHours,
    handleLiveToggle,
    handlePlayPause,
    handleStepBackward,
    handleStepForward,
  };
}
