"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ProfileCard } from "./ProfileCard";
import { User, Sparkles } from "lucide-react";

const DASHBOARD_SHOWN_KEY = "ghworld_dashboard_shown";

interface PersonalStatsDashboardProps {
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Callback when user's commits should be highlighted on globe */
    onHighlightUser?: (username: string | null) => void;
    /** Hide the trigger button (when triggered from elsewhere like UserMenu) */
    hideTrigger?: boolean;
}

export function PersonalStatsDashboard({
    isOpen: controlledIsOpen,
    onOpenChange,
    onHighlightUser,
    hideTrigger = false,
}: PersonalStatsDashboardProps = {}) {
    const { data: session, status } = useSession();
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const [hasAutoShown, setHasAutoShown] = useState(false);

    // Support both controlled and uncontrolled modes
    const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
    const setIsOpen = onOpenChange || setInternalIsOpen;

    const username = session?.user?.name || null;

    // Fetch profile stats for logged-in user
    const profileStats = useQuery(
        api.profiles.getProfileStats,
        username ? { username } : "skip"
    );

    // Auto-show dashboard on first login
    useEffect(() => {
        if (status !== "authenticated" || !username || hasAutoShown) return;

        // Check if we've shown the dashboard for this user before
        const shownFor = localStorage.getItem(DASHBOARD_SHOWN_KEY);
        if (shownFor === username) {
            // Defer setState to avoid synchronous cascading renders
            const skipTimer = setTimeout(() => setHasAutoShown(true), 0);
            return () => clearTimeout(skipTimer);
        }

        // Auto-show the dashboard after a small delay for smooth experience
        const timer = setTimeout(() => {
            setIsOpen(true);
            localStorage.setItem(DASHBOARD_SHOWN_KEY, username);
            setHasAutoShown(true);
        }, 500);

        return () => clearTimeout(timer);
    }, [status, username, hasAutoShown, setIsOpen]);

    // Notify parent about user highlighting when dashboard opens/closes
    useEffect(() => {
        if (onHighlightUser) {
            onHighlightUser(isOpen && username ? username : null);
        }
    }, [isOpen, username, onHighlightUser]);

    // Don't render if not logged in
    if (status !== "authenticated" || !username) {
        return null;
    }

    const isLoading = profileStats === undefined;
    const hasStats = profileStats !== null && profileStats !== undefined;

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            {!hideTrigger && (
                <SheetTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 sm:h-9 sm:w-9 bg-zinc-900/40 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 backdrop-blur-sm transition-all relative"
                        title="Your Stats"
                    >
                        <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        {/* Notification dot for first-time users */}
                        {!hasAutoShown && (
                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                        )}
                    </Button>
                </SheetTrigger>
            )}

            <SheetContent
                side="right"
                className="w-full sm:w-[440px] bg-zinc-950 border-zinc-900 p-0 flex flex-col"
            >
                <SheetHeader className="p-6 pb-4 border-b border-zinc-900 flex-shrink-0">
                    <SheetTitle className="text-zinc-100 flex items-center gap-2 text-sm font-bold tracking-tight">
                        <Sparkles className="h-4 w-4 text-emerald-400" />
                        YOUR MIRROR
                    </SheetTitle>
                    <SheetDescription className="text-[10px] text-zinc-500 mt-1">
                        Your place in the global code stream
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="p-6">
                        {isLoading ? (
                            <LoadingState />
                        ) : hasStats ? (
                            <div className="space-y-6">
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

                                {/* Personal insights callout */}
                                <InsightCard
                                    percentileRank={profileStats.percentileRank}
                                    commitCount={profileStats.commitCount}
                                    topLanguage={profileStats.languageBreakdown[0]?.language}
                                />
                            </div>
                        ) : (
                            <NoStatsState username={username} />
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-zinc-900 flex-shrink-0 text-center">
                    <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
                        Stats from the last 30 days
                    </p>
                </div>
            </SheetContent>
        </Sheet>
    );
}

function LoadingState() {
    return (
        <div className="animate-pulse space-y-4">
            <div className="h-6 bg-zinc-900 rounded w-3/4"></div>
            <div className="h-40 bg-zinc-900 rounded"></div>
            <div className="h-4 bg-zinc-900 rounded w-1/2"></div>
        </div>
    );
}

function NoStatsState({ username }: { username: string }) {
    return (
        <div className="text-center py-8 space-y-4">
            <div className="text-4xl">🌍</div>
            <h3 className="text-lg font-medium text-zinc-200">
                Welcome, @{username}!
            </h3>
            <p className="text-sm text-zinc-400 max-w-sm mx-auto">
                We don&apos;t have any commits from you in the last 30 days.
                Push some code and check back to see your stats!
            </p>
        </div>
    );
}

function InsightCard({
    percentileRank,
    commitCount,
    topLanguage,
}: {
    percentileRank: number;
    commitCount: number;
    topLanguage?: string;
}) {
    // Generate a personalized insight based on stats
    const getInsight = () => {
        if (percentileRank <= 1) {
            return "You're in the top 1% of contributors. Absolute legend status.";
        }
        if (percentileRank <= 5) {
            return "Top 5% contributor. You're shipping faster than most.";
        }
        if (percentileRank <= 10) {
            return "Top 10%! You're outpacing 90% of developers on gh.world.";
        }
        if (percentileRank <= 25) {
            return "Top quarter of contributors. Solid momentum.";
        }
        if (commitCount >= 50) {
            return `${commitCount} commits this month. Consistency is your superpower.`;
        }
        if (topLanguage) {
            return `Your ${topLanguage} commits are part of the global stream.`;
        }
        return "Every commit adds to the world's code canvas.";
    };

    return (
        <div className="bg-gradient-to-br from-zinc-900/50 to-transparent border border-zinc-800 rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2">
                Insight
            </p>
            <p className="text-sm text-zinc-300 leading-relaxed">
                {getInsight()}
            </p>
        </div>
    );
}

export default PersonalStatsDashboard;
