"use client";

import { useMemo } from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface ActivityData {
    date: string;
    count: number;
}

interface ActivityHeatmapProps {
    data: ActivityData[];
    days?: number;
}

// Get intensity level 0-4 based on commit count
function getIntensityLevel(count: number, maxCount: number): number {
    if (count === 0) return 0;
    if (maxCount <= 1) return count > 0 ? 4 : 0;
    const ratio = count / maxCount;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
}

const intensityColors = [
    "bg-zinc-800/50", // 0 - no activity
    "bg-emerald-900/70", // 1 - low
    "bg-emerald-700/80", // 2 - medium-low
    "bg-emerald-500/90", // 3 - medium-high
    "bg-emerald-400", // 4 - high
];

export function ActivityHeatmap({ data, days = 30 }: ActivityHeatmapProps) {
    const { grid, maxCount, weekLabels } = useMemo(() => {
        // Create a map of date -> count
        const dateMap = new Map(data.map((d) => [d.date, d.count]));
        const max = Math.max(...data.map((d) => d.count), 1);

        // Generate grid for the last N days
        const cells: { date: string; count: number; dayOfWeek: number }[] = [];
        const today = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split("T")[0];
            cells.push({
                date: dateStr,
                count: dateMap.get(dateStr) || 0,
                dayOfWeek: date.getDay(),
            });
        }

        // Group into weeks
        const weeks: typeof cells[] = [];
        let currentWeek: typeof cells = [];

        // Pad the first week with empty cells
        const firstDay = cells[0]?.dayOfWeek || 0;
        for (let i = 0; i < firstDay; i++) {
            currentWeek.push({ date: "", count: -1, dayOfWeek: i });
        }

        for (const cell of cells) {
            currentWeek.push(cell);
            if (cell.dayOfWeek === 6) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
        }
        if (currentWeek.length > 0) {
            weeks.push(currentWeek);
        }

        // Generate week labels (show every other week's start date)
        const labels = weeks.map((week, i) => {
            const firstCell = week.find((c) => c.date);
            if (!firstCell || i % 2 !== 0) return "";
            const date = new Date(firstCell.date);
            return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        });

        return { grid: weeks, maxCount: max, weekLabels: labels };
    }, [data, days]);

    const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

    return (
        <div className="space-y-2">
            <div className="flex gap-1">
                {/* Day labels column */}
                <div className="flex flex-col gap-[3px] mr-1">
                    {dayLabels.map((label, i) => (
                        <div
                            key={i}
                            className="h-[10px] w-3 text-[8px] text-zinc-500 flex items-center justify-end"
                        >
                            {i % 2 === 1 ? label : ""}
                        </div>
                    ))}
                </div>

                {/* Grid */}
                <div className="flex gap-[3px]">
                    <TooltipProvider delayDuration={100}>
                        {grid.map((week, weekIndex) => (
                            <div key={weekIndex} className="flex flex-col gap-[3px]">
                                {week.map((cell, dayIndex) => (
                                    <Tooltip key={`${weekIndex}-${dayIndex}`}>
                                        <TooltipTrigger asChild>
                                            <div
                                                className={`h-[10px] w-[10px] rounded-[2px] transition-colors ${
                                                    cell.count < 0
                                                        ? "bg-transparent"
                                                        : intensityColors[
                                                              getIntensityLevel(cell.count, maxCount)
                                                          ]
                                                }`}
                                            />
                                        </TooltipTrigger>
                                        {cell.count >= 0 && (
                                            <TooltipContent
                                                side="top"
                                                className="bg-zinc-900 border-zinc-700 text-xs"
                                            >
                                                <p className="font-medium">
                                                    {cell.count} commit{cell.count !== 1 ? "s" : ""}
                                                </p>
                                                <p className="text-zinc-400">
                                                    {new Date(cell.date).toLocaleDateString("en-US", {
                                                        weekday: "short",
                                                        month: "short",
                                                        day: "numeric",
                                                    })}
                                                </p>
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                ))}
                            </div>
                        ))}
                    </TooltipProvider>
                </div>
            </div>

            {/* Week labels */}
            <div className="flex gap-[3px] ml-4 text-[8px] text-zinc-500">
                {weekLabels.map((label, i) => (
                    <div key={i} className="w-[10px] text-center">
                        {label && <span className="whitespace-nowrap">{label}</span>}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-1">
                <span>Less</span>
                {intensityColors.map((color, i) => (
                    <div key={i} className={`h-[10px] w-[10px] rounded-[2px] ${color}`} />
                ))}
                <span>More</span>
            </div>
        </div>
    );
}
