"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { ProfileCard } from "@/components/ProfileCard";
import { Button } from "@/components/ui/button";
import { Globe, Copy, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ProfilePage() {
    const params = useParams();
    const username = params.username as string;
    const [copied, setCopied] = useState(false);

    const profileStats = useQuery(api.profiles.getProfileStats, { username });

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
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-4">
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
                    // Profile found
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
