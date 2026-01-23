import { internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";

export const getRecentCommits = query({
    args: {
        startTime: v.optional(v.number()),
        endTime: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // Use proper range query with both bounds in index for efficiency
        if (args.startTime !== undefined && args.endTime !== undefined) {
            return await ctx.db
                .query("commits")
                .withIndex("by_timestamp", (q) =>
                    q.gte("timestamp", args.startTime!).lt("timestamp", args.endTime!)
                )
                .order("desc")
                .take(5000);
        }

        if (args.startTime !== undefined) {
            return await ctx.db
                .query("commits")
                .withIndex("by_timestamp", (q) => q.gte("timestamp", args.startTime!))
                .order("desc")
                .take(5000);
        }

        return await ctx.db.query("commits").order("desc").take(5000);
    },
});

export const getLiveCommits = query({
    args: {
        minLat: v.optional(v.number()),
        maxLat: v.optional(v.number()),
        minLng: v.optional(v.number()),
        maxLng: v.optional(v.number()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 5000;
        const now = Date.now();
        const fiveMinutesAgo = now - 5 * 60 * 1000;

        // Query only last 5 minutes of commits
        // Reactivity: This query will re-run whenever new commits are added within this window
        const query = ctx.db.query("commits")
            .withIndex("by_timestamp", (q) => q.gt("timestamp", fiveMinutesAgo));

        const commits = [];
        // Scan limit isn't strictly needed if we trust volume in 5 mins is reasonable,
        // but safe to keep.
        const results = await query.order("desc").take(10000);

        for (const commit of results) {
            if (commits.length >= limit) break;

            const [lat, lng] = commit.coordinates;
            const hasCoords = commit.coordinates.length === 2;

            if (!hasCoords) {
                // Return unlocated commits if no bounds provided (for pulses)
                if (args.minLat === undefined) {
                    commits.push(commit);
                }
                continue;
            }

            // Spatial check
            if (args.minLat !== undefined && (lat < args.minLat || lat > args.maxLat!)) continue;

            if (args.minLng !== undefined && args.maxLng !== undefined) {
                if (args.minLng <= args.maxLng) {
                    if (lng < args.minLng || lng > args.maxLng) continue;
                } else {
                    if (lng < args.minLng && lng > args.maxLng) continue;
                }
            }

            commits.push(commit);
        }

        return commits;
    },
});

export const getCommitCount = query({
    args: {
        startTime: v.optional(v.number()),
        endTime: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let query;

        if (args.startTime !== undefined && args.endTime !== undefined) {
            query = ctx.db.query("commits").withIndex("by_timestamp", (q) =>
                q.gte("timestamp", args.startTime!).lt("timestamp", args.endTime!)
            );
        } else if (args.startTime !== undefined) {
            query = ctx.db.query("commits").withIndex("by_timestamp", (q) =>
                q.gte("timestamp", args.startTime!)
            );
        } else {
            query = ctx.db.query("commits").withIndex("by_timestamp");
        }

        // We use collect().length for now.
        // For very large datasets, an aggregate count index/table would be better,
        // but for <100k docs this is okay.
        const results = await query.collect();
        return results.length;
    },
});

export const getLiveCommitCount = query({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const fiveMinutesAgo = now - 5 * 60 * 1000;
        const results = await ctx.db.query("commits")
            .withIndex("by_timestamp", (q) => q.gt("timestamp", fiveMinutesAgo))
            .collect();
        return results.length;
    },
});


export const getSpatialCommits = query({
    args: {
        startTime: v.optional(v.number()),
        endTime: v.optional(v.number()),
        minLat: v.optional(v.number()),
        maxLat: v.optional(v.number()),
        minLng: v.optional(v.number()),
        maxLng: v.optional(v.number()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 5000;
        const scanLimit = 20000; // Increased scan limit

        let query;

        if (args.startTime !== undefined && args.endTime !== undefined) {
            query = ctx.db.query("commits").withIndex("by_timestamp", (q) =>
                q.gte("timestamp", args.startTime!).lt("timestamp", args.endTime!)
            );
        } else if (args.startTime !== undefined) {
            query = ctx.db.query("commits").withIndex("by_timestamp", (q) =>
                q.gte("timestamp", args.startTime!)
            );
        } else {
            query = ctx.db.query("commits").withIndex("by_timestamp");
        }

        const commits = [];
        const results = await query.order("desc").take(scanLimit);

        for (const commit of results) {
            if (commits.length >= limit) break;

            const [lat, lng] = commit.coordinates;
            const hasCoords = commit.coordinates.length === 2;

            if (!hasCoords) {
                // Return unlocated commits if no bounds provided (for pulses)
                if (args.minLat === undefined) {
                    commits.push(commit);
                }
                continue;
            }

            // Spatial check
            if (args.minLat !== undefined && (lat < args.minLat || lat > args.maxLat!)) continue;

            // Longitude can wrap around, but for simplicity we'll handle standard bounds first
            // If minLng > maxLng, it means the viewport crosses the date line
            if (args.minLng !== undefined && args.maxLng !== undefined) {
                if (args.minLng <= args.maxLng) {
                    if (lng < args.minLng || lng > args.maxLng) continue;
                } else {
                    // Span crosses -180/180
                    if (lng < args.minLng && lng > args.maxLng) continue;
                }
            }

            commits.push(commit);
        }

        return commits;
    },
});


export const insertCommits = internalMutation({
    args: {
        commits: v.array(v.object({
            sha: v.string(),
            author: v.string(),
            message: v.string(),
            repo: v.string(),
            timestamp: v.number(),
            coordinates: v.array(v.number()),
            authorUrl: v.string(),
            language: v.union(v.string(), v.null()),
        })),
    },
    handler: async (ctx, args) => {
        for (const commit of args.commits) {
            const existing = await ctx.db
                .query("commits")
                .withIndex("by_sha", (q) => q.eq("sha", commit.sha))
                .first();

            if (!existing) {
                await ctx.db.insert("commits", commit);
            }
        }
    },
});

export const getCachedLocation = internalQuery({
    args: { username: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("locationCache")
            .withIndex("by_username", (q) => q.eq("username", args.username))
            .first();
    },
});

export const cacheLocation = internalMutation({
    args: {
        username: v.string(),
        location: v.string(),
        coordinates: v.array(v.number()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("locationCache")
            .withIndex("by_username", (q) => q.eq("username", args.username))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                location: args.location,
                coordinates: args.coordinates,
                cachedAt: Date.now(),
            });
        } else {
            await ctx.db.insert("locationCache", {
                username: args.username,
                location: args.location,
                coordinates: args.coordinates,
                cachedAt: Date.now(),
            });
        }
    },
});

