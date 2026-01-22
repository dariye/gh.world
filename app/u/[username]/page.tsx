"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { ProfileCard } from "@/components/ProfileCard";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";
import { CodingHoursChart } from "@/components/CodingHoursChart";
import { StreakStats } from "@/components/StreakStats";
import { Button } from "@/components/ui/button";
import { Globe, Copy, Check, ArrowLeft, CreditCard } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ProfilePage() {
    const params = useParams();
    const username = typeof params.username === 'string' ? params.username : null;
    const [copied, setCopied] = useState(false);

    const profileStats = useQuery(
        api.profiles.getProfileStats,
        username ? { username } : "skip"
    );

    const enhancedStats = useQuery(
        api.profiles.getEnhancedProfileStats,
        username ? { username, days: 30 } : "skip"
    );

    const handleCopyLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col">
            {/* Header */}
            <header className="border-b border-zinc-800 px-4 py-3">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <Globe className="w-5 h-5" />
                        <span className="font-medium">gh.world</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <Link href={`/u/${username}/card`}>
                            <Button
                                variant="outline"
                                size="sm"
                                className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
                            >
                                <CreditCard className="w-4 h-4 mr-2" />
                                Get Card
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyLink}
                            className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4 mr-2" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4 mr-2" />
                                    Share
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-4 py-8">
                {profileStats === undefined ? (
                    // Loading state
                    <div className="text-zinc-500 text-center">
                        <div className="animate-pulse">Loading profile...</div>
                    </div>
                ) : profileStats === null ? (
                    // User not found
                    <div className="text-center space-y-4">
                        <p className="text-zinc-400 text-lg">
                            No commits found for @{username}
                        </p>
                        <p className="text-zinc-500 text-sm">
                            This user hasn&apos;t made any public commits tracked by gh.world yet.
                        </p>
                        <Link href="/">
                            <Button
                                variant="outline"
                                className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
                            >
                                <Globe className="w-4 h-4 mr-2" />
                                Explore the Globe
                            </Button>
                        </Link>
                    </div>
                ) : (
                    // Profile found - show card and enhanced stats
                    <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-6 items-start justify-center">
                        {/* Profile Card */}
                        <ProfileCard
                            username={profileStats.author}
                            authorUrl={profileStats.authorUrl}
                            commitCount={profileStats.commitCount}
                            percentileRank={profileStats.percentileRank}
                            languageBreakdown={profileStats.languageBreakdown}
                            location={profileStats.location}
                            latestCommitMessage={profileStats.latestCommitMessage}
                            firstCommitTimestamp={profileStats.firstCommitTimestamp}
                        />

                        {/* Enhanced Stats Panel */}
                        {enhancedStats && (
                            <div className="w-full max-w-[400px] lg:flex-1 space-y-6">
                                {/* Activity Heatmap */}
                                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                                    <h3 className="text-sm font-medium text-zinc-300 mb-3">
                                        Activity (last 30 days)
                                    </h3>
                                    <ActivityHeatmap
                                        data={enhancedStats.activityData}
                                        days={30}
                                    />
                                </div>

                                {/* Streak Stats */}
                                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                                    <h3 className="text-sm font-medium text-zinc-300 mb-3">
                                        Streaks & Activity
                                    </h3>
                                    <StreakStats
                                        currentStreak={enhancedStats.currentStreak}
                                        longestStreak={enhancedStats.longestStreak}
                                        activeDays={enhancedStats.activeDays}
                                        avgCommitsPerDay={enhancedStats.avgCommitsPerActiveDay}
                                    />
                                </div>

                                {/* Coding Hours */}
                                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                                    <h3 className="text-sm font-medium text-zinc-300 mb-3">
                                        Coding Hours (UTC)
                                    </h3>
                                    <CodingHoursChart
                                        data={enhancedStats.hourlyData}
                                        peakHour={enhancedStats.peakHour}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-zinc-800 px-4 py-4 text-center">
                <p className="text-xs text-zinc-600">
                    Track your GitHub commits at{" "}
                    <Link href="/" className="text-zinc-400 hover:text-zinc-200">
                        gh.world
                    </Link>
                </p>
            </footer>
        </div>
    );
}
