import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Update monthly stats every 10 minutes
// ~4,320 calls/month, well within Convex free tier limit (25K)
crons.interval(
    "update monthly stats",
    { minutes: 10 },
    internal.stats.updateMonthlyStats
);

crons.interval(
    "update daily stats",
    { minutes: 10 },
    internal.stats.updateDailyStats,
    {}
);

crons.interval(
    "poll github events",
    { minutes: 1 },
    (internal as any).actions.pollPublicEvents
);

export default crons;
