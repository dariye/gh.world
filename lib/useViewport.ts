import { useState, useEffect } from "react";

export interface Viewport {
  minLat?: number;
  maxLat?: number;
  minLng?: number;
  maxLng?: number;
}

interface UseViewportOptions {
  debounceMs?: number;
}

interface UseViewportReturn {
  viewport: Viewport | null;
  debouncedViewport: Viewport | null;
  setViewport: (viewport: Viewport | null) => void;
}

export function useViewport(options: UseViewportOptions = {}): UseViewportReturn {
  const { debounceMs = 300 } = options;

  const [viewport, setViewport] = useState<Viewport | null>(null);
  const [debouncedViewport, setDebouncedViewport] = useState<Viewport | null>(null);

  // Debounce viewport updates to avoid hammering the backend
  useEffect(() => {
    if (!viewport) return;
    const timer = setTimeout(() => {
      setDebouncedViewport(viewport);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [viewport, debounceMs]);

  return {
    viewport,
    debouncedViewport,
    setViewport,
  };
}
