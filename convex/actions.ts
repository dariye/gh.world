import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export const pollPublicEvents = action({
    args: {},
    handler: async (ctx) => {
        const response = await fetch("https://api.github.com/events?per_page=100", {
            headers: {
                ...(GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {}),
                "User-Agent": "ghworld-app",
            },
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`GitHub API error: ${response.status} ${error}`);
        }

        const events = await response.json();
        const newCommits = [];

        for (const event of events) {
            if (event.type !== "PushEvent") continue;

            const repo = event.repo.name;
            const actor = event.actor.login;
            const actorUrl = `https://github.com/${actor}`;
            const payload = event.payload;

            if (payload.commits && payload.commits.length > 0) {
                for (const commit of payload.commits) {
                    const sha = commit.sha;
                    const message = commit.message.substring(0, 200);
                    const timestamp = new Date(event.created_at).getTime();

                    // Get coordinates
                    const coordinates = await getCoordinatesForUser(ctx, actor);

                    if (coordinates) {
                        newCommits.push({
                            sha,
                            author: actor,
                            message,
                            repo,
                            timestamp,
                            coordinates,
                            authorUrl: actorUrl,
                        });
                    }
                }
            }
        }

        if (newCommits.length > 0) {
            await ctx.runMutation(internal.commits.insertCommits, { commits: newCommits });
        }

        return {
            newCommitsCount: newCommits.length,
            totalEventsProcessed: events.length,
        };
    },
});

async function getCoordinatesForUser(ctx: any, username: string): Promise<number[] | null> {
    // Check cache first
    const cached = await ctx.runQuery(internal.commits.getCachedLocation, { username });
    if (cached && Date.now() - cached.cachedAt < 30 * 24 * 60 * 60 * 1000) {
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
