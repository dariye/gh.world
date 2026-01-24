"use client";

import { useState, useEffect } from "react";

// Check media query safely (works during SSR and CSR)
function getInitialReducedMotion(): boolean {
    if (typeof window === "undefined" || !window.matchMedia) {
        return false;
    }
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Hook to detect user's prefers-reduced-motion preference (WCAG 2.3.3)
 * Returns true if user prefers reduced motion, false otherwise
 */
export function useReducedMotion(): boolean {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(getInitialReducedMotion);

    useEffect(() => {
        // Check if matchMedia is available (SSR safety)
        if (typeof window === "undefined" || !window.matchMedia) {
            return;
        }

        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

        // Listen for changes only (initial value set via useState initializer)
        const handleChange = (event: MediaQueryListEvent) => {
            setPrefersReducedMotion(event.matches);
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, []);

    return prefersReducedMotion;
}
