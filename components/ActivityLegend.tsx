"use client";

import { CONTRIBUTION_COLORS } from "@/lib/colors";

const LEVELS = [
  { color: CONTRIBUTION_COLORS.level0, label: "None" },
  { color: CONTRIBUTION_COLORS.level1, label: "Low" },
  { color: CONTRIBUTION_COLORS.level2, label: "Medium" },
  { color: CONTRIBUTION_COLORS.level3, label: "High" },
  { color: CONTRIBUTION_COLORS.level4, label: "Very High" },
];

export default function ActivityLegend() {
  return (
    <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 text-[9px] sm:text-[9px] md:text-[10px] font-mono text-white/40">
      <span className="mr-0.5 sm:mr-1">Activity:</span>
      {LEVELS.map((level) => (
        <div key={level.label} className="flex items-center" title={level.label}>
          <div
            className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm"
            style={{ backgroundColor: level.color }}
          />
        </div>
      ))}
      <span className="ml-0.5 sm:ml-1 text-white/30">Low → High</span>
    </div>
  );
}
