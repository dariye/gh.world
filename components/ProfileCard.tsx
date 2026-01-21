"use client";

import { useState, useEffect } from "react";
import { Globe, MapPin, ExternalLink } from "lucide-react";
import { LanguageBar } from "./LanguageBar";

// Animated counter component (same as StatsSidebar)
function AnimatedCounter({
    value,
    duration = 1500,
}: {
    value: number;
    duration?: number;
}) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let startTime: number;
        let animationFrame: number;

        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);

            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            setDisplayValue(Math.floor(easeOutQuart * value));

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [value, duration]);

    return <span className="tabular-nums">{displayValue.toLocaleString()}</span>;
}

// Get local time for a timezone offset
function getLocalTime(coordinates: [number, number] | null): string {
    if (!coordinates) return "";

    // Estimate timezone from longitude (rough approximation)
    const [, lng] = coordinates;
    const offsetHours = Math.round(lng / 15);
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const localTime = new Date(utc + offsetHours * 3600000);

    return localTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
}

// Format date as "Jan 21"
function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
}

export interface ProfileCardProps {
    username: string;
    authorUrl?: string;
    commitCount: number;
    percentileRank: number;
    languageBreakdown: { language: string; percentage: number; count: number }[];
    location?: { text: string; coordinates: [number, number] } | null;
    latestCommitMessage: string;
    firstCommitTimestamp: number;
    onShare?: () => void;
}

export function ProfileCard({
    username,
    authorUrl,
    commitCount,
    percentileRank,
    languageBreakdown,
    location,
    latestCommitMessage,
    firstCommitTimestamp,
    onShare,
}: ProfileCardProps) {
    const localTime = getLocalTime(location?.coordinates || null);

    // Truncate commit message if too long
    const truncatedMessage =
        latestCommitMessage.length > 50
            ? latestCommitMessage.substring(0, 47) + "..."
            : latestCommitMessage;

    return (
        <div className="w-full max-w-[400px] bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
            {/* Header with branding */}
            <div className="px-6 pt-6 pb-4">
                <div className="flex items-center gap-2 text-zinc-500 mb-4">
                    <Globe className="w-4 h-4" />
                    <span className="text-sm font-medium">gh.world</span>
                </div>

                {/* Username */}
                <a
                    href={authorUrl || `https://github.com/${username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                    <h2 className="text-2xl font-bold text-zinc-100">
                        @{username}
                    </h2>
                    <ExternalLink className="w-4 h-4 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>

                {/* Separator */}
                <div className="h-[1px] w-full bg-zinc-800 mt-4" />
            </div>

            {/* Stats section */}
            <div className="px-6 pb-4 space-y-1">
                <p className="text-zinc-300">
                    <span className="text-2xl font-bold text-zinc-100">
                        <AnimatedCounter value={commitCount} />
                    </span>{" "}
                    <span className="text-zinc-400">
                        commits since {formatDate(firstCommitTimestamp)}
                    </span>
                </p>
                <p className="text-emerald-400 font-medium">
                    Top {percentileRank}% globally
                </p>
            </div>

            {/* Language breakdown */}
            <div className="px-6 pb-4 space-y-2">
                {languageBreakdown.slice(0, 3).map((lang) => (
                    <LanguageBar
                        key={lang.language}
                        language={lang.language}
                        percentage={lang.percentage}
                        count={lang.count}
                    />
                ))}
            </div>

            {/* Footer with location and quote */}
            <div className="px-6 pb-6 space-y-3">
                {/* Location */}
                {location && (
                    <div className="flex items-center gap-2 text-zinc-400 text-sm">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="truncate">{location.text}</span>
                        {localTime && (
                            <>
                                <span className="text-zinc-600">·</span>
                                <span className="font-mono">{localTime} local</span>
                            </>
                        )}
                    </div>
                )}

                {/* Quote (latest commit message) */}
                <p className="text-zinc-500 text-sm italic">
                    &ldquo;{truncatedMessage}&rdquo;
                </p>
            </div>
        </div>
    );
}

export default ProfileCard;
