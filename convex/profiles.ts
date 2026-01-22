import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Search authors by username prefix for autocomplete.
 * Uses the by_author index for efficient lookups.
 */
export const searchAuthors = query({
    args: {
        prefix: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 10;
        const prefix = args.prefix.toLowerCase();

        if (!prefix || prefix.length < 2) {
            return [];
        }

        // Get recent commits and extract unique authors matching prefix
        // Using by_timestamp to get recent active contributors first
        const commits = await ctx.db
            .query("commits")
            .withIndex("by_timestamp")
            .order("desc")
            .take(50000);

        const authorCounts = new Map<string, number>();
        for (const commit of commits) {
            if (commit.author.toLowerCase().startsWith(prefix)) {
                authorCounts.set(
                    commit.author,
                    (authorCounts.get(commit.author) || 0) + 1
                );
            }
        }

        return Array.from(authorCounts.entries())
            .map(([author, commitCount]) => ({ author, commitCount }))
            .sort((a, b) => b.commitCount - a.commitCount)
            .slice(0, limit);
    },
});

/**
 * Get profile stats for a specific user.
 * Includes commit count, percentile rank, language breakdown, location, and latest message.
 */
export const getProfileStats = query({
    args: {
        username: v.string(),
        startTime: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // Validate username - return null for empty/whitespace
        const username = args.username?.trim();
        if (!username) {
            return null;
        }

        // Default to last 30 days
        const startTime =
            args.startTime ?? Date.now() - 30 * 24 * 60 * 60 * 1000;

        // Get all commits in time window for percentile calculation
        const allCommits = await ctx.db
            .query("commits")
            .withIndex("by_timestamp", (q) => q.gte("timestamp", startTime))
            .collect();

        // User's commits
        const userCommits = allCommits.filter(
            (c) => c.author === username
        );

        if (userCommits.length === 0) {
            return null;
        }

        // Calculate percentile rank
        const authorCounts = new Map<string, number>();
        for (const commit of allCommits) {
            authorCounts.set(
                commit.author,
                (authorCounts.get(commit.author) || 0) + 1
            );
        }

        const sortedCounts = Array.from(authorCounts.values()).sort(
            (a, b) => b - a
        );
        const userCount = authorCounts.get(username) || 0;
        const rank = sortedCounts.findIndex((c) => c <= userCount);
        const totalContributors = sortedCounts.length;
        // Guard against division by zero (should not happen if userCommits.length > 0)
        const percentileRank = totalContributors > 0
            ? Math.max(1, Math.round((1 - rank / totalContributors) * 100))
            : 1;

        // Language breakdown (top 3)
        const langCounts = new Map<string, number>();
        for (const commit of userCommits) {
            const lang = commit.language || "Other";
            langCounts.set(lang, (langCounts.get(lang) || 0) + 1);
        }

        const languageBreakdown = Array.from(langCounts.entries())
            .map(([language, count]) => ({
                language,
                count,
                percentage: Math.round((count / userCommits.length) * 100),
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);

        // Get location from cache
        const locationCache = await ctx.db
            .query("locationCache")
            .withIndex("by_username", (q) => q.eq("username", username))
            .first();

        // Latest commit (sorted by timestamp desc)
        const sortedUserCommits = [...userCommits].sort(
            (a, b) => b.timestamp - a.timestamp
        );
        const latestCommit = sortedUserCommits[0];
        const firstCommit = sortedUserCommits[sortedUserCommits.length - 1];

        // Validate coordinates before returning
        const hasValidCoordinates = locationCache?.coordinates?.length === 2;

        return {
            author: username,
            authorUrl: latestCommit?.authorUrl || `https://github.com/${username}`,
            commitCount: userCommits.length,
            percentileRank,
            languageBreakdown,
            location: locationCache && hasValidCoordinates
                ? {
                      text: locationCache.location,
                      coordinates: locationCache.coordinates as [number, number],
                  }
                : null,
            latestCommitMessage: latestCommit?.message || "No recent commits",
            firstCommitTimestamp: firstCommit?.timestamp || startTime,
            startTime,
        };
    },
});

/**
 * Search locations for region filter autocomplete.
 * Searches the locationCache table by location text.
 */
export const searchLocations = query({
    args: {
        query: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 10;
        const searchQuery = args.query.toLowerCase();

        if (!searchQuery || searchQuery.length < 2) {
            return [];
        }

        // Get all cached locations
        const locations = await ctx.db.query("locationCache").collect();

        // Group by location text and count users
        const locationGroups = new Map<
            string,
            { coordinates: number[]; count: number }
        >();

        for (const loc of locations) {
            if (loc.location.toLowerCase().includes(searchQuery)) {
                const existing = locationGroups.get(loc.location);
                if (existing) {
                    existing.count++;
                } else {
                    locationGroups.set(loc.location, {
                        coordinates: loc.coordinates,
                        count: 1,
                    });
                }
            }
        }

        return Array.from(locationGroups.entries())
            .map(([location, data]) => ({
                location,
                coordinates: data.coordinates as [number, number],
                userCount: data.count,
            }))
            .sort((a, b) => b.userCount - a.userCount)
            .slice(0, limit);
    },
});

/**
 * Get authors by geographic region bounds.
 * Returns usernames of contributors within the specified lat/lng bounds.
 */
export const getAuthorsByRegion = query({
    args: {
        minLat: v.number(),
        maxLat: v.number(),
        minLng: v.number(),
        maxLng: v.number(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 50;

        // Get all cached locations
        const locations = await ctx.db.query("locationCache").collect();

        // Filter by bounds
        const matchingUsers: string[] = [];

        for (const loc of locations) {
            if (loc.coordinates.length !== 2) continue;

            const [lat, lng] = loc.coordinates;

            // Latitude check
            if (lat < args.minLat || lat > args.maxLat) continue;

            // Longitude check (handle dateline crossing)
            if (args.minLng <= args.maxLng) {
                if (lng < args.minLng || lng > args.maxLng) continue;
            } else {
                // Crosses dateline
                if (lng < args.minLng && lng > args.maxLng) continue;
            }

            matchingUsers.push(loc.username);

            if (matchingUsers.length >= limit) break;
        }

        return matchingUsers;
    },
});
