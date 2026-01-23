"use client";

import { useQuery } from "convex/react";
import { useCallback } from "react";
import { api } from "../convex/_generated/api";
import GlobeComponent from "@/components/Globe";
import TimelineControl from "@/components/TimelineControl";
import LanguageFilter from "@/components/LanguageFilter";
import CommitDetails from "@/components/CommitDetails";
import { ModeToggle } from "@/components/ModeToggle";
import { StatsSidebar } from "@/components/StatsSidebar";
import { ProfileSearch } from "@/components/ProfileSearch";
import { UserMenu } from "@/components/UserMenu";
import { PersonalStatsDashboard } from "@/components/PersonalStatsDashboard";
import KeyboardShortcutsHelp from "@/components/KeyboardShortcutsHelp";
import { useKeyboardShortcuts } from "@/lib/useKeyboardShortcuts";
import ActivityLegend from "@/components/ActivityLegend";
import { CreditsBadge } from "@/components/CreditsBadge";
import SunriseMode from "@/components/SunriseMode";
import { SoundToggle } from "@/components/SoundToggle";
import { useCommitSounds } from "@/lib/useCommitSounds";
import { ViewerCount } from "@/components/ViewerCount";
import { SilentErrorBoundary } from "@/components/SilentErrorBoundary";

// Custom hooks for state management
import { useTimeline } from "@/lib/useTimeline";
import { useSunriseMode } from "@/lib/useSunriseMode";
import { useViewport } from "@/lib/useViewport";
import { useUIState } from "@/lib/useUIState";
import { useNavigation } from "@/lib/useNavigation";

