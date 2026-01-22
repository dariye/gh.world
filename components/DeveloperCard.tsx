"use client";

import { Globe, MapPin } from "lucide-react";
import { getLanguageHex } from "@/lib/colors";

export interface DeveloperCardProps {
    username: string;
    authorUrl?: string;
    commitCount: number;
    percentileRank: number;
    languageBreakdown: { language: string; percentage: number; count: number }[];
    location?: { text: string; coordinates: [number, number] } | null;
    theme?: "dark" | "light";
}

/**
 * Static developer card component optimized for sharing.
 * This card is designed to look good when exported as an image.
 */
export function DeveloperCard({
    username,
    commitCount,
    percentileRank,
    languageBreakdown,
    location,
    theme = "dark",
}: DeveloperCardProps) {
    const isDark = theme === "dark";

    // Get current year for the "commits in YEAR" display
    const currentYear = new Date().getFullYear();

    // Format large numbers
    const formatNumber = (num: number): string => {
        if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}k`;
        }
        return num.toLocaleString();
    };

    return (
        <div
            className={`w-[400px] rounded-xl overflow-hidden shadow-2xl ${
                isDark
                    ? "bg-zinc-950 border border-zinc-800"
                    : "bg-white border border-zinc-200"
            }`}
        >
            {/* Header with branding */}
            <div className="px-6 pt-6 pb-4">
                <div
                    className={`flex items-center gap-2 mb-4 ${isDark ? "text-zinc-500" : "text-zinc-400"}`}
                >
                    <Globe className="w-4 h-4" />
                    <span className="text-sm font-medium">gh.world</span>
                </div>

                {/* Username */}
                <h2
                    className={`text-2xl font-bold ${isDark ? "text-zinc-100" : "text-zinc-900"}`}
                >
                    @{username}
                </h2>

                {/* Separator */}
                <div
                    className={`h-[1px] w-full mt-4 ${isDark ? "bg-zinc-800" : "bg-zinc-200"}`}
                />
            </div>

            {/* Stats section */}
            <div className="px-6 pb-4 space-y-1">
                <p className={isDark ? "text-zinc-300" : "text-zinc-700"}>
                    <span
                        className={`text-2xl font-bold ${isDark ? "text-zinc-100" : "text-zinc-900"}`}
                    >
                        {formatNumber(commitCount)}
                    </span>{" "}
                    <span className={isDark ? "text-zinc-400" : "text-zinc-500"}>
                        commits in {currentYear}
                    </span>
                </p>
                <p className="text-emerald-500 font-medium">
                    Top {percentileRank}% globally
                </p>
            </div>

            {/* Language breakdown */}
            <div className="px-6 pb-4 space-y-2">
                {languageBreakdown.slice(0, 3).map((lang) => (
                    <LanguageBarStatic
                        key={lang.language}
                        language={lang.language}
                        percentage={lang.percentage}
                        theme={theme}
                    />
                ))}
            </div>

            {/* Footer with location and verification */}
            <div className="px-6 pb-6 space-y-3">
                {/* Location */}
                {location && (
                    <div
                        className={`flex items-center gap-2 text-sm ${isDark ? "text-zinc-400" : "text-zinc-500"}`}
                    >
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="truncate">{location.text}</span>
                    </div>
                )}

                {/* Verification badge */}
                <div
                    className={`flex items-center justify-between pt-3 border-t ${
                        isDark ? "border-zinc-800" : "border-zinc-200"
                    }`}
                >
                    <span
                        className={`text-xs ${isDark ? "text-zinc-500" : "text-zinc-400"}`}
                    >
                        Verified by gh.world
                    </span>
                    <span
                        className={`text-xs font-mono ${isDark ? "text-zinc-600" : "text-zinc-400"}`}
                    >
                        gh.world/@{username}
                    </span>
                </div>
            </div>
        </div>
    );
}

/**
 * Static language bar without animations for card export.
 */
function LanguageBarStatic({
    language,
    percentage,
    theme,
}: {
    language: string;
    percentage: number;
    theme: "dark" | "light";
}) {
    const color = getLanguageHex(language);
    const clampedPercentage = Math.min(100, Math.max(0, percentage));
    const isDark = theme === "dark";

    return (
        <div className="flex items-center gap-3">
            {/* Language name with color indicator */}
            <div className="flex items-center gap-2 min-w-[100px]">
                <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                />
                <span
                    className={`text-xs font-medium truncate ${isDark ? "text-zinc-300" : "text-zinc-700"}`}
                >
                    {language}
                </span>
            </div>

            {/* Progress bar */}
            <div
                className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? "bg-zinc-800" : "bg-zinc-200"}`}
            >
                <div
                    className="h-full rounded-full"
                    style={{
                        width: `${clampedPercentage}%`,
                        backgroundColor: color,
                    }}
                />
            </div>

            {/* Percentage label */}
            <span
                className={`text-xs font-mono w-10 text-right ${isDark ? "text-zinc-500" : "text-zinc-400"}`}
            >
                {Math.round(clampedPercentage)}%
            </span>
        </div>
    );
}

export default DeveloperCard;
