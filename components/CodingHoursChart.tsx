"use client";

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface HourlyData {
    hour: number;
    count: number;
    percentage: number;
}

interface CodingHoursChartProps {
    data: HourlyData[];
    peakHour: number;
}

// Format hour as "9 AM" or "5 PM"
function formatHour(hour: number): string {
    if (hour === 0) return "12 AM";
    if (hour === 12) return "12 PM";
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
}

// Get bar color based on intensity
function getBarColor(percentage: number, isPeak: boolean): string {
    if (isPeak) return "bg-emerald-400";
    if (percentage >= 75) return "bg-emerald-500/80";
    if (percentage >= 50) return "bg-emerald-600/70";
    if (percentage >= 25) return "bg-emerald-700/60";
    if (percentage > 0) return "bg-emerald-800/50";
    return "bg-zinc-800/30";
}

export function CodingHoursChart({ data, peakHour }: CodingHoursChartProps) {
    // Show labels at key hours: 6 AM, 12 PM, 6 PM
    const labelHours = [0, 6, 12, 18];

    return (
        <div className="space-y-2">
            {/* Bar chart */}
            <div className="flex items-end gap-[2px] h-12">
                <TooltipProvider delayDuration={100}>
                    {data.map((item) => (
                        <Tooltip key={item.hour}>
                            <TooltipTrigger asChild>
                                <div
                                    className={`flex-1 rounded-t-sm transition-all ${getBarColor(
                                        item.percentage,
                                        item.hour === peakHour
                                    )}`}
                                    style={{
                                        height: `${Math.max(item.percentage, 4)}%`,
                                        minHeight: item.count > 0 ? "4px" : "2px",
                                    }}
                                />
                            </TooltipTrigger>
                            <TooltipContent
                                side="top"
                                className="bg-zinc-900 border-zinc-700 text-xs"
                            >
                                <p className="font-medium">{formatHour(item.hour)}</p>
                                <p className="text-zinc-400">
                                    {item.count} commit{item.count !== 1 ? "s" : ""}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </TooltipProvider>
            </div>

            {/* Hour labels */}
            <div className="flex justify-between text-[9px] text-zinc-500 px-0">
                {labelHours.map((hour) => (
                    <span key={hour}>{formatHour(hour)}</span>
                ))}
            </div>

            {/* Peak hour callout */}
            <div className="text-xs text-zinc-400">
                Peak activity:{" "}
                <span className="text-emerald-400 font-medium">
                    {formatHour(peakHour)}
                </span>
            </div>
        </div>
    );
}
