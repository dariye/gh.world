"use client";


import { useAction, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState, useEffect, useCallback } from "react";
import GlobeComponent, { Commit } from "@/components/Globe";
import TimelineControl from "@/components/TimelineControl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// import { Info } from "lucide-react";

import LanguageFilter from "@/components/LanguageFilter";
import CommitDetails from "@/components/CommitDetails";
import { ModeToggle } from "@/components/ModeToggle";
import { StatsSidebar } from "@/components/StatsSidebar";
// import StatsPanel from "@/components/StatsPanel"; // Removed/Deprecated

export default function Home() {
  // Timeline state
  const [isLive, setIsLive] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [startTime, setStartTime] = useState(Date.now() - 6 * 60 * 60 * 1000);

  // Mobile/Drawer state
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);
  // const [isStatsOpen, setIsStatsOpen] = useState(false);

  const windowSizeHours = 6;
  const oldestTimestamp = useQuery(api.commits.getOldestCommitTimestamp);
  const minTimeValue = oldestTimestamp ?? (Date.now() - 24 * 60 * 60 * 1000);
  const maxTimeValue = Date.now();

  // LIVE MODE: Keep time attached to "now"
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setStartTime(Date.now() - windowSizeHours * 60 * 60 * 1000);
    }, 10000);

    return () => clearInterval(interval);
  }, [isLive, windowSizeHours]);

  // TIMELAPSE PLAYBACK MODE
  useEffect(() => {
    if (isLive || !isPlaying) return;

    const interval = setInterval(() => {
      setStartTime(prev => {
        // Base speed 1x = 6 hours in 2 minutes (180x acceleration)
        // 50ms interval * 180 * speed
        const delta = 50 * 180 * playbackSpeed;
        const next = prev + delta;

        // Loop if we hit end (minus window size)
        const limit = Date.now() - (windowSizeHours * 60 * 60 * 1000);
        if (next >= limit) {
          return minTimeValue; // Loop back to start
        }
        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isLive, isPlaying, playbackSpeed, minTimeValue, windowSizeHours]);

  // Viewport state for progressive disclosure
  const [viewport, setViewport] = useState<any>(null);
  const [debouncedViewport, setDebouncedViewport] = useState<any>(null);

  // Debounce viewport updates to avoid hammering the backend
  useEffect(() => {
    if (!viewport) return;
    const timer = setTimeout(() => {
      setDebouncedViewport(viewport);
    }, 300);
    return () => clearTimeout(timer);
  }, [viewport]);

  const commits = useQuery(api.commits.getSpatialCommits, {
    startTime: startTime,
    endTime: startTime + windowSizeHours * 60 * 60 * 1000,
    minLat: debouncedViewport?.minLat,
    maxLat: debouncedViewport?.maxLat,
    minLng: debouncedViewport?.minLng,
    maxLng: debouncedViewport?.maxLng,
  });


  // Memoized callbacks to prevent unnecessary child re-renders
  const handleSelectCommit = useCallback((commit: Commit) => {
    setSelectedCommit(commit);
  }, []);

  const handleLiveToggle = useCallback((live: boolean) => {
    setIsLive(live);
    if (live) setIsPlaying(false);
  }, []);

  const handleCloseCommitDetails = useCallback(() => {
    setSelectedCommit(null);
  }, []);


  return (
    <main className="relative w-full h-screen bg-[#000510] transition-colors duration-500 overflow-hidden text-foreground">
      {/* Top Left: Branding */}
      <div className="absolute top-6 left-6 z-50 pointer-events-none flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tighter text-white">
          GH<span className="text-blue-500">WORLD</span>
        </h1>
        <p className="text-white/40 text-xs font-mono uppercase tracking-widest">
          Real-time Global Commit Stream
        </p>
      </div>

      {/* Top Center: Language Filter */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <LanguageFilter value={selectedLanguage} onChange={setSelectedLanguage} />
      </div>

      {/* Top Right: Controls */}
      <div className="absolute top-6 right-6 z-50 pointer-events-auto flex items-center gap-2">
        <ModeToggle />
        <StatsSidebar />
      </div>

      {/* Bottom Right: Status (above timeline) */}
      <div className="absolute bottom-32 right-6 z-40 pointer-events-auto flex flex-col items-end gap-2">
        <Badge
          variant="outline"
          className={`w-fit cursor-pointer border-white/10 ${isLive ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-red-500/10 text-red-400'}`}
          onClick={() => handleLiveToggle(!isLive)}
        >
          <div className={`w-1.5 h-1.5 rounded-full mr-2 ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          {isLive ? 'CONNECTED' : 'DISCONNECTED'}
        </Badge>
        <div className="text-white/40 text-[10px] font-mono bg-black/50 backdrop-blur-sm px-2 py-1 rounded">
          {commits?.length ?? 0} ACTIVE COMMITS
        </div>
      </div>

      {/* Globe */}
      <div className="absolute inset-0 z-0">
        <GlobeComponent
          commits={commits ?? []}
          selectedLanguage={selectedLanguage}
          viewTime={startTime + windowSizeHours * 60 * 60 * 1000 / 2}
          onSelectCommit={handleSelectCommit}
          onViewportChange={setViewport}
        />
      </div>

      {/* Timeline Control */}
      <TimelineControl
        minTime={minTimeValue}
        maxTime={maxTimeValue}
        startTime={startTime}
        onStartTimeChange={setStartTime}
        isLive={isLive}
        onLiveToggle={handleLiveToggle}
        windowSizeHours={windowSizeHours}
        isPlaying={isPlaying}
        onPlayPause={setIsPlaying}
        playbackSpeed={playbackSpeed}
        onPlaybackSpeedChange={setPlaybackSpeed}
      />

      {/* Mobile Drawers */}
      <CommitDetails
        commit={selectedCommit}
        isOpen={!!selectedCommit}
        onClose={() => setSelectedCommit(null)}
      />
    </main>
  );
}
