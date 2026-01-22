import { useState, useCallback, Dispatch, SetStateAction } from "react";
import { Commit } from "@/components/Globe";

interface UIState {
  selectedCommit: Commit | null;
  isStatsOpen: boolean;
  isHelpOpen: boolean;
  isPersonalDashboardOpen: boolean;
  highlightedUser: string | null;
  selectedLanguage: string | null;
}

interface UIActions {
  setSelectedCommit: Dispatch<SetStateAction<Commit | null>>;
  setIsStatsOpen: Dispatch<SetStateAction<boolean>>;
  setIsHelpOpen: Dispatch<SetStateAction<boolean>>;
  setIsPersonalDashboardOpen: Dispatch<SetStateAction<boolean>>;
  setHighlightedUser: Dispatch<SetStateAction<string | null>>;
  setSelectedLanguage: Dispatch<SetStateAction<string | null>>;
  handleSelectCommit: (commit: Commit) => void;
  handleCloseModal: () => void;
  handleCycleLanguage: () => void;
}

export function useUIState(): UIState & UIActions {
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isPersonalDashboardOpen, setIsPersonalDashboardOpen] = useState(false);
  const [highlightedUser, setHighlightedUser] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  const handleSelectCommit = useCallback((commit: Commit) => {
    setSelectedCommit(commit);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedCommit(null);
    setIsStatsOpen(false);
    setIsHelpOpen(false);
  }, []);

  // Import SUPPORTED_LANGUAGES dynamically to avoid circular deps
  const handleCycleLanguage = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { SUPPORTED_LANGUAGES } = require("@/lib/colors");
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
    isStatsOpen,
    isHelpOpen,
    isPersonalDashboardOpen,
    highlightedUser,
    selectedLanguage,
    setSelectedCommit,
    setIsStatsOpen,
    setIsHelpOpen,
    setIsPersonalDashboardOpen,
    setHighlightedUser,
    setSelectedLanguage,
    handleSelectCommit,
    handleCloseModal,
    handleCycleLanguage,
  };
}
