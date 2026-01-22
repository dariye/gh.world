import { internalMutation, internalQuery, query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get stats for a specific month.
 */
export const getMonthlyStats = query({
    args: { month: v.string() },
    returns: v.union(
        v.object({
            _id: v.id("monthlyStats"),
            _creationTime: v.number(),
            month: v.string(),
            totalCommits: v.number(),
            uniqueContributors: v.number(),
            byLanguage: v.record(v.string(), v.number()),
            geolocationRate: v.number(),
            updatedAt: v.number(),
        }),
        v.null()
    ),
    handler: async (ctx, args) => {
        return await ctx.db
            .query("monthlyStats")
            .withIndex("by_month", (q) => q.eq("month", args.month))
            .first();
    },
});

/**
 * Get current month stats (convenience query).
 */
export const getCurrentMonthStats = query({
    args: {},
    returns: v.union(
        v.object({
            _id: v.id("monthlyStats"),
            _creationTime: v.number(),
            month: v.string(),
            totalCommits: v.number(),
            uniqueContributors: v.number(),
            byLanguage: v.record(v.string(), v.number()),
            geolocationRate: v.number(),
            updatedAt: v.number(),
        }),
        v.null()
    ),
    handler: async (ctx) => {
        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        return await ctx.db
            .query("monthlyStats")
            .withIndex("by_month", (q) => q.eq("month", month))
            .first();
    },
});

/**
 * Internal mutation to update monthly stats.
 * Called by cron every 10 minutes.
 */
export const updateMonthlyStats = internalMutation({
    args: {},
    returns: v.null(),
    handler: async (ctx) => {
        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

        // Get start of month timestamp
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();

        // Query all commits for this month
        const commits = await ctx.db
            .query("commits")
            .withIndex("by_timestamp", (q) => q.gte("timestamp", startOfMonth))
            .collect();

        // Filter to only this month's commits
        const monthCommits = commits.filter((c) => c.timestamp < endOfMonth);

        // Calculate stats
        const totalCommits = monthCommits.length;
        const uniqueContributors = new Set(monthCommits.map((c) => c.author)).size;

        // Language breakdown
        const byLanguage: Record<string, number> = {};
        for (const commit of monthCommits) {
            const lang = commit.language || "Other";
            byLanguage[lang] = (byLanguage[lang] || 0) + 1;
        }

        // Geolocation rate (commits with non-empty coordinates)
        const withLocation = monthCommits.filter(
            (c) => c.coordinates && c.coordinates.length === 2
        ).length;
        const geolocationRate = totalCommits > 0 ? withLocation / totalCommits : 0;

        // Upsert stats
        const existing = await ctx.db
            .query("monthlyStats")
            .withIndex("by_month", (q) => q.eq("month", month))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                totalCommits,
                uniqueContributors,
                byLanguage,
                geolocationRate,
                updatedAt: Date.now(),
            });
        } else {
            await ctx.db.insert("monthlyStats", {
                month,
                totalCommits,
                uniqueContributors,
                byLanguage,
                geolocationRate,
                updatedAt: Date.now(),
            });
        }

        console.log(
            `Stats updated for ${month}: ${totalCommits} commits, ${uniqueContributors} contributors`
        );
        return null;
    },
});

/**
 * Get historical daily stats for the last N days.
 */
export const getHistoricalStats = query({
    args: { days: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const days = args.days ?? 7;
        return await ctx.db
            .query("dailyStats")
            .order("desc")
            .take(days);
    },
});

/**
 * Internal mutation to update daily stats.
 * Called by cron or manually.
 */
