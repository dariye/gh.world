"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

// Detect region from timezone
function getRegionFromTimezone(): string {
    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz.startsWith("Europe/")) return "europe";
        if (tz.startsWith("America/")) return "americas";
        if (tz.startsWith("Asia/")) return "asia";
        if (tz.startsWith("Africa/")) return "africa";
        if (tz.startsWith("Australia/") || tz.startsWith("Pacific/")) return "oceania";
        return "other";
    } catch {
        return "other";
    }
}

// Generate a stable session ID for this browser tab
function getSessionId(): string {
    if (typeof window === "undefined") return "";

    let sessionId = sessionStorage.getItem("ghworld-session-id");
    if (!sessionId) {
        sessionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        sessionStorage.setItem("ghworld-session-id", sessionId);
    }
    return sessionId;
}

export interface ViewerData {
    total: number;
    byRegion: Record<string, number>;
}

export function usePresence() {
    // Use refs for client-side values (avoids hydration mismatches)
    const sessionIdRef = useRef<string>("");
    const regionRef = useRef<string>("");

    const heartbeat = useMutation(api.presence.heartbeat);
    const viewers = useQuery(api.presence.getViewers);

    // Initialize and send heartbeat (single effect for both)
    useEffect(() => {
        // Initialize refs on mount (effect runs only on client)
        sessionIdRef.current = getSessionId();
        regionRef.current = getRegionFromTimezone();

        const sendHeartbeat = async () => {
            if (!sessionIdRef.current) return;
            try {
                await heartbeat({
                    sessionId: sessionIdRef.current,
                    region: regionRef.current,
                });
            } catch {
                // Fail silently - Convex may be unavailable (e.g., free plan exceeded)
                // Presence tracking is non-critical functionality
            }
        };

        // Send initial heartbeat
        sendHeartbeat();

        // Set up interval for subsequent heartbeats
        const interval = setInterval(sendHeartbeat, 10000);

        return () => clearInterval(interval);
    }, [heartbeat]);

    return {
        viewers: viewers ?? { total: 0, byRegion: {} },
        isLoading: viewers === undefined,
    };
}
