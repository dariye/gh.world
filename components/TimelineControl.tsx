"use client";

import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Radio, ChevronUp } from "lucide-react";
import {
    Drawer,
    DrawerContent,
    DrawerTrigger,
} from "@/components/ui/drawer";

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
    const [isOpen, setIsOpen] = useState(false);
    const windowMs = windowSizeHours * 60 * 60 * 1000;
    const sliderMax = Math.max(minTime, maxTime - windowMs);

    const speeds = [1, 2, 4, 8];

    // Format time for display
    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
            {/* Collapsed trigger bar */}
            <DrawerTrigger asChild>
                <button className="fixed bottom-0 left-0 right-0 z-50 mx-4 mb-4 bg-card/90 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 cursor-pointer hover:bg-card/95 transition-colors">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            {/* Play/Pause indicator */}
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                    isPlaying && !isLive
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-white/10 text-white/70"
                                }`}
                            >
                                {isPlaying && !isLive ? (
                                    <Pause className="w-3.5 h-3.5" />
                                ) : (
                                    <Play className="w-3.5 h-3.5 ml-0.5" />
                                )}
                            </div>

                            {/* Status text */}
                            <div className="text-sm text-white/70">
                                {isLive ? (
                                    <span className="text-green-400">Live</span>
                                ) : (
                                    <span>{formatTime(startTime)}</span>
                                )}
                            </div>

                            {/* Speed badge when not live */}
                            {!isLive && (
                                <span className="text-xs text-white/40 font-mono">
                                    {playbackSpeed}x
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Live indicator */}
                            {isLive && (
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
                                    <Radio className="w-3 h-3 animate-pulse" />
                                    <span>LIVE</span>
                                </div>
                            )}

                            {/* Expand hint */}
                            <ChevronUp className="w-4 h-4 text-white/40" />
                        </div>
                    </div>
                </button>
            </DrawerTrigger>

            {/* Expanded drawer content */}
            <DrawerContent className="bg-card/95 backdrop-blur-md border-white/10">
                <div className="px-4 pb-6 pt-2">
                    {/* Playback controls */}
                    <div className="flex items-center gap-3 mb-4">
                        {/* Play/Pause Button */}
                        <button
                            onClick={() => onPlayPause(!isPlaying)}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background ${
                                isPlaying && !isLive
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                            }`}
                            aria-label={isPlaying ? "Pause" : "Play"}
                        >
                            {isPlaying && !isLive ? (
                                <Pause className="w-5 h-5" />
                            ) : (
                                <Play className="w-5 h-5 ml-0.5" />
                            )}
                        </button>

                        {/* Timeline info */}
                        <div className="flex-1">
                            <div className="text-sm text-white/90 mb-1">
                                {isLive ? "Live Mode" : `Viewing: ${formatTime(startTime)}`}
                            </div>
                            <div className="text-xs text-white/50">
                                {isLive
                                    ? "Showing real-time commits"
                                    : `${windowSizeHours}h window at ${playbackSpeed}x speed`}
                            </div>
                        </div>

                        {/* Live Toggle */}
                        <button
                            onClick={() => onLiveToggle(!isLive)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background ${
                                isLive
                                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                    : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70 border border-white/10"
                            }`}
                        >
                            <Radio className={`w-4 h-4 ${isLive ? "animate-pulse" : ""}`} />
                            <span>LIVE</span>
                        </button>
                    </div>

                    {/* Timeline scrubber */}
                    <div className="mb-4">
                        <div className="flex justify-between text-xs text-white/40 mb-2">
                            <span>{formatTime(minTime)}</span>
                            <span>{formatTime(maxTime)}</span>
                        </div>
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

                    {/* Speed selector */}
                    <div>
                        <div className="text-xs text-white/50 mb-2">Playback Speed</div>
                        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                            {speeds.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => onPlaybackSpeedChange(s)}
                                    className={`flex-1 px-3 py-2 text-sm font-mono rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background ${
                                        playbackSpeed === s
                                            ? "bg-white/20 text-white font-semibold"
                                            : "text-white/40 hover:text-white/70"
                                    }`}
                                >
                                    {s}x
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
