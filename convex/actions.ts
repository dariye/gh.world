import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Octokit } from "@octokit/rest";
import { throttling } from "@octokit/plugin-throttling";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

console.log("GITHUB_TOKEN", GITHUB_TOKEN);

// Configure Octokit with throttling plugin
const ThrottledOctokit = Octokit.plugin(throttling);

const octokit = new ThrottledOctokit({
    auth: GITHUB_TOKEN,
    userAgent: "ghworld-app",
    throttle: {
        onRateLimit: (retryAfter, options, octokit, retryCount) => {
            console.warn(
                `Rate limit hit for ${options.method} ${options.url}. ` +
                `Retry #${retryCount}, waiting ${retryAfter}s`
            );

            // Retry first 2 times, then give up
            if (retryCount < 2) {
                console.log(`Retrying after ${retryAfter}s...`);
                return true;
            }

            console.error("Rate limit retry exhausted, skipping request");
            return false;
        },
        onSecondaryRateLimit: (retryAfter, options, octokit, retryCount) => {
            console.warn(
                `Secondary rate limit hit for ${options.method} ${options.url}. ` +
                `Waiting ${retryAfter}s`
            );

            // Always retry for secondary rate limits (abuse detection)
            if (retryCount < 2) {
                return true;
            }
            return false;
        },
    },
});

export const pollPublicEvents = internalAction({
    args: {},
    handler: async (ctx) => {
        try {
            // Fetch public events using Octokit with automatic throttling
            const { data: events, headers } = await octokit.rest.activity.listPublicEvents({
                per_page: 100,
            });

            // Check Rate Limit (for logging purposes - throttling plugin handles actual limiting)
            const remaining = headers["x-ratelimit-remaining"];
            const shouldEnrich = remaining ? parseInt(remaining) > 500 : true;

            if (remaining && parseInt(remaining) < 1000) {
                console.warn(`GitHub API Rate Limit low: ${remaining} remaining.`);
            }
            const newCommits = [];
            let processedPushEvents = 0;

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
                let coordinates = await getCoordinatesForUser(ctx, actor);

                // If no location, we still store it for "atmospheric pulses"
                // Schema requires array of numbers, so we use empty array for no location
                if (!coordinates) {
                    coordinates = [];
                }

                let message = "Commit activity";
                let language = null;

                // 2. Try to get message from payload
                if (payload.commits && Array.isArray(payload.commits)) {
                    const commitInfo = payload.commits.find((c: any) => c.sha === sha);
                    if (commitInfo) {
                        message = commitInfo.message.substring(0, 200);
                    }
                }

                // 3. Enrich for Language if safe to do so
                // We enrich even if no location, so we can color the pulse correctly
                if (shouldEnrich) {
                    try {
                        const cachedLang: any = await ctx.runQuery(internal.commits.getCachedRepoLanguage, { repo });
                        if (cachedLang) {
                            language = cachedLang.language;
                        } else {
                            // Use Octokit to fetch repo data with automatic throttling
                            const [owner, repoName] = repo.split('/');
                            const { data: repoData } = await octokit.rest.repos.get({
                                owner,
                                repo: repoName,
                            });

                            language = repoData.language;
                            await ctx.runMutation(internal.commits.cacheRepoLanguage, { repo, language });
                        }
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (_e) {
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
                    language,
                });
            }

            if (newCommits.length > 0) {
                await ctx.runMutation(internal.commits.insertCommits, { commits: newCommits });
            }

            console.log(`Poll results: ${newCommits.length} stored. ${processedPushEvents} push events. Limit remaining: ${remaining}`);

            return {
                newCommitsCount: newCommits.length,
                totalEventsProcessed: events.length,
                skippedRateLimit: false,
            } as const;

        } catch (error) {
            console.error("Poll failed:", error);
            return {
                newCommitsCount: 0,
                totalEventsProcessed: 0,
                error: String(error),
                skippedRateLimit: false,
            } as const;
        }
    },
});

export const validateGitHubToken = internalAction({
    args: {},
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handler: async (_ctx) => {
        try {
            const { data } = await octokit.rest.rateLimit.get();
            const limit = data.resources.core.limit;
            const authenticated = limit === 5000;

            console.log(
                authenticated
                    ? `✓ GitHub Token: Authenticated (${limit}/hr)`
                    : `✗ WARNING: Unauthenticated (${limit}/hr) - Set GITHUB_TOKEN!`
            );

            return {
                valid: true,
                authenticated,
                remaining: data.resources.core.remaining,
                resetAt: data.resources.core.reset * 1000,
            };
        } catch (error) {
            console.error("Token validation failed:", error);
            return { valid: false, authenticated: false };
        }
    },
});

async function getCoordinatesForUser(ctx: any, username: string): Promise<number[] | null> {
    // Check cache first
    const cached = await ctx.runQuery(internal.commits.getCachedLocation, { username });
    if (cached) {
        return cached.coordinates;
    }

    // Fetch user profile for location using Octokit with automatic throttling
    try {
        const { data: userData } = await octokit.rest.users.getByUsername({
            username,
        });

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
