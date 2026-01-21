"use client";

import { useEffect, useCallback } from "react";

export interface KeyboardShortcutsConfig {
  onTogglePlayPause?: () => void;
  onToggleLive?: () => void;
  onSetSpeed?: (speed: number) => void;
  onStepBackward?: () => void;
  onStepForward?: () => void;
  onCloseModal?: () => void;
  onToggleStats?: () => void;
  onShowHelp?: () => void;
  onCycleLanguage?: () => void;
  isEnabled?: boolean;
}

export const KEYBOARD_SHORTCUTS = [
  { key: "Space", description: "Play / Pause timelapse" },
  { key: "L", description: "Toggle live mode" },
  { key: "1-4", description: "Set playback speed (1x, 2x, 4x, 8x)" },
  { key: "\u2190 / \u2192", description: "Step backward / forward in time" },
  { key: "S", description: "Toggle stats panel" },
  { key: "F", description: "Cycle language filter" },
  { key: "Escape", description: "Close dialogs" },
  { key: "?", description: "Show keyboard shortcuts" },
] as const;

export function useKeyboardShortcuts(config: KeyboardShortcutsConfig) {
  const {
    onTogglePlayPause,
    onToggleLive,
    onSetSpeed,
    onStepBackward,
    onStepForward,
    onCloseModal,
    onToggleStats,
    onShowHelp,
    onCycleLanguage,
    isEnabled = true,
  } = config;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isEnabled) return;

      // Ignore if user is typing in an input
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const key = event.key.toLowerCase();

      switch (key) {
        case " ": // Space
          event.preventDefault();
          onTogglePlayPause?.();
          break;

        case "l":
          event.preventDefault();
          onToggleLive?.();
          break;

        case "1":
          event.preventDefault();
          onSetSpeed?.(1);
          break;

        case "2":
          event.preventDefault();
          onSetSpeed?.(2);
          break;

        case "3":
          event.preventDefault();
          onSetSpeed?.(4);
          break;

        case "4":
          event.preventDefault();
          onSetSpeed?.(8);
          break;

        case "arrowleft":
          event.preventDefault();
          onStepBackward?.();
          break;

        case "arrowright":
          event.preventDefault();
          onStepForward?.();
          break;

        case "escape":
          onCloseModal?.();
          break;

        case "s":
          event.preventDefault();
          onToggleStats?.();
          break;

        case "f":
          event.preventDefault();
          onCycleLanguage?.();
          break;

        case "?":
        case "/":
          if (event.shiftKey || key === "?") {
            event.preventDefault();
            onShowHelp?.();
          }
          break;
      }
    },
    [
      isEnabled,
      onTogglePlayPause,
      onToggleLive,
      onSetSpeed,
      onStepBackward,
      onStepForward,
      onCloseModal,
      onToggleStats,
      onShowHelp,
      onCycleLanguage,
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
