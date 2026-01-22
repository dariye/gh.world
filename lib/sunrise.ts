/**
 * Sunrise Mode utilities
 *
 * Watch the globe rotate as commits light up following the sun.
 * 24 hours in 2 minutes - a meditation on global collaboration.
 */

import SunCalc from "suncalc";

/**
 * Sunrise mode configuration
 */
export const SUNRISE_CONFIG = {
  /** Real time duration for a full day cycle (2 minutes) */
  REAL_CYCLE_MS: 2 * 60 * 1000,
  /** Simulated time for a full cycle (24 hours) */
  SIMULATED_CYCLE_MS: 24 * 60 * 60 * 1000,
  /** Speed multiplier (720x) */
  SPEED: 720,
  /** Camera latitude (slightly north for better viewing angle) */
  CAMERA_LAT: 20,
  /** Camera altitude */
  CAMERA_ALTITUDE: 2.5,
  /** Camera lerp speed (0-1, higher = faster) */
  CAMERA_LERP: 0.03,
  /** Update interval in ms */
  UPDATE_INTERVAL: 50,
};

/**
 * Calculate the target camera longitude to follow the sun.
 * Returns the longitude where the sun is currently at its zenith (noon).
 */
export function getSunriseCameraTarget(simulatedTime: Date): number {
  // Get sun position at equator (lat=0, lng=0) to determine solar noon offset
  const times = SunCalc.getTimes(simulatedTime, 0, 0);
  const solarNoonTime = times.solarNoon.getTime();

  // Hour angle: how many hours before/after solar noon at lng=0
  const hourAngle = (simulatedTime.getTime() - solarNoonTime) / (3600 * 1000);

  // Convert to longitude: 15 degrees per hour, negative because sun moves west
  const sunLng = -hourAngle * 15;

  // Normalize to -180 to 180
  let normalized = sunLng;
  while (normalized > 180) normalized -= 360;
  while (normalized < -180) normalized += 360;

  return normalized;
}

/**
 * Calculate simulated time from real elapsed time.
 * Maps real time progression to 720x accelerated time.
 */
export function getSimulatedTime(
  startRealTime: number,
  startSimulatedTime: number,
  currentRealTime: number
): Date {
  const realElapsed = currentRealTime - startRealTime;
  const simulatedElapsed = realElapsed * SUNRISE_CONFIG.SPEED;
  return new Date(startSimulatedTime + simulatedElapsed);
}

/**
 * Format simulated time for display (HH:MM format).
 */
export function formatSimulatedTime(time: Date): string {
  const hours = time.getUTCHours().toString().padStart(2, "0");
  const minutes = time.getUTCMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Lerp (linear interpolation) for smooth camera transitions.
 * Handles longitude wrap-around at -180/180 boundary.
 */
export function lerpLongitude(current: number, target: number, t: number): number {
  // Calculate the shortest path around the globe
  let diff = target - current;

  // Handle wrap-around: if diff > 180, go the other way
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;

  return current + diff * t;
}
