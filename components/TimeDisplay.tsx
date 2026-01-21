"use client";

import { useMemo, useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface TimeDisplayProps {
    viewTime: number;
    isLive: boolean;
}

export default function TimeDisplay({ viewTime, isLive }: TimeDisplayProps) {
    const [liveTime, setLiveTime] = useState(Date.now());

    // Tick every second in live mode
    useEffect(() => {
        if (!isLive) return;

        const interval = setInterval(() => {
            setLiveTime(Date.now());
        }, 1000);

        return () => clearInterval(interval);
    }, [isLive]);

    const displayTime = isLive ? liveTime : viewTime;

    const formattedDateTime = useMemo(() => {
        const date = new Date(displayTime);

        const dateStr = date.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
        });

        const timeStr = date.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        });

        return { dateStr, timeStr };
    }, [displayTime]);

    return (
        <div className="flex items-center gap-2 bg-card/70 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10">
            <Clock className="w-4 h-4 text-blue-400" />
            <div className="flex flex-col">
                <span className="text-white/90 text-sm font-mono tabular-nums">
                    {formattedDateTime.timeStr}
                </span>
                <span className="text-white/50 text-[10px] font-mono uppercase tracking-wider">
                    {formattedDateTime.dateStr}
                </span>
            </div>
            {!isLive && (
                <span className="text-amber-400/80 text-[9px] font-mono ml-1 uppercase">
                    simulated
                </span>
            )}
        </div>
    );
}
