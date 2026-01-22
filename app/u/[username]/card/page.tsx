"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { DeveloperCard } from "@/components/DeveloperCard";
import { Button } from "@/components/ui/button";
import {
    Globe,
    Copy,
    Check,
    ArrowLeft,
    Download,
    Share2,
    Sun,
    Moon,
} from "lucide-react";
import Link from "next/link";
import { useState, useRef, useCallback } from "react";

export default function CardPage() {
    const params = useParams();
    const username = params.username as string;
    const [copied, setCopied] = useState(false);
    const [theme, setTheme] = useState<"dark" | "light">("dark");
    const [isExporting, setIsExporting] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const profileStats = useQuery(api.profiles.getProfileStats, { username });

    const cardUrl = typeof window !== "undefined"
        ? `${window.location.origin}/u/${username}/card`
        : `/u/${username}/card`;

    const handleCopyLink = useCallback(() => {
        navigator.clipboard.writeText(cardUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [cardUrl]);

    const handleDownload = useCallback(async () => {
        if (!cardRef.current || isExporting) return;

        setIsExporting(true);
        try {
            // Use html2canvas-like approach via the OG image endpoint
            const response = await fetch(
                `/api/og/card?username=${username}&theme=${theme}`
            );
            if (!response.ok) throw new Error("Failed to generate image");

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${username}-ghworld-card.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to download card:", error);
        } finally {
            setIsExporting(false);
        }
    }, [username, theme, isExporting]);

    const handleShare = useCallback(async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `@${username} on gh.world`,
                    text: `Check out my developer profile on gh.world`,
                    url: cardUrl,
                });
            } catch (error) {
                // User cancelled or share failed, fall back to copy
                if ((error as Error).name !== "AbortError") {
                    handleCopyLink();
                }
            }
        } else {
            handleCopyLink();
        }
    }, [username, cardUrl, handleCopyLink]);

    const handleShareTwitter = useCallback(() => {
        const text = encodeURIComponent(
            `Check out my developer profile on gh.world! 🌍\n\n`
        );
        const url = encodeURIComponent(cardUrl);
        window.open(
            `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
            "_blank"
        );
    }, [cardUrl]);

    const handleShareLinkedIn = useCallback(() => {
        const url = encodeURIComponent(cardUrl);
        window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
            "_blank"
        );
    }, [cardUrl]);

    return (
        <div
            className={`min-h-screen flex flex-col ${theme === "dark" ? "bg-zinc-950" : "bg-zinc-100"}`}
        >
            {/* Header */}
            <header
                className={`border-b px-4 py-3 ${theme === "dark" ? "border-zinc-800" : "border-zinc-300"}`}
            >
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link
                        href={`/u/${username}`}
                        className={`flex items-center gap-2 transition-colors ${theme === "dark" ? "text-zinc-400 hover:text-zinc-200" : "text-zinc-600 hover:text-zinc-900"}`}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <Globe className="w-5 h-5" />
                        <span className="font-medium">gh.world</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                                setTheme(theme === "dark" ? "light" : "dark")
                            }
                            className={
                                theme === "dark"
                                    ? "text-zinc-400 hover:text-zinc-200"
                                    : "text-zinc-600 hover:text-zinc-900"
                            }
                        >
                            {theme === "dark" ? (
                                <Sun className="w-4 h-4" />
                            ) : (
                                <Moon className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
                {profileStats === undefined ? (
                    <div
                        className={`text-center ${theme === "dark" ? "text-zinc-500" : "text-zinc-600"}`}
                    >
                        <div className="animate-pulse">Loading profile...</div>
                    </div>
                ) : profileStats === null ? (
                    <div className="text-center space-y-4">
                        <p
                            className={`text-lg ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}
                        >
                            No commits found for @{username}
                        </p>
                        <Link href="/">
                            <Button
                                variant="outline"
                                className={
                                    theme === "dark"
                                        ? "bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
                                        : "bg-white border-zinc-300 hover:bg-zinc-50"
                                }
                            >
                                <Globe className="w-4 h-4 mr-2" />
                                Explore the Globe
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Card Preview */}
                        <div ref={cardRef}>
                            <DeveloperCard
                                username={profileStats.author}
                                authorUrl={profileStats.authorUrl}
                                commitCount={profileStats.commitCount}
                                percentileRank={profileStats.percentileRank}
                                languageBreakdown={profileStats.languageBreakdown}
                                location={profileStats.location}
                                theme={theme}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCopyLink}
                                className={
                                    theme === "dark"
                                        ? "bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
                                        : "bg-white border-zinc-300 hover:bg-zinc-50"
                                }
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4 mr-2" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copy Link
                                    </>
                                )}
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDownload}
                                disabled={isExporting}
                                className={
                                    theme === "dark"
                                        ? "bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
                                        : "bg-white border-zinc-300 hover:bg-zinc-50"
                                }
                            >
                                <Download className="w-4 h-4 mr-2" />
                                {isExporting ? "Exporting..." : "Download PNG"}
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleShare}
                                className={
                                    theme === "dark"
                                        ? "bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
                                        : "bg-white border-zinc-300 hover:bg-zinc-50"
                                }
                            >
                                <Share2 className="w-4 h-4 mr-2" />
                                Share
                            </Button>
                        </div>

                        {/* Social Share Buttons */}
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleShareTwitter}
                                className={
                                    theme === "dark"
                                        ? "text-zinc-400 hover:text-zinc-200"
                                        : "text-zinc-600 hover:text-zinc-900"
                                }
                            >
                                Share on X
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleShareLinkedIn}
                                className={
                                    theme === "dark"
                                        ? "text-zinc-400 hover:text-zinc-200"
                                        : "text-zinc-600 hover:text-zinc-900"
                                }
                            >
                                Share on LinkedIn
                            </Button>
                        </div>
                    </>
                )}
            </main>

            {/* Footer */}
            <footer
                className={`border-t px-4 py-4 text-center ${theme === "dark" ? "border-zinc-800" : "border-zinc-300"}`}
            >
                <p
                    className={`text-xs ${theme === "dark" ? "text-zinc-600" : "text-zinc-500"}`}
                >
                    Verified by{" "}
                    <Link
                        href="/"
                        className={
                            theme === "dark"
                                ? "text-zinc-400 hover:text-zinc-200"
                                : "text-zinc-600 hover:text-zinc-900"
                        }
                    >
                        gh.world
                    </Link>
                </p>
            </footer>
        </div>
    );
}