export default function Home() {
  // Get oldest timestamp for timeline bounds
  const oldestTimestamp = useQuery(api.commits.getOldestCommitTimestamp);

  // Timeline state and controls
  const timeline = useTimeline({
    windowSizeHours: 6,
    oldestTimestamp,
  });

  // UI state (modals, selected items, language filter)
  const ui = useUIState();

  // Navigation/location state
  const navigation = useNavigation();

  // Viewport state with debouncing
  const { debouncedViewport, setViewport } = useViewport({ debounceMs: 300 });

  // Sunrise mode
  const sunrise = useSunriseMode({
    windowSizeHours: timeline.windowSizeHours,
    onStartTimeChange: timeline.setStartTime,
    onExitLive: useCallback(() => {
      timeline.setIsLive(false);
      timeline.setIsPlaying(false);
    }, [timeline]),
  });

  // Fetch commits based on mode
  const liveCommits = useQuery(
    api.commits.getLiveCommits,
    timeline.isLive
      ? {
          minLat: debouncedViewport?.minLat,
          maxLat: debouncedViewport?.maxLat,
          minLng: debouncedViewport?.minLng,
          maxLng: debouncedViewport?.maxLng,
        }
      : "skip"
  );

  const playbackCommits = useQuery(
    api.commits.getSpatialCommits,
    !timeline.isLive
      ? {
          startTime: timeline.startTime,
          endTime: timeline.startTime + timeline.windowSizeHours * 60 * 60 * 1000,
          minLat: debouncedViewport?.minLat,
          maxLat: debouncedViewport?.maxLat,
          minLng: debouncedViewport?.minLng,
          maxLng: debouncedViewport?.maxLng,
        }
      : "skip"
  );

  const commits = timeline.isLive ? liveCommits : playbackCommits;

  // Play sounds for new commits (live mode only)
  useCommitSounds(commits, timeline.isLive);

  // Decoupled commit count for the badge
  const liveCount = useQuery(
    api.commits.getLiveCommitCount,
    timeline.isLive ? {} : "skip"
  );
  const playbackCount = useQuery(
    api.commits.getCommitCount,
    !timeline.isLive
      ? {
          startTime: timeline.startTime,
          endTime: timeline.startTime + timeline.windowSizeHours * 60 * 60 * 1000,
        }
      : "skip"
  );

  const activeCommitCount = timeline.isLive ? liveCount : playbackCount;
  const isCountLoading = activeCommitCount === undefined;

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onTogglePlayPause: () => timeline.handlePlayPause(!timeline.isPlaying),
    onToggleLive: () => timeline.handleLiveToggle(!timeline.isLive),
    onSetSpeed: timeline.setPlaybackSpeed,
    onStepBackward: timeline.handleStepBackward,
    onStepForward: timeline.handleStepForward,
    onCloseModal: ui.handleCloseModal,
    onToggleStats: () => ui.setIsStatsOpen((prev) => !prev),
    onShowHelp: () => ui.setIsHelpOpen(true),
    onCycleLanguage: ui.handleCycleLanguage,
    isEnabled: true,
  });

  // Compute view time for globe (use maxTimeValue when live to avoid impure Date.now())
  const viewTime = timeline.isLive
    ? timeline.maxTimeValue
    : timeline.startTime + (timeline.windowSizeHours * 60 * 60 * 1000) / 2;

  return (
    <main className="relative w-full h-screen bg-[#060a0f] transition-colors duration-500 overflow-hidden">
      {/* Top Left: Branding */}
<div className="absolute top-4 left-4 sm:top-5 sm:left-5 md:top-6 md:left-6 z-50 pointer-events-none flex flex-col gap-1">
        <h1 className="text-xl sm:text-[22px] md:text-2xl font-bold tracking-tighter text-white">
          gh.world<span className="text-[8px] sm:text-[9px] md:text-[10px] font-normal text-zinc-600 ml-1 align-super">v{process.env.APP_VERSION}</span>
        </h1>
        <p className="text-white/40 text-[10px] sm:text-[11px] md:text-xs font-mono lowercase tracking-widest">
          earth commits stream<sup className="text-[8px] sm:text-[9px] text-white/30 ml-1">1 hour</sup>
        </p>
        <div className="pointer-events-auto mt-2">
          <SilentErrorBoundary>
            <ViewerCount />
          </SilentErrorBoundary>
        </div>
      </div>

      {/* Top Right: Controls */}
<div className="absolute top-4 right-4 sm:top-5 sm:right-5 md:top-6 md:right-6 z-50 pointer-events-auto flex items-center gap-1.5 sm:gap-2">
        <UserMenu onOpenStats={() => ui.setIsPersonalDashboardOpen(true)} />
        <StatsSidebar isOpen={ui.isStatsOpen} onOpenChange={ui.setIsStatsOpen} />
        <ModeToggle />
      </div>

      {/* Personal Stats Dashboard (triggered from UserMenu) */}
      <PersonalStatsDashboard
        isOpen={ui.isPersonalDashboardOpen}
        onOpenChange={ui.setIsPersonalDashboardOpen}
        onHighlightUser={ui.setHighlightedUser}
        hideTrigger
      />

      {/* Bottom Left: Footer info (above timeline) */}
      <div className="absolute bottom-20 sm:bottom-20 md:bottom-24 left-4 sm:left-5 md:left-6 z-40 flex flex-col gap-2 sm:gap-2.5 md:gap-3">
        <div className="pointer-events-none">
          <ActivityLegend />
        </div>
        <div className="pointer-events-auto">
          <CreditsBadge />
        </div>
      </div>

      {/* Bottom Right: Status (above timeline) */}
      <div className="absolute bottom-20 sm:bottom-20 md:bottom-24 right-4 sm:right-5 md:right-6 z-40 pointer-events-auto flex flex-col items-end gap-2 sm:gap-2.5 md:gap-3">
        <div className={`text-white/40 text-[9px] sm:text-[9px] md:text-[10px] font-mono bg-card/50 backdrop-blur-sm px-1.5 sm:px-1.5 md:px-2 py-0.5 sm:py-0.5 md:py-1 rounded ${isCountLoading ? 'animate-pulse' : ''}`}>
          {isCountLoading ? '---' : activeCommitCount.toLocaleString()} ACTIVE COMMITS
        </div>
        <div className="flex items-center gap-1.5 sm:gap-1.5 md:gap-2">
          <SunriseMode
isActive={sunrise.isSunriseMode}
            onToggle={sunrise.handleSunriseModeToggle}
            simulatedTime={sunrise.simulatedTime}
          />
          <SoundToggle />
          <LanguageFilter value={ui.selectedLanguage} onChange={ui.setSelectedLanguage} />
          <ProfileSearch />
        </div>
      </div>

      {/* Globe */}
      <div className="absolute inset-0 z-0">
        <GlobeComponent
          commits={commits ?? []}
          selectedLanguage={ui.selectedLanguage}
          viewTime={viewTime}
          onSelectCommit={ui.handleSelectCommit}
          onViewportChange={setViewport}
          isPlaying={timeline.isPlaying}
          targetLocation={navigation.targetLocation}
          highlightedUser={ui.highlightedUser}
          sunriseCameraTarget={sunrise.sunriseCameraTarget}
          onSunriseInteraction={
            sunrise.isSunriseMode ? () => sunrise.handleSunriseModeToggle(false) : undefined
          }
        />
      </div>

      {/* Vignette Overlay */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(6, 10, 15, 0.4) 70%, rgba(6, 10, 15, 0.8) 100%)",
        }}
      />

      {/* Timeline Control */}
      <TimelineControl
        minTime={timeline.minTimeValue}
        maxTime={timeline.maxTimeValue}
        startTime={timeline.startTime}
        onStartTimeChange={timeline.setStartTime}
        isLive={timeline.isLive}
        onLiveToggle={timeline.handleLiveToggle}
        windowSizeHours={timeline.windowSizeHours}
        isPlaying={timeline.isPlaying}
        onPlayPause={timeline.handlePlayPause}
        playbackSpeed={timeline.playbackSpeed}
        onPlaybackSpeedChange={timeline.setPlaybackSpeed}
      />

      {/* Mobile Drawers */}
      <CommitDetails
        commit={ui.selectedCommit}
        isOpen={!!ui.selectedCommit}
        onClose={() => ui.setSelectedCommit(null)}
      />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        isOpen={ui.isHelpOpen}
        onClose={() => ui.setIsHelpOpen(false)}
      />
    </main>
  );
}
