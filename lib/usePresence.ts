"use client";

import { useEffect, useState, useRef } from "react";
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
    const [mounted, setMounted] = useState(false);
    const sessionIdRef = useRef<string>("");
    const regionRef = useRef<string>("");

    // Initialize on mount
    useEffect(() => {
        sessionIdRef.current = getSessionId();
        regionRef.current = getRegionFromTimezone();
        setMounted(true);
    }, []);

    const heartbeat = useMutation(api.presence.heartbeat);
    const viewers = useQuery(api.presence.getViewers);

    // Send heartbeat every 10 seconds
    useEffect(() => {
        if (!mounted || !sessionIdRef.current) return;

        // Send initial heartbeat
        heartbeat({
            sessionId: sessionIdRef.current,
            region: regionRef.current,
        });

        // Set up interval for subsequent heartbeats
        const interval = setInterval(() => {
            heartbeat({
                sessionId: sessionIdRef.current,
                region: regionRef.current,
            });
        }, 10000);

        return () => clearInterval(interval);
    }, [mounted, heartbeat]);

    return {
        viewers: viewers ?? { total: 0, byRegion: {} },
        isLoading: viewers === undefined,
    };
}
