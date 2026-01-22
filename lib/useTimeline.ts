import { useState, useEffect, useCallback, useRef } from "react";

interface UseTimelineOptions {
  windowSizeHours?: number;
  oldestTimestamp?: number | null;
}

interface TimelineState {
  isLive: boolean;
  isPlaying: boolean;
  playbackSpeed: number;
  startTime: number;
  minTimeValue: number;
  maxTimeValue: number;
  windowSizeHours: number;
}

interface TimelineActions {
  setIsLive: (live: boolean) => void;
  setIsPlaying: (playing: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
  setStartTime: (time: number | ((prev: number) => number)) => void;
  handleLiveToggle: (live: boolean) => void;
  handlePlayPause: (playing: boolean) => void;
  handleStepBackward: () => void;
  handleStepForward: () => void;
}

// Capture initial time at module load (outside render)
const INITIAL_TIME = Date.now();

export function useTimeline(options: UseTimelineOptions = {}): TimelineState & TimelineActions {
  const { windowSizeHours = 6, oldestTimestamp } = options;

  const [isLive, setIsLive] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [startTime, setStartTime] = useState<number>(
    INITIAL_TIME - 6 * 60 * 60 * 1000
  );

  // Track time bounds in state, updated via interval
  const [timeBounds, setTimeBounds] = useState({
    minTimeValue: oldestTimestamp ?? (INITIAL_TIME - 24 * 60 * 60 * 1000),
    maxTimeValue: INITIAL_TIME,
  });

  // Ref to track if component is mounted
  const mountedRef = useRef(false);

  // Update time bounds periodically (every second when live)
  useEffect(() => {
    mountedRef.current = true;

    // Update immediately on mount
    const now = Date.now();
    setTimeBounds({
      minTimeValue: oldestTimestamp ?? (now - 24 * 60 * 60 * 1000),
      maxTimeValue: now,
    });

    // Only update periodically if in live mode
    if (!isLive) return;

    const interval = setInterval(() => {
      const currentTime = Date.now();
      setTimeBounds({
        minTimeValue: oldestTimestamp ?? (currentTime - 24 * 60 * 60 * 1000),
        maxTimeValue: currentTime,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLive, oldestTimestamp]);

  const { minTimeValue, maxTimeValue } = timeBounds;

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
    isPlaying,
    playbackSpeed,
    startTime,
    minTimeValue,
    maxTimeValue,
    windowSizeHours,
    setIsLive,
    setIsPlaying,
    setPlaybackSpeed,
    setStartTime,
    handleLiveToggle,
    handlePlayPause,
    handleStepBackward,
    handleStepForward,
  };
}
