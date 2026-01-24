import { useState, useCallback } from "react";
import { Commit, TargetLocation } from "@/components/Globe";
import { SUPPORTED_LANGUAGES } from "@/lib/colors";

// Location type for quick-jump feature
export interface Location {
  lat: number;
  lng: number;
  name?: string;
}

export interface GlobeState {
  // Commit selection
  selectedCommit: Commit | null;
  setSelectedCommit: (commit: Commit | null) => void;
  handleSelectCommit: (commit: Commit) => void;
  handleCloseCommitDetails: () => void;

  // Language filter
  selectedLanguage: string | null;
  setSelectedLanguage: (language: string | null) => void;
  handleCycleLanguage: () => void;

  // Location targeting
  targetLocation: TargetLocation | null;
  setTargetLocation: (location: TargetLocation | null) => void;
  handleJumpToLocation: (location: Location) => void;

  // User highlighting
  highlightedUser: string | null;
  setHighlightedUser: (user: string | null) => void;
}

export function useGlobeState(): GlobeState {
  // Commit selection state
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);

  // Language filter state
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  // Location quick-jump state
  const [targetLocation, setTargetLocation] = useState<TargetLocation | null>(null);

  // User highlighting state
  const [highlightedUser, setHighlightedUser] = useState<string | null>(null);

  // Memoized callbacks
  const handleSelectCommit = useCallback((commit: Commit) => {
    setSelectedCommit(commit);
  }, []);

  const handleCloseCommitDetails = useCallback(() => {
    setSelectedCommit(null);
  }, []);

  const handleJumpToLocation = useCallback((location: Location) => {
    setTargetLocation({ lat: location.lat, lng: location.lng });
  }, []);

  const handleCycleLanguage = useCallback(() => {
    setSelectedLanguage((current) => {
      if (current === null) {
        return SUPPORTED_LANGUAGES[0];
      }
      const currentIndex = SUPPORTED_LANGUAGES.indexOf(
        current as (typeof SUPPORTED_LANGUAGES)[number]
      );
      if (currentIndex === -1 || currentIndex === SUPPORTED_LANGUAGES.length - 1) {
        return null; // Cycle back to "All"
      }
      return SUPPORTED_LANGUAGES[currentIndex + 1];
    });
  }, []);

  return {
    selectedCommit,
    setSelectedCommit,
    handleSelectCommit,
    handleCloseCommitDetails,
    selectedLanguage,
    setSelectedLanguage,
    handleCycleLanguage,
    targetLocation,
    setTargetLocation,
    handleJumpToLocation,
    highlightedUser,
    setHighlightedUser,
  };
}
