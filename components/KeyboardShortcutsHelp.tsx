"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { KEYBOARD_SHORTCUTS } from "@/lib/useKeyboardShortcuts";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsHelp({
  isOpen,
  onClose,
}: KeyboardShortcutsHelpProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-zinc-950 border-zinc-800 max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 mt-4">
          {KEYBOARD_SHORTCUTS.map((shortcut) => (
            <div
              key={shortcut.key}
              className="flex items-center justify-between py-2 border-b border-zinc-900 last:border-0"
            >
              <span className="text-zinc-400 text-sm">
                {shortcut.description}
              </span>
              <kbd className="px-2 py-1 text-xs font-mono bg-zinc-900 border border-zinc-800 rounded text-zinc-300">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-zinc-600 font-mono mt-4 text-center">
          Press ? anytime to show this help
        </p>
      </DialogContent>
    </Dialog>
  );
}