export const updateDailyStats = internalMutation({
    args: { date: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const now = new Date();
        const dateStr = args.date || now.toISOString().split("T")[0];
        const [year, month, day] = dateStr.split("-").map(Number);

        const startOfDay = new Date(year, month - 1, day).getTime();
        const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

        const commits = await ctx.db
            .query("commits")
            .withIndex("by_timestamp", (q) => q.gte("timestamp", startOfDay).lt("timestamp", endOfDay))
            .collect();

        const totalCommits = commits.length;
        const uniqueContributors = new Set(commits.map((c) => c.author)).size;
        const byLanguage: Record<string, number> = {};
        for (const commit of commits) {
            const lang = commit.language || "Other";
            byLanguage[lang] = (byLanguage[lang] || 0) + 1;
        }

        const existing = await ctx.db
            .query("dailyStats")
            .withIndex("by_date", (q) => q.eq("date", dateStr))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                totalCommits,
                uniqueContributors,
                byLanguage,
                updatedAt: Date.now(),
            });
        } else {
            await ctx.db.insert("dailyStats", {
                date: dateStr,
                totalCommits,
                uniqueContributors,
                byLanguage,
                updatedAt: Date.now(),
            });
        }
    },
});

/**
 * Get hourly activity distribution for the last 24 hours.
 * Shows when the world is coding (UTC hours).
 */
export const getHourlyActivity = query({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

        const commits = await ctx.db
            .query("commits")
            .withIndex("by_timestamp", (q) => q.gte("timestamp", twentyFourHoursAgo))
            .collect();

        // Group by hour of day (UTC)
        const hourlyData: Record<number, number> = {};
        for (let i = 0; i < 24; i++) {
            hourlyData[i] = 0;
        }

        for (const commit of commits) {
            const hour = new Date(commit.timestamp).getUTCHours();
            hourlyData[hour]++;
        }

        // Return as array for charting
        return Object.entries(hourlyData).map(([hour, commits]) => ({
            hour: parseInt(hour),
            label: `${hour.padStart(2, "0")}:00`,
            commits,
        }));
    },
});

/**
 * Get activity by geographic region based on coordinates.
 */
export const getRegionalActivity = query({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

        const commits = await ctx.db
            .query("commits")
            .withIndex("by_timestamp", (q) => q.gte("timestamp", sevenDaysAgo))
            .collect();

        // Define broad regions by latitude/longitude ranges
        const regions: Record<string, { count: number; languages: Record<string, number> }> = {
            "North America": { count: 0, languages: {} },
            "South America": { count: 0, languages: {} },
            "Europe": { count: 0, languages: {} },
            "Africa": { count: 0, languages: {} },
            "Asia": { count: 0, languages: {} },
            "Oceania": { count: 0, languages: {} },
            "Unknown": { count: 0, languages: {} },
        };

        const getRegion = (lat: number, lng: number): string => {
            // Simplified region detection based on coordinates
            if (lat >= 15 && lat <= 72 && lng >= -170 && lng <= -50) return "North America";
            if (lat >= -60 && lat < 15 && lng >= -90 && lng <= -30) return "South America";
            if (lat >= 35 && lat <= 72 && lng >= -25 && lng <= 60) return "Europe";
            if (lat >= -40 && lat < 35 && lng >= -20 && lng <= 55) return "Africa";
            if (lat >= -10 && lat <= 80 && lng > 55 && lng <= 180) return "Asia";
            if (lat >= -10 && lat <= 80 && lng >= -180 && lng < -170) return "Asia"; // Eastern Russia
            if (lat >= -50 && lat < -10 && lng >= 100 && lng <= 180) return "Oceania";
            if (lat >= -50 && lat <= 0 && lng >= -180 && lng <= -100) return "Oceania"; // Pacific islands
            return "Unknown";
        };

        for (const commit of commits) {
            const [lat, lng] = commit.coordinates;
            const hasCoords = commit.coordinates.length === 2 && lat !== 0 && lng !== 0;

            const region = hasCoords ? getRegion(lat, lng) : "Unknown";
            regions[region].count++;

            const lang = commit.language || "Other";
            regions[region].languages[lang] = (regions[region].languages[lang] || 0) + 1;
        }

        // Convert to array and sort by count
        return Object.entries(regions)
            .filter(([name]) => name !== "Unknown")
            .map(([name, data]) => ({
                region: name,
                commits: data.count,
                topLanguage: Object.entries(data.languages)
                    .sort(([, a], [, b]) => b - a)[0]?.[0] || "Unknown",
            }))
            .sort((a, b) => b.commits - a.commits);
    },
});

