import { ActionCtx, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getRecentCommits = query({
    args: {
        startTime: v.optional(v.number()),
        endTime: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let results;
        if (args.startTime !== undefined) {
            results = await ctx.db
                .query("commits")
                .withIndex("by_timestamp", (q) => q.gte("timestamp", args.startTime!))
                .order("desc")
                .take(1000);
        } else {
            results = await ctx.db.query("commits").order("desc").take(1000);
        }

        if (args.endTime !== undefined) {
            return results.filter(c => c.timestamp <= args.endTime!);
        }

        return results;
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
        const oldest = await ctx.db.query("commits").order("asc").first();
        return oldest?.timestamp ?? Date.now() - 24 * 60 * 60 * 1000;
    },
});
