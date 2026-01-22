"use client";

import { Sunrise } from "lucide-react";
import { formatSimulatedTime } from "@/lib/sunrise";

interface SunriseModeProps {
  isActive: boolean;
  onToggle: (active: boolean) => void;
  simulatedTime: Date | null;
}

/**
 * Sunrise Mode toggle button with simulated time display.
 *
 * Watch the globe rotate as commits light up following the sun.
 * 24 hours in 2 minutes - a meditation on global collaboration.
 */
export default function SunriseMode({
  isActive,
  onToggle,
  simulatedTime,
}: SunriseModeProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Simulated time display (only shown when active) */}
      {isActive && simulatedTime && (
        <div className="bg-amber-500/10 text-amber-400 px-2 py-1 rounded-md text-xs font-mono border border-amber-500/20">
          {formatSimulatedTime(simulatedTime)} UTC
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => onToggle(!isActive)}
className={`flex items-center gap-1 sm:gap-1 md:gap-1.5 px-2 sm:px-2.5 md:px-3 py-1 sm:py-1 md:py-1.5 rounded-full text-xs font-medium transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background ${
          isActive
            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
            : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70 border border-white/10"
        }`}
        aria-label={isActive ? "Exit Sunrise Mode" : "Enter Sunrise Mode"}
        title="Sunrise Mode: Watch 24 hours in 2 minutes"
      >
        <Sunrise className={`w-3.5 h-3.5 ${isActive ? "animate-pulse" : ""}`} />
        <span className="hidden md:inline">Sunrise</span>
      </button>
    </div>
  );
}