/**
 * Get language trends over the past 7 days.
 * Shows growth/decline of each language.
 */
export const getLanguageTrends = query({
    args: {},
    handler: async (ctx) => {
        const historicalStats = await ctx.db
            .query("dailyStats")
            .order("desc")
            .take(7);

        if (historicalStats.length < 2) {
            return [];
        }

        // Get all unique languages across all days
        const allLanguages = new Set<string>();
        for (const day of historicalStats) {
            Object.keys(day.byLanguage).forEach(lang => allLanguages.add(lang));
        }

        // Build trend data for each language
        const trends: Array<{
            language: string;
            data: Array<{ date: string; commits: number }>;
            trend: "up" | "down" | "stable";
            change: number;
        }> = [];

        for (const language of allLanguages) {
            const data = [...historicalStats].reverse().map(day => ({
                date: day.date.split("-").slice(1).join("/"),
                commits: day.byLanguage[language] || 0,
            }));

            // Calculate trend (compare first half to second half)
            const firstHalf = data.slice(0, Math.floor(data.length / 2));
            const secondHalf = data.slice(Math.floor(data.length / 2));

            const firstAvg = firstHalf.reduce((sum, d) => sum + d.commits, 0) / firstHalf.length;
            const secondAvg = secondHalf.reduce((sum, d) => sum + d.commits, 0) / secondHalf.length;

            const change = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
            const trend = change > 5 ? "up" : change < -5 ? "down" : "stable";

            const total = data.reduce((sum, d) => sum + d.commits, 0);
            if (total > 0) {
                trends.push({ language, data, trend, change: Math.round(change) });
            }
        }

        // Sort by total commits and take top 8
        return trends
            .sort((a, b) => {
                const aTotal = a.data.reduce((sum, d) => sum + d.commits, 0);
                const bTotal = b.data.reduce((sum, d) => sum + d.commits, 0);
                return bTotal - aTotal;
            })
            .slice(0, 8);
    },
});

/**
 * Get peak activity times by region (simplified).
 * Returns when each major region is most active.
 */
export const getPeakActivityByRegion = query({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

        const commits = await ctx.db
            .query("commits")
            .withIndex("by_timestamp", (q) => q.gte("timestamp", twentyFourHoursAgo))
            .collect();

        // Track hourly activity by rough timezone bands
        // West (-120 to -60): Americas
        // Mid (-30 to +30): Europe/Africa
        // East (+60 to +120): Asia/Pacific
        const bands: Record<string, Record<number, number>> = {
            "Americas": {},
            "Europe/Africa": {},
            "Asia/Pacific": {},
        };

        for (let i = 0; i < 24; i++) {
            bands["Americas"][i] = 0;
            bands["Europe/Africa"][i] = 0;
            bands["Asia/Pacific"][i] = 0;
        }

        for (const commit of commits) {
            const [lat, lng] = commit.coordinates;
            if (commit.coordinates.length !== 2 || (lat === 0 && lng === 0)) continue;

            const hour = new Date(commit.timestamp).getUTCHours();

            if (lng >= -170 && lng < -30) {
                bands["Americas"][hour]++;
            } else if (lng >= -30 && lng < 60) {
                bands["Europe/Africa"][hour]++;
            } else {
                bands["Asia/Pacific"][hour]++;
            }
        }

        // Find peak hour for each band
        return Object.entries(bands).map(([band, hourly]) => {
            const peakHour = Object.entries(hourly)
                .sort(([, a], [, b]) => b - a)[0];

            const totalCommits = Object.values(hourly).reduce((a, b) => a + b, 0);

            return {
                region: band,
                peakHourUTC: parseInt(peakHour?.[0] || "0"),
                peakLabel: `${(peakHour?.[0] || "0").padStart(2, "0")}:00 UTC`,
                totalCommits,
                hourlyData: Object.entries(hourly).map(([h, c]) => ({
                    hour: parseInt(h),
                    commits: c,
                })),
            };
        });
    },
});
