"use client";

import { useState, useEffect } from "react";

/**
 * Hook to detect user's prefers-reduced-motion setting.
 * Returns true if user prefers reduced motion, false otherwise.
 *
 * Usage:
 *   const prefersReducedMotion = useReducedMotion();
 *   if (prefersReducedMotion) {
 *     // Skip animations or use reduced alternatives
 *   }
 */
export function useReducedMotion(): boolean {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        setPrefersReducedMotion(mediaQuery.matches);

        const handler = (event: MediaQueryListEvent) => {
            setPrefersReducedMotion(event.matches);
        };

        mediaQuery.addEventListener("change", handler);
        return () => mediaQuery.removeEventListener("change", handler);
    }, []);

    return prefersReducedMotion;
}
