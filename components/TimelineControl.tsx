"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Radio } from "lucide-react";

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
    isPlaying,
    onPlayPause,
    playbackSpeed,
    onPlaybackSpeedChange,
}: TimelineControlProps & {
    isPlaying: boolean;
    onPlayPause: (playing: boolean) => void;
    playbackSpeed: number;
    onPlaybackSpeedChange: (speed: number) => void;
}) {
    const [mounted, setMounted] = useState(false);
    const windowMs = windowSizeHours * 60 * 60 * 1000;
    const endTime = startTime + windowMs;
    const sliderMax = Math.max(minTime, maxTime - windowMs);

    useEffect(() => {
        setMounted(true);
    }, []);

    const speeds = [1, 2, 4, 8];
    const timeFormatter = new Intl.DateTimeFormat(undefined, {
        timeStyle: "medium",
        dateStyle: "short",
    });

    return (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-black/80 backdrop-blur-md border-t border-white/10 z-50">
            {mounted && (
                <div className="max-w-4xl mx-auto flex flex-col gap-4">
                    {/* Time Info */}
                    <div className="flex justify-between items-center text-xs font-mono text-white/60">
                        <span>{timeFormatter.format(startTime)}</span>
                        <div className="flex flex-col items-center">
                            {isLive ? (
                                <span className="text-green-400 font-bold animate-pulse flex items-center gap-1">
                                    <Radio className="w-3 h-3" /> LIVE
                                </span>
                            ) : (
                                <div className="flex gap-2">
                                    <span className={isPlaying ? "text-blue-400 font-bold" : "text-white/40"}>
                                        {isPlaying ? "PLAYING" : "PAUSED"}
                                    </span>
                                </div>
                            )}
                        </div>
                        <span>{timeFormatter.format(endTime)}</span>
                    </div>

                    {/* Controls Row */}
                    <div className="flex gap-4 items-center">
                        {/* Play/Pause & Live Controls */}
                        <div className="flex gap-2 shrink-0">
                            <Button
                                onClick={() => onPlayPause(!isPlaying)}
                                disabled={isLive}
                                variant="outline"
                                size="icon"
                                className={`border-white/10 ${isPlaying && !isLive ? "bg-blue-600/20 text-blue-400 border-blue-500/50" : ""}`}
                            >
                                {isPlaying && !isLive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </Button>

                            <Button
                                onClick={() => onLiveToggle(true)}
                                variant={isLive ? "default" : "outline"}
                                size="icon"
                                className={`${isLive
                                    ? "bg-green-600 hover:bg-green-700 border-none"
                                    : "border-white/10 text-green-500 hover:bg-green-950/30 hover:text-green-400"
                                    }`}
                            >
                                <Radio className={`w-4 h-4 ${isLive ? "animate-pulse" : ""}`} />
                            </Button>
                        </div>

                        {/* Scrubber */}
                        <Slider
                            min={minTime}
                            max={sliderMax}
                            value={[startTime]}
                            onValueChange={(value) => {
                                onStartTimeChange(value[0]);
                                if (isLive) onLiveToggle(false); // dragging scrubber exits live mode
                            }}
                            className="flex-1"
                        />

                        {/* Speed Controls */}
                        <div className="flex gap-1 bg-white/5 rounded-md p-1 shrink-0">
                            {speeds.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => onPlaybackSpeedChange(s)}
                                    className={`px-2 py-1 text-[10px] font-mono rounded transition-colors ${playbackSpeed === s
                                        ? "bg-white/20 text-white font-bold"
                                        : "text-white/40 hover:text-white/80"
                                        }`}
                                >
                                    {s}x
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
