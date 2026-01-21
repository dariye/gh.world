"use client";

import { useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Search, User, MapPin, Code } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { ProfileCard } from "./ProfileCard";

type SearchMode = "username" | "location" | "language";

interface ProfileSearchProps {
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export function ProfileSearch({
    isOpen: controlledIsOpen,
    onOpenChange,
    trigger,
}: ProfileSearchProps) {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const [searchMode, setSearchMode] = useState<SearchMode>("username");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUsername, setSelectedUsername] = useState<string | null>(null);

    // Support both controlled and uncontrolled modes
    const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
    const setIsOpen = onOpenChange || setInternalIsOpen;

    // Search queries based on mode
    const authorResults = useQuery(
        api.profiles.searchAuthors,
        searchMode === "username" && searchQuery.length >= 2
            ? { prefix: searchQuery, limit: 10 }
            : "skip"
    );

    const locationResults = useQuery(
        api.profiles.searchLocations,
        searchMode === "location" && searchQuery.length >= 2
            ? { query: searchQuery, limit: 10 }
            : "skip"
    );

    // Get profile stats for selected user
    const profileStats = useQuery(
        api.profiles.getProfileStats,
        selectedUsername ? { username: selectedUsername } : "skip"
    );

    const handleSelectUser = useCallback((username: string) => {
        setSelectedUsername(username);
    }, []);

    const handleBack = useCallback(() => {
        setSelectedUsername(null);
    }, []);

    const handleOpenChange = useCallback(
        (open: boolean) => {
            setIsOpen(open);
            if (!open) {
                // Reset state when closing
                setSelectedUsername(null);
                setSearchQuery("");
            }
        },
        [setIsOpen]
    );

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            {trigger ? (
                <DialogTrigger asChild>{trigger}</DialogTrigger>
            ) : (
                <DialogTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 sm:h-9 sm:w-9 bg-zinc-900/40 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 backdrop-blur-sm transition-all"
                    >
                        <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                </DialogTrigger>
            )}

            <DialogContent className="bg-zinc-950 border-zinc-800 p-0 gap-0 max-w-md sm:max-w-lg">
                {selectedUsername && profileStats ? (
                    // Profile Card View
                    <div className="p-4">
                        <button
                            onClick={handleBack}
                            className="text-sm text-zinc-400 hover:text-zinc-200 mb-4 flex items-center gap-1"
                        >
                            ← Back to search
                        </button>
                        <div className="flex justify-center">
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
                        </div>
                        <div className="mt-4 flex justify-center">
                            <Button
                                variant="outline"
                                className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
                                onClick={() => {
                                    const url = `${window.location.origin}/u/${selectedUsername}`;
                                    navigator.clipboard.writeText(url);
                                }}
                            >
                                Copy Share Link
                            </Button>
                        </div>
                    </div>
                ) : (
                    // Search View
                    <>
                        <DialogHeader className="p-4 pb-2 border-b border-zinc-800">
                            <DialogTitle className="text-zinc-100 flex items-center gap-2">
                                <Search className="w-4 h-4" />
                                Find Contributors
                            </DialogTitle>
                        </DialogHeader>

                        {/* Search Mode Tabs */}
                        <div className="flex border-b border-zinc-800">
                            <button
                                onClick={() => {
                                    setSearchMode("username");
                                    setSearchQuery("");
                                }}
                                className={`flex-1 py-2 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                                    searchMode === "username"
                                        ? "text-zinc-100 border-b-2 border-emerald-500"
                                        : "text-zinc-500 hover:text-zinc-300"
                                }`}
                            >
                                <User className="w-3.5 h-3.5" />
                                Username
                            </button>
                            <button
                                onClick={() => {
                                    setSearchMode("location");
                                    setSearchQuery("");
                                }}
                                className={`flex-1 py-2 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                                    searchMode === "location"
                                        ? "text-zinc-100 border-b-2 border-emerald-500"
                                        : "text-zinc-500 hover:text-zinc-300"
                                }`}
                            >
                                <MapPin className="w-3.5 h-3.5" />
                                Region
                            </button>
                        </div>

                        {/* Search Command */}
                        <Command className="bg-transparent">
                            <CommandInput
                                placeholder={
                                    searchMode === "username"
                                        ? "Search by username..."
                                        : "Search by location..."
                                }
                                value={searchQuery}
                                onValueChange={setSearchQuery}
                                className="text-zinc-100 border-none focus:ring-0"
                            />
                            <CommandList className="max-h-[300px]">
                                <CommandEmpty className="py-6 text-center text-sm text-zinc-500">
                                    {searchQuery.length < 2
                                        ? "Type at least 2 characters to search"
                                        : "No results found"}
                                </CommandEmpty>

                                {searchMode === "username" && authorResults && (
                                    <CommandGroup heading="Contributors">
                                        {authorResults.map((result) => (
                                            <CommandItem
                                                key={result.author}
                                                value={result.author}
                                                onSelect={() => handleSelectUser(result.author)}
                                                className="text-zinc-200 hover:bg-zinc-800 cursor-pointer py-3"
                                            >
                                                <User className="w-4 h-4 mr-2 text-zinc-500" />
                                                <span className="flex-1">@{result.author}</span>
                                                <span className="text-xs text-zinc-500">
                                                    {result.commitCount} commits
                                                </span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}

                                {searchMode === "location" && locationResults && (
                                    <CommandGroup heading="Locations">
                                        {locationResults.map((result) => (
                                            <CommandItem
                                                key={result.location}
                                                value={result.location}
                                                onSelect={() => {
                                                    // For now, switch to username search with first user from region
                                                    // Could enhance to show all users in region
                                                    setSearchMode("username");
                                                    setSearchQuery("");
                                                }}
                                                className="text-zinc-200 hover:bg-zinc-800 cursor-pointer py-3"
                                            >
                                                <MapPin className="w-4 h-4 mr-2 text-zinc-500" />
                                                <span className="flex-1">{result.location}</span>
                                                <span className="text-xs text-zinc-500">
                                                    {result.userCount} contributors
                                                </span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}
                            </CommandList>
                        </Command>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default ProfileSearch;
