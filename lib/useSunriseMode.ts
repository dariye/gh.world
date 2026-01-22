import { useState, useEffect, useCallback } from "react";
import {
  SUNRISE_CONFIG,
  getSunriseCameraTarget,
  getSimulatedTime,
} from "@/lib/sunrise";

interface UseSunriseModeOptions {
  windowSizeHours: number;
  onStartTimeChange: (time: number | ((prev: number) => number)) => void;
  onExitLive: () => void;
}

interface SunriseModeState {
  isSunriseMode: boolean;
  simulatedTime: Date | null;
  sunriseCameraTarget: number | null;
}

interface SunriseModeActions {
  handleSunriseModeToggle: (active: boolean) => void;
}

export function useSunriseMode(
  options: UseSunriseModeOptions
): SunriseModeState & SunriseModeActions {
  const { windowSizeHours, onStartTimeChange, onExitLive } = options;

  const [isSunriseMode, setIsSunriseMode] = useState(false);
  const [sunriseStartReal, setSunriseStartReal] = useState<number | null>(null);
  const [sunriseStartSimulated, setSunriseStartSimulated] = useState<number | null>(null);
  const [simulatedTime, setSimulatedTime] = useState<Date | null>(null);
  const [sunriseCameraTarget, setSunriseCameraTarget] = useState<number | null>(null);

  // Sunrise mode loop - camera follows the sun at 720x speed
  useEffect(() => {
    if (!isSunriseMode || sunriseStartReal === null || sunriseStartSimulated === null) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const simTime = getSimulatedTime(sunriseStartReal, sunriseStartSimulated, now);
      setSimulatedTime(simTime);

      // Update startTime for playback queries (sync with simulated time)
      onStartTimeChange(simTime.getTime() - (windowSizeHours * 60 * 60 * 1000) / 2);

      // Calculate camera target to follow the sun
      const targetLng = getSunriseCameraTarget(simTime);
      setSunriseCameraTarget(targetLng);
    }, SUNRISE_CONFIG.UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [isSunriseMode, sunriseStartReal, sunriseStartSimulated, windowSizeHours, onStartTimeChange]);

  // Sunrise mode toggle handler
  const handleSunriseModeToggle = useCallback(
    (active: boolean) => {
      setIsSunriseMode(active);

      if (active) {
        // Start sunrise mode: exit live, set up time tracking
        onExitLive();
        const now = Date.now();
        setSunriseStartReal(now);
        // Start simulation 6 hours ago for good initial view
        setSunriseStartSimulated(now - 6 * 60 * 60 * 1000);
        setSimulatedTime(new Date(now - 6 * 60 * 60 * 1000));
      } else {
        // Exit sunrise mode: clear state
        setSunriseStartReal(null);
        setSunriseStartSimulated(null);
        setSimulatedTime(null);
        setSunriseCameraTarget(null);
      }
    },
    [onExitLive]
  );

  return {
    isSunriseMode,
    simulatedTime,
    sunriseCameraTarget,
    handleSunriseModeToggle,
  };
}
