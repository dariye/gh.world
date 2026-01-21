import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  commits: defineTable({
    sha: v.string(),
    author: v.string(),
    message: v.string(),
    repo: v.string(),
    timestamp: v.number(),
    coordinates: v.array(v.number()),
    authorUrl: v.string(),
    language: v.optional(v.union(v.string(), v.null())),
  })
    .index("by_sha", ["sha"])
    .index("by_timestamp", ["timestamp"]),

  locationCache: defineTable({
    username: v.string(),
    location: v.string(),
    coordinates: v.array(v.number()),
    cachedAt: v.number(),
  }).index("by_username", ["username"]),
});
