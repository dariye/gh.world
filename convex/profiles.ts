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

        // Query user's commits directly using the by_author index (efficient!)
        // Then filter by timestamp client-side
        const userCommitsAll = await ctx.db
            .query("commits")
            .withIndex("by_author", (q) => q.eq("author", username))
            .collect();

        // Filter to time window
        const userCommits = userCommitsAll.filter(
            (c) => c.timestamp >= startTime
        );

        if (userCommits.length === 0) {
            return null;
        }

        // For percentile calculation, use monthly stats if available
        // This avoids reading all commits which can exceed Convex limits
        const currentMonth = new Date().toISOString().slice(0, 7); // "2026-01"
        const monthlyStats = await ctx.db
            .query("monthlyStats")
            .withIndex("by_month", (q) => q.eq("month", currentMonth))
            .first();

        // Estimate percentile based on monthly stats
        // If user has X commits and average is Y commits per contributor,
        // rough percentile = min(99, (X / avg) * 50)
        let percentileRank = 50; // Default to median
        if (monthlyStats && monthlyStats.uniqueContributors > 0) {
            const avgCommitsPerUser = monthlyStats.totalCommits / monthlyStats.uniqueContributors;
            const userRatio = userCommits.length / avgCommitsPerUser;
            // Scale: 1x average = 50th percentile, 2x = 75th, 4x = ~90th
            percentileRank = Math.min(99, Math.max(1, Math.round(50 + (Math.log2(userRatio) * 25))));
        } else {
            // Fallback: estimate based on commit count alone
            // Top 1% typically has 100+ commits/month, top 10% has 20+
            if (userCommits.length >= 100) percentileRank = 1;
            else if (userCommits.length >= 50) percentileRank = 5;
            else if (userCommits.length >= 20) percentileRank = 10;
            else if (userCommits.length >= 10) percentileRank = 25;
            else percentileRank = 50;
        }

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
 * Get enhanced profile stats including activity heatmap data, coding hours, and streaks.
 */
export const getEnhancedProfileStats = query({
    args: {
        username: v.string(),
        days: v.optional(v.number()), // How many days of history (default 30)
    },
    handler: async (ctx, args) => {
        const username = args.username?.trim();
        if (!username) {
            return null;
        }

        const days = args.days ?? 30;
        const startTime = Date.now() - days * 24 * 60 * 60 * 1000;

        // Get all user commits
        const userCommits = await ctx.db
            .query("commits")
            .withIndex("by_author", (q) => q.eq("author", username))
            .collect();

        // Filter to time window
        const recentCommits = userCommits.filter((c) => c.timestamp >= startTime);

        if (userCommits.length === 0) {
            return null;
        }

        // Build daily activity map (for heatmap)
        const dailyActivity = new Map<string, number>();
        const hourlyActivity = new Array(24).fill(0);

        for (const commit of recentCommits) {
            // Daily activity
            const date = new Date(commit.timestamp).toISOString().split("T")[0];
            dailyActivity.set(date, (dailyActivity.get(date) || 0) + 1);

            // Hourly activity (in UTC)
            const hour = new Date(commit.timestamp).getUTCHours();
            hourlyActivity[hour]++;
        }

        // Convert daily activity to array sorted by date
        const activityData = Array.from(dailyActivity.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Calculate current streak (consecutive days with commits, ending today or yesterday)
        const today = new Date().toISOString().split("T")[0];
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0];

        let currentStreak = 0;
        let checkDate = dailyActivity.has(today) ? today : yesterday;

        // Only count streak if there's activity today or yesterday
        if (dailyActivity.has(today) || dailyActivity.has(yesterday)) {
            while (dailyActivity.has(checkDate)) {
                currentStreak++;
                const prevDate = new Date(
                    new Date(checkDate).getTime() - 24 * 60 * 60 * 1000
                )
                    .toISOString()
                    .split("T")[0];
                checkDate = prevDate;
            }
        }

        // Find longest streak in the data
        let longestStreak = 0;
        let tempStreak = 0;
        const sortedDates = Array.from(dailyActivity.keys()).sort();

        for (let i = 0; i < sortedDates.length; i++) {
            if (i === 0) {
                tempStreak = 1;
            } else {
                const prevDate = new Date(sortedDates[i - 1]);
                const currDate = new Date(sortedDates[i]);
                const diffDays = Math.round(
                    (currDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000)
                );
                if (diffDays === 1) {
                    tempStreak++;
                } else {
                    longestStreak = Math.max(longestStreak, tempStreak);
                    tempStreak = 1;
                }
            }
        }
        longestStreak = Math.max(longestStreak, tempStreak);

        // Find peak coding hour
        const peakHour = hourlyActivity.indexOf(Math.max(...hourlyActivity));

        // Calculate hourly data as percentages for visualization
        const maxHourlyCount = Math.max(...hourlyActivity);
        const hourlyData = hourlyActivity.map((count, hour) => ({
            hour,
            count,
            percentage: maxHourlyCount > 0 ? Math.round((count / maxHourlyCount) * 100) : 0,
        }));

        return {
            activityData,
            hourlyData,
            currentStreak,
            longestStreak,
            peakHour,
            totalCommits: recentCommits.length,
            activeDays: dailyActivity.size,
            avgCommitsPerActiveDay:
                dailyActivity.size > 0
                    ? Math.round((recentCommits.length / dailyActivity.size) * 10) / 10
                    : 0,
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
