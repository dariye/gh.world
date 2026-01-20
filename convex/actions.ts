import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export const pollPublicEvents = action({
    args: {},
    handler: async (ctx) => {
        try {
            const response = await fetch("https://api.github.com/events?per_page=100", {
                headers: {
                    ...(GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {}),
                    "User-Agent": "ghworld-app",
                },
            });

            if (!response.ok) {
                if (response.status === 403 || response.status === 429) {
                    console.warn("GitHub API rate limit exceeded. Skipping poll.");
                    return { newCommitsCount: 0, totalEventsProcessed: 0, skippedRateLimit: true };
                }
                const error = await response.text();
                throw new Error(`GitHub API error: ${response.status} ${error}`);
            }

            // Check Rate Limit
            const remaining = response.headers.get("x-ratelimit-remaining");
            const shouldEnrich = remaining ? parseInt(remaining) > 500 : true;

            if (remaining && parseInt(remaining) < 1000) {
                console.warn(`GitHub API Rate Limit low: ${remaining} remaining.`);
            }

            const events = await response.json();
            const newCommits = [];
            let processedPushEvents = 0;
            let skippedNoLocation = 0;

            for (const event of events) {
                if (event.type !== "PushEvent") continue;
                processedPushEvents++;

                const repo = event.repo.name;
                const actor = event.actor.login;
                const actorUrl = `https://github.com/${actor}`;
                const payload = event.payload;
                const sha = payload.head;

                if (!sha) continue;

                // 1. Get coordinates (Real or Fallback)
                const coordinates = await getCoordinatesForUser(ctx, actor);

                if (coordinates) {
                    let message = "Commit activity";

                    // 2. Enrich if safe to do so
                    if (shouldEnrich) {
                        try {
                            const commitResponse = await fetch(`https://api.github.com/repos/${repo}/commits/${sha}`, {
                                headers: {
                                    ...(GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {}),
                                    "User-Agent": "ghworld-app",
                                },
                            });

                            if (commitResponse.ok) {
                                const commitData = await commitResponse.json();
                                message = commitData.commit.message.substring(0, 200);
                            }
                        } catch (e) {
                            // Ignore enrichment errors
                        }
                    }

                    newCommits.push({
                        sha,
                        author: actor,
                        message,
                        repo,
                        timestamp: new Date(event.created_at).getTime(),
                        coordinates,
                        authorUrl: actorUrl,
                    });
                }
            }

            if (newCommits.length > 0) {
                await ctx.runMutation(internal.commits.insertCommits, { commits: newCommits });
            }

            console.log(`Poll results: ${newCommits.length} stored. ${processedPushEvents} push events. Limit remaining: ${remaining}`);

            return {
                newCommitsCount: newCommits.length,
                totalEventsProcessed: events.length,
            };

        } catch (error) {
            console.error("Poll failed:", error);
            return { error: String(error) };
        }
    },
});

async function getCoordinatesForUser(ctx: any, username: string): Promise<number[] | null> {
    // Check cache first
    const cached = await ctx.runQuery(internal.commits.getCachedLocation, { username });
    if (cached) {
        return cached.coordinates;
    }

    // Fetch user profile for location
    try {
        const userResponse = await fetch(`https://api.github.com/users/${username}`, {
            headers: {
                ...(GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {}),
                "User-Agent": "ghworld-app",
            },
        });

        if (userResponse.ok) {
            const userData = await userResponse.json();
            const location = userData.location;

            if (location) {
                const coords = await geocodeLocation(location);
                if (coords) {
                    // Cache successful geocode
                    await ctx.runMutation(internal.commits.cacheLocation, {
                        username,
                        location,
                        coordinates: coords,
                    });
                    return coords;
                }
            }
        }
    } catch (e) {
        console.error(`Error fetching user profile for ${username}:`, e);
    }

    // Default coordinates (e.g., center of the ocean or null)
    // To avoid cluttering the center of the world, we return null if unknown
    return null;
}

async function geocodeLocation(location: string): Promise<number[] | null> {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
            {
                headers: {
                    "User-Agent": "ghworld-app",
                },
            }
        );
        const results = await response.json();
        if (results && results.length > 0) {
            return [parseFloat(results[0].lat), parseFloat(results[0].lon)];
        }
    } catch (e) {
        console.error(`Geocoding error for ${location}:`, e);
    }
    return null;
}
