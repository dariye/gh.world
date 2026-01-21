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
