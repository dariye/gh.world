"use client";

import { useAction, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState, useEffect } from "react";
import GlobeComponent from "@/components/Globe";
import TimelineControl from "@/components/TimelineControl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const [isLive, setIsLive] = useState(true);
  const [startTime, setStartTime] = useState(Date.now() - 6 * 60 * 60 * 1000);
  const windowSizeHours = 6;
  const pollAction = useAction(api.actions.pollPublicEvents);

  // Poll for new commits every 30 seconds
  useEffect(() => {
    const poll = async () => {
      try {
        console.log("Polling for new commits...");
        const result = await pollAction();
        console.log(`Poll complete. New commits: ${result.newCommitsCount}`);
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    poll(); // Initial poll
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, [pollAction]);

  // If live, keep the startTime moving
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setStartTime(Date.now() - windowSizeHours * 60 * 60 * 1000);
    }, 10000); // Update every 10s to keep it "fresh"

    return () => clearInterval(interval);
  }, [isLive, windowSizeHours]);

  const commits = useQuery(api.commits.getRecentCommits, {
    startTime: startTime,
    endTime: startTime + windowSizeHours * 60 * 60 * 1000,
  });

  const oldestTimestamp = useQuery(api.commits.getOldestCommitTimestamp);
  const minTime = oldestTimestamp ?? (Date.now() - 24 * 60 * 60 * 1000);
  const maxTime = Date.now();

  return (
    <main className="relative w-full h-screen bg-[#000510] overflow-hidden">
      {/* Header Info */}
      <div className="absolute top-6 left-6 z-50 pointer-events-none">
        <h1 className="text-3xl font-bold text-white tracking-tighter">
          GH<span className="text-blue-500">WORLD</span>
        </h1>
        <p className="text-white/40 text-xs font-mono uppercase tracking-widest mt-1">
          Real-time Global Commit Stream
        </p>

        <div className="mt-8 flex flex-col gap-2">
          <Badge
            variant={isLive ? "default" : "destructive"}
            className={`w-fit ${isLive ? 'bg-green-600 hover:bg-green-600' : ''}`}
          >
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-300 animate-pulse' : 'bg-red-300'}`} />
            {isLive ? 'SYSTEM ONLINE' : 'TIMELINE PAUSED'}
          </Badge>
          <div className="text-white/40 text-[10px] font-mono">
            ACTIVE COMMITS IN WINDOW: {commits?.length ?? 0}
          </div>
        </div>
      </div>

      {/* Globe */}
      <div className="absolute inset-0 z-0">
        <GlobeComponent commits={commits ?? []} />
      </div>

      {/* Timeline Control */}
      <TimelineControl
        minTime={minTime}
        maxTime={maxTime}
        startTime={startTime}
        onStartTimeChange={setStartTime}
        isLive={isLive}
        onLiveToggle={setIsLive}
        windowSizeHours={windowSizeHours}
      />

      {/* Legend / Overlay */}
      <Card className="absolute top-6 right-6 z-50 bg-black/40 backdrop-blur-md border-white/5 max-w-[200px] py-3">
        <CardContent className="text-[10px] font-mono text-white/40 p-0 px-4">
          <p>This visualization shows public commits across all of GitHub in real-time.</p>
          <p className="mt-2 text-blue-400 group cursor-help transition-colors hover:text-blue-300">
            Click any point to view the author's GitHub profile.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