export const getOldestCommitTimestamp = query({
    args: {},
    handler: async (ctx) => {
        const oldest = await ctx.db
            .query("commits")
            .withIndex("by_timestamp")
            .order("asc")
            .first();
        return oldest?.timestamp ?? Date.now() - 24 * 60 * 60 * 1000;
    },
});

export const getCachedRepoLanguage = internalQuery({
    args: { repo: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("repoLanguageCache")
            .withIndex("by_repo", (q) => q.eq("repo", args.repo))
            .first();
    },
});

export const cacheRepoLanguage = internalMutation({
    args: {
        repo: v.string(),
        language: v.union(v.string(), v.null()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("repoLanguageCache")
            .withIndex("by_repo", (q) => q.eq("repo", args.repo))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                language: args.language,
                cachedAt: Date.now(),
            });
        } else {
            await ctx.db.insert("repoLanguageCache", {
                repo: args.repo,
                language: args.language,
                cachedAt: Date.now(),
            });
        }
    },
});

/**
 * Delete commits older than 1 hour.
 * Called by cron every 5 minutes to stay within Convex free tier limits.
 */
export const deleteOldCommits = internalMutation({
    args: {},
    handler: async (ctx) => {
        const oneHourAgo = Date.now() - 60 * 60 * 1000;

        // Query commits older than 1 hour
        const oldCommits = await ctx.db
            .query("commits")
            .withIndex("by_timestamp", (q) => q.lt("timestamp", oneHourAgo))
            .take(500); // Batch delete to avoid timeout

        let deleted = 0;
        for (const commit of oldCommits) {
            await ctx.db.delete(commit._id);
            deleted++;
        }

        if (deleted > 0) {
            console.log(`Deleted ${deleted} commits older than 1 hour`);
        }

        return { deleted };
    },
});
