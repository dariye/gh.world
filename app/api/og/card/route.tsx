import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { LANGUAGE_COLORS } from "@/lib/colors";

export const runtime = "edge";

// Helper to get language color
function getLanguageColor(language: string): string {
    return LANGUAGE_COLORS[language] || LANGUAGE_COLORS.Other;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username") || "developer";
    const theme = searchParams.get("theme") || "dark";
    const isDark = theme === "dark";

    // In production, we'd fetch real data from Convex
    // For OG image, we'll use query params or defaults
    const commitCount = searchParams.get("commits") || "1,247";
    const percentileRank = searchParams.get("rank") || "3";
    const languages = (searchParams.get("languages") || "TypeScript,Go,Python").split(",");
    const location = searchParams.get("location") || null;

    // Color scheme
    const bgColor = isDark ? "#09090b" : "#ffffff";
    const borderColor = isDark ? "#27272a" : "#e4e4e7";
    const textPrimary = isDark ? "#fafafa" : "#18181b";
    const textSecondary = isDark ? "#a1a1aa" : "#71717a";
    const textMuted = isDark ? "#52525b" : "#a1a1aa";

    const currentYear = new Date().getFullYear();

    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isDark ? "#18181b" : "#f4f4f5",
                    padding: 40,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        width: 500,
                        backgroundColor: bgColor,
                        borderRadius: 16,
                        border: `1px solid ${borderColor}`,
                        padding: 32,
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 16,
                            color: textMuted,
                            fontSize: 14,
                        }}
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                        <span>gh.world</span>
                    </div>

                    {/* Username */}
                    <div
                        style={{
                            fontSize: 32,
                            fontWeight: 700,
                            color: textPrimary,
                            marginBottom: 16,
                        }}
                    >
                        @{username}
                    </div>

                    {/* Divider */}
                    <div
                        style={{
                            height: 1,
                            backgroundColor: borderColor,
                            marginBottom: 20,
                        }}
                    />

                    {/* Stats */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                            marginBottom: 24,
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                            <span
                                style={{
                                    fontSize: 28,
                                    fontWeight: 700,
                                    color: textPrimary,
                                }}
                            >
                                {commitCount}
                            </span>
                            <span style={{ fontSize: 16, color: textSecondary }}>
                                commits in {currentYear}
                            </span>
                        </div>
                        <div
                            style={{
                                fontSize: 16,
                                fontWeight: 500,
                                color: "#10b981",
                            }}
                        >
                            Top {percentileRank}% globally
                        </div>
                    </div>

                    {/* Languages */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                            marginBottom: 24,
                        }}
                    >
                        {languages.slice(0, 3).map((lang, i) => (
                            <div
                                key={lang}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        minWidth: 100,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: "50%",
                                            backgroundColor: getLanguageColor(lang.trim()),
                                        }}
                                    />
                                    <span
                                        style={{
                                            fontSize: 12,
                                            fontWeight: 500,
                                            color: isDark ? "#d4d4d8" : "#3f3f46",
                                        }}
                                    >
                                        {lang.trim()}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        flex: 1,
                                        height: 8,
                                        backgroundColor: isDark ? "#27272a" : "#e4e4e7",
                                        borderRadius: 4,
                                        overflow: "hidden",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: `${60 - i * 15}%`,
                                            height: "100%",
                                            backgroundColor: getLanguageColor(lang.trim()),
                                            borderRadius: 4,
                                        }}
                                    />
                                </div>
                                <span
                                    style={{
                                        fontSize: 12,
                                        fontFamily: "monospace",
                                        color: textMuted,
                                        width: 40,
                                        textAlign: "right",
                                    }}
                                >
                                    {60 - i * 15}%
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Location if provided */}
                    {location && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                fontSize: 14,
                                color: textSecondary,
                                marginBottom: 16,
                            }}
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span>{location}</span>
                        </div>
                    )}

                    {/* Footer */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            paddingTop: 16,
                            borderTop: `1px solid ${borderColor}`,
                        }}
                    >
                        <span style={{ fontSize: 12, color: textMuted }}>
                            Verified by gh.world
                        </span>
                        <span
                            style={{
                                fontSize: 12,
                                fontFamily: "monospace",
                                color: isDark ? "#3f3f46" : "#a1a1aa",
                            }}
                        >
                            gh.world/@{username}
                        </span>
                    </div>
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    );
}
