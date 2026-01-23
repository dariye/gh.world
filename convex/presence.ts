import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Heartbeat mutation - called every 10 seconds by each client
export const heartbeat = mutation({
    args: {
        sessionId: v.string(),
        region: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Check if this session already has a presence record
        const existing = await ctx.db
            .query("presence")
            .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
            .first();

        if (existing) {
            // Update lastSeen time
            await ctx.db.patch(existing._id, {
                lastSeen: Date.now(),
                region: args.region,
            });
        } else {
            // Create new presence record
            await ctx.db.insert("presence", {
                sessionId: args.sessionId,
                region: args.region,
                lastSeen: Date.now(),
            });
        }
    },
});

// Get active viewers (last 30 seconds)
export const getViewers = query({
    handler: async (ctx) => {
        const cutoff = Date.now() - 30000; // 30 seconds ago

        const viewers = await ctx.db
            .query("presence")
            .withIndex("by_lastSeen", (q) => q.gt("lastSeen", cutoff))
            .collect();

        // Aggregate by region
        const byRegion: Record<string, number> = {};
        for (const viewer of viewers) {
            const region = viewer.region || "unknown";
            byRegion[region] = (byRegion[region] || 0) + 1;
        }

        return {
            total: viewers.length,
            byRegion,
        };
    },
});
