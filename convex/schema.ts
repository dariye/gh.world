import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

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
    .index("by_timestamp", ["timestamp"])
    .index("by_author", ["author"]),

  locationCache: defineTable({
    username: v.string(),
    location: v.string(),
    coordinates: v.array(v.number()),
    cachedAt: v.number(),
  }).index("by_username", ["username"]),

  monthlyStats: defineTable({
    month: v.string(), // "2026-01"
    totalCommits: v.number(),
    uniqueContributors: v.number(),
    byLanguage: v.record(v.string(), v.number()),
    geolocationRate: v.number(),
    updatedAt: v.number(),
  }).index("by_month", ["month"]),

  dailyStats: defineTable({
    date: v.string(), // "2026-01-21"
    totalCommits: v.number(),
    uniqueContributors: v.number(),
    byLanguage: v.record(v.string(), v.number()),
    updatedAt: v.number(),
  }).index("by_date", ["date"]),

  repoLanguageCache: defineTable({
    repo: v.string(),
    language: v.union(v.string(), v.null()),
    cachedAt: v.number(),
  }).index("by_repo", ["repo"]),

  presence: defineTable({
    sessionId: v.string(),
    region: v.optional(v.string()),
    lastSeen: v.number(),
  })
    .index("by_sessionId", ["sessionId"])
    .index("by_lastSeen", ["lastSeen"]),
});
