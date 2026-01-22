"use client";

import { Flame, Trophy, Calendar, GitCommit } from "lucide-react";

interface StreakStatsProps {
    currentStreak: number;
    longestStreak: number;
    activeDays: number;
    avgCommitsPerDay: number;
}

export function StreakStats({
    currentStreak,
    longestStreak,
    activeDays,
    avgCommitsPerDay,
}: StreakStatsProps) {
    const stats = [
        {
            icon: Flame,
            label: "Current streak",
            value: currentStreak,
            suffix: currentStreak === 1 ? " day" : " days",
            highlight: currentStreak >= 7,
        },
        {
            icon: Trophy,
            label: "Longest streak",
            value: longestStreak,
            suffix: longestStreak === 1 ? " day" : " days",
            highlight: false,
        },
        {
            icon: Calendar,
            label: "Active days",
            value: activeDays,
            suffix: "",
            highlight: false,
        },
        {
            icon: GitCommit,
            label: "Avg/day",
            value: avgCommitsPerDay,
            suffix: "",
            highlight: false,
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => (
                <div
                    key={stat.label}
                    className="flex items-center gap-2 text-sm"
                >
                    <stat.icon
                        className={`w-4 h-4 shrink-0 ${
                            stat.highlight ? "text-orange-400" : "text-zinc-500"
                        }`}
                    />
                    <div className="min-w-0">
                        <div
                            className={`font-medium tabular-nums ${
                                stat.highlight ? "text-orange-400" : "text-zinc-200"
                            }`}
                        >
                            {stat.value}
                            {stat.suffix}
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate">
                            {stat.label}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
