import { mutation } from "./_generated/server";

export const seedCommits = mutation({
    args: {},
    handler: async (ctx) => {
        const dummyCommits = [
            {
                sha: "dummy1",
                author: "paul",
                message: "Hello from San Francisco",
                repo: "user/repo",
                timestamp: Date.now(),
                coordinates: [37.7749, -122.4194],
                authorUrl: "https://github.com/paul",
                language: "TypeScript",
            },
            {
                sha: "dummy2",
                author: "alice",
                message: "Refactoring in London",
                repo: "user/repo2",
                timestamp: Date.now() - 3600000,
                coordinates: [51.5074, -0.1278],
                authorUrl: "https://github.com/alice",
                language: "Python",
            },
            {
                sha: "dummy3",
                author: "bob",
                message: "Bugfix in Tokyo",
                repo: "user/repo3",
                timestamp: Date.now() - 7200000,
                coordinates: [35.6762, 139.6503],
                authorUrl: "https://github.com/bob",
                language: "Java",
            },
        ];

        for (const commit of dummyCommits) {
            await ctx.db.insert("commits", commit);
        }
    },
});
