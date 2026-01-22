"use client";

import { useRef, useEffect } from "react";
import { playNote, isSoundEnabled } from "./audio";

interface Commit {
  _id: string;
  language?: string | null;
  coordinates?: number[];
}

/**
 * Hook that plays sounds for new commits
 *
 * Tracks commit IDs and plays a sound when new commits appear.
 * Only plays for commits with valid coordinates.
 */
export function useCommitSounds(commits: Commit[] | undefined, isLive: boolean) {
  // Track seen commit IDs
  const seenIds = useRef<Set<string>>(new Set());
  // Track if we've done initial load
  const initialLoadDone = useRef(false);

  useEffect(() => {
    // Skip if no commits or not live mode
    if (!commits || !isLive) {
      return;
    }

    // Skip if sound is disabled (check every time to respect setting changes)
    if (!isSoundEnabled()) {
      // Still track IDs so we don't blast sounds when user enables
      for (const commit of commits) {
        seenIds.current.add(commit._id);
      }
      initialLoadDone.current = true;
      return;
    }

    // On first load, just populate the seen set without playing sounds
    // This prevents a burst of sounds when the page loads
    if (!initialLoadDone.current) {
      for (const commit of commits) {
        seenIds.current.add(commit._id);
      }
      initialLoadDone.current = true;
      return;
    }

    // Find new commits
    const newCommits: Commit[] = [];
    for (const commit of commits) {
      if (!seenIds.current.has(commit._id)) {
        seenIds.current.add(commit._id);
        newCommits.push(commit);
      }
    }

    // Play sounds for new commits (throttling handled by playNote)
    for (const commit of newCommits) {
      if (commit.coordinates && commit.coordinates.length >= 2) {
        playNote(commit.language ?? null, commit.coordinates[0]);
      }
    }

    // Cleanup: remove old IDs to prevent memory leak
    // Keep only IDs that are still in the current commits array
    if (seenIds.current.size > 10000) {
      const currentIds = new Set(commits.map((c) => c._id));
      for (const id of seenIds.current) {
        if (!currentIds.has(id)) {
          seenIds.current.delete(id);
        }
      }
    }
  }, [commits, isLive]);

  // Reset when switching to playback mode
  useEffect(() => {
    if (!isLive) {
      // Clear seen IDs when leaving live mode
      seenIds.current.clear();
      initialLoadDone.current = false;
    }
  }, [isLive]);
}
