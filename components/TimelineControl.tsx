"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface TimelineControlProps {
    minTime: number;
    maxTime: number;
    startTime: number;
    onStartTimeChange: (time: number) => void;
    isLive: boolean;
    onLiveToggle: (isLive: boolean) => void;
    windowSizeHours: number;
}

export default function TimelineControl({
    minTime,
    maxTime,
    startTime,
    onStartTimeChange,
    isLive,
    onLiveToggle,
    windowSizeHours,
}: TimelineControlProps) {
    const [mounted, setMounted] = useState(false);
    const windowMs = windowSizeHours * 60 * 60 * 1000;
    const endTime = startTime + windowMs;
    const sliderMax = Math.max(minTime, maxTime - windowMs);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-black/60 backdrop-blur-md border-t border-white/10 z-50 min-h-[140px]">
            {mounted && (
                <div className="max-w-4xl mx-auto flex flex-col gap-4">
                    <div className="flex justify-between items-center text-xs font-mono text-white/60 min-h-[1.5rem]">
                        <span>{new Date(startTime).toLocaleString()}</span>
                        <div className="flex flex-col items-center">
                            <span className="text-blue-400 font-bold">{isLive ? "LIVE STREAMING" : "PAUSED"}</span>
                            <span>Window: {windowSizeHours}h</span>
                        </div>
                        <span>{new Date(endTime).toLocaleString()}</span>
                    </div>

                    <div className="flex gap-4 items-center">
                        <Button
                            onClick={() => onLiveToggle(!isLive)}
                            variant={isLive ? "default" : "outline"}
                            size="sm"
                            className={`rounded-full text-xs font-bold ${isLive
                                ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                                : ""
                                }`}
                        >
                            {isLive ? "PAUSE" : "GO LIVE"}
                        </Button>

                        <Slider
                            min={minTime}
                            max={sliderMax}
                            value={[startTime]}
                            onValueChange={(value) => {
                                onStartTimeChange(value[0]);
                                if (isLive) onLiveToggle(false);
                            }}
                            className="flex-1"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
