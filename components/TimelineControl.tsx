"use client";

import { useEffect, useState } from "react";
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
    isPlaying: boolean;
    onPlayPause: (playing: boolean) => void;
    playbackSpeed: number;
    onPlaybackSpeedChange: (speed: number) => void;
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
}: TimelineControlProps) {
    const [mounted, setMounted] = useState(false);
    const windowMs = windowSizeHours * 60 * 60 * 1000;
    const sliderMax = Math.max(minTime, maxTime - windowMs);

    useEffect(() => {
        setMounted(true);
    }, []);

    const speeds = [1, 2, 4, 8];

    if (!mounted) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50">
            <div className="mx-4 mb-4 bg-card/90 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                    {/* Play/Pause Button */}
                    <button
                        onClick={() => onPlayPause(!isPlaying)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 ${
                            isPlaying && !isLive
                                ? "bg-primary text-primary-foreground"
                                : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                        }`}
                        aria-label={isPlaying ? "Pause" : "Play"}
                    >
                        {isPlaying && !isLive ? (
                            <Pause className="w-4 h-4" />
                        ) : (
                            <Play className="w-4 h-4 ml-0.5" />
                        )}
                    </button>

                    {/* Scrubber */}
                    <div className="flex-1 px-2">
                        <Slider
                            min={minTime}
                            max={sliderMax}
                            value={[startTime]}
                            onValueChange={(value) => {
                                onStartTimeChange(value[0]);
                                if (isLive) onLiveToggle(false);
                            }}
                            className="cursor-pointer"
                        />
                    </div>

                    {/* Speed Selector */}
                    <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5 shrink-0">
                        {speeds.map((s) => (
                            <button
                                key={s}
                                onClick={() => onPlaybackSpeedChange(s)}
                                className={`px-2 py-1 text-xs font-mono rounded-md transition-all ${
                                    playbackSpeed === s
                                        ? "bg-white/20 text-white font-semibold"
                                        : "text-white/40 hover:text-white/70"
                                }`}
                            >
                                {s}x
                            </button>
                        ))}
                    </div>

                    {/* Live Toggle */}
                    <button
                        onClick={() => onLiveToggle(!isLive)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                            isLive
                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70 border border-white/10"
                        }`}
                    >
                        <Radio className={`w-3 h-3 ${isLive ? "animate-pulse" : ""}`} />
                        <span>LIVE</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
