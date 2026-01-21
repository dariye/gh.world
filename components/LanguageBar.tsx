"use client";

import { getLanguageHex } from "@/lib/colors";

interface LanguageBarProps {
    language: string;
    percentage: number;
    count?: number;
}

/**
 * Reusable language progress bar component.
 * Displays: Language ████████░░ 61%
 */
export function LanguageBar({ language, percentage, count }: LanguageBarProps) {
    const color = getLanguageHex(language);
    const clampedPercentage = Math.min(100, Math.max(0, percentage));

    return (
        <div className="flex items-center gap-3">
            {/* Language name with color indicator */}
            <div className="flex items-center gap-2 min-w-[100px]">
                <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                />
                <span className="text-xs font-medium text-zinc-300 truncate">
                    {language}
                </span>
            </div>

            {/* Progress bar */}
            <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                        width: `${clampedPercentage}%`,
                        backgroundColor: color,
                    }}
                />
            </div>

            {/* Percentage label */}
            <span className="text-xs font-mono text-zinc-500 w-10 text-right">
                {Math.round(clampedPercentage)}%
            </span>
        </div>
    );
}

export default LanguageBar;
