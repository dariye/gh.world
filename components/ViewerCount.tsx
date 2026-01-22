"use client";

import { usePresence } from "@/lib/usePresence";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

// Map region codes to display names
const REGION_NAMES: Record<string, string> = {
    americas: "Americas",
    europe: "Europe",
    asia: "Asia",
    africa: "Africa",
    oceania: "Oceania",
    other: "Other",
    unknown: "Unknown",
};

export function ViewerCount() {
    const { viewers, isLoading } = usePresence();

    // Sort regions by count (descending), limit to top 4
    const sortedRegions = Object.entries(viewers.byRegion)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 4) as [string, number][];

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 text-white/50 text-[10px] font-mono cursor-default select-none">
                    {/* Green pulse dot */}
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    {/* Count */}
                    <span className={isLoading ? "animate-pulse" : ""}>
                        {isLoading ? "..." : viewers.total} watching
                    </span>
                </div>
            </TooltipTrigger>
            <TooltipContent
                side="bottom"
                className="bg-zinc-950/95 border-zinc-800 text-zinc-300 px-3 py-2"
            >
                <div className="text-[10px] font-mono space-y-1">
                    <div className="text-zinc-500 uppercase tracking-wider mb-1.5">
                        Viewers by region
                    </div>
                    {sortedRegions.length > 0 ? (
                        sortedRegions.map(([region, count]) => (
                            <div key={region} className="flex justify-between gap-4">
                                <span className="text-zinc-400">{REGION_NAMES[region] || region}</span>
                                <span className="text-white">{count}</span>
                            </div>
                        ))
                    ) : (
                        <div className="text-zinc-500">No data yet</div>
                    )}
                </div>
            </TooltipContent>
        </Tooltip>
    );
}
