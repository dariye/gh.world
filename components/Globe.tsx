"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useMemo, memo } from "react";

const Globe = dynamic(() => import("react-globe.gl"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-black">
            <div className="text-blue-400 animate-pulse text-lg font-mono">
                Initializing Global Commits...
            </div>
        </div>
    ),
});

// Pre-computed RGB values to avoid regex parsing on every render
const LANGUAGE_COLORS_RGB: Record<string, [number, number, number]> = {
    Python: [53, 114, 165],
    JavaScript: [247, 223, 30],
    TypeScript: [49, 120, 198],
    Go: [0, 173, 216],
    Rust: [222, 165, 132],
    Java: [176, 114, 25],
    Ruby: [204, 52, 45],
    "C++": [243, 75, 125],
    PHP: [79, 93, 149],
    Swift: [240, 81, 56],
    Kotlin: [169, 123, 255],
    Other: [139, 139, 139]
};

function getLanguageColor(language: string | null, opacity: number) {
    const [r, g, b] = LANGUAGE_COLORS_RGB[language || "Other"] || LANGUAGE_COLORS_RGB["Other"];
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export interface Commit {
    _id: string;
    author: string;
    message: string;
    repo: string;
    timestamp: number;
    coordinates: number[];
    authorUrl: string;
    language?: string | null;
}

function GlobeComponent({
    commits,
    selectedLanguage,
    viewTime,
    onSelectCommit
}: {
    commits: Commit[],
    selectedLanguage: string | null,
    viewTime?: number,
    onSelectCommit?: (commit: Commit) => void
}) {
    const [atmosphereAltitude, setAtmosphereAltitude] = useState(0.15);
    const [atmosphereColor, setAtmosphereColor] = useState("#3a445e");

    // Quantize viewTime to nearest second to reduce update frequency
    // viewTime is always provided by page.tsx, so default to 0 as a safe fallback
    const quantizedTime = Math.floor((viewTime ?? 0) / 1000) * 1000;

    // Single-pass memoized computation for points, rings, and recent unlocated commits
    const { points, rings, recentUnlocated } = useMemo(() => {
        const points: Array<Commit & { lat: number; lng: number; size: number; color: string; label: string }> = [];
        const rings: Array<{ lat: number; lng: number; maxR: number; propagationSpeed: number; repeatPeriod: number }> = [];
        const recentUnlocated: Commit[] = [];

        for (const commit of commits) {
            // Filter by language
            if (selectedLanguage && commit.language !== selectedLanguage) continue;

            const hasCoords = commit.coordinates && commit.coordinates.length === 2;
            const age = quantizedTime - commit.timestamp;

            if (hasCoords) {
                // Add to points
                const opacity = Math.max(0.1, 1 - age / (24 * 60 * 60 * 1000)); // Fade over 24h
                points.push({
                    lat: commit.coordinates[0],
                    lng: commit.coordinates[1],
                    size: 0.15,
                    color: getLanguageColor(commit.language ?? null, opacity),
                    label: `${commit.author}: ${commit.message}`,
                    ...commit,
                });

                // Add ring if recent (last 10 mins)
                if (age < 10 * 60 * 1000) {
                    rings.push({
                        lat: commit.coordinates[0],
                        lng: commit.coordinates[1],
                        maxR: 2,
                        propagationSpeed: 1,
                        repeatPeriod: 2000
                    });
                }
            } else if (age < 30 * 1000) {
                // Track recent unlocated for atmosphere effect
                recentUnlocated.push(commit);
            }
        }

        return { points, rings, recentUnlocated };
    }, [commits, selectedLanguage, quantizedTime]);

    // Separate effect for atmosphere - only triggers when recentUnlocated changes
    useEffect(() => {
        if (recentUnlocated.length > 0) {
            // Calculate dominant language among recent unlocated commits
            const langCounts = recentUnlocated.reduce((acc, c) => {
                const lang = c.language || "Other";
                acc[lang] = (acc[lang] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            const dominantLang = Object.entries(langCounts)
                .sort(([, a], [, b]) => b - a)[0][0];

            // "Shiver" effect: Pulse atmosphere altitude
            setAtmosphereAltitude(0.25);
            // Tint atmosphere with dominant language color
            setAtmosphereColor(getLanguageColor(dominantLang, 0.6));

            // Reset after animation
            const timer = setTimeout(() => {
                setAtmosphereAltitude(0.15);
                setAtmosphereColor("#3a445e");
            }, 1000);
            return () => clearTimeout(timer);
        } else {
            setAtmosphereAltitude(0.15);
            setAtmosphereColor("#3a445e");
        }
    }, [recentUnlocated]);

    const globeContainerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const updateDimensions = () => {
            if (globeContainerRef.current) {
                setDimensions({
                    width: globeContainerRef.current.offsetWidth,
                    height: globeContainerRef.current.offsetHeight,
                });
            }
        };

        updateDimensions(); // Set initial dimensions
        window.addEventListener("resize", updateDimensions);
        return () => window.removeEventListener("resize", updateDimensions);
    }, []);

    return (
        <div ref={globeContainerRef} className="w-full h-full bg-black">
            <Globe
                backgroundColor="rgba(0,0,0,0)"
                width={dimensions.width}
                height={dimensions.height}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"

                // Atmosphere
                showAtmosphere={true}
                atmosphereColor={atmosphereColor}
                atmosphereAltitude={atmosphereAltitude}

                // Points (Commits)
                pointsData={points}
                pointRadius="size"
                pointColor="color"
                pointAltitude={0.1}
                pointLabel="label"

                // Rings (Recent activity ripple)
                ringsData={rings}
                ringColor={() => "#60a5fa"}
                ringMaxRadius="maxR"
                ringPropagationSpeed="propagationSpeed"
                ringRepeatPeriod="repeatPeriod"

                onPointClick={(point: object) => {
                    const commitPoint = point as Commit & { authorUrl: string };
                    if (onSelectCommit) {
                        onSelectCommit(commitPoint);
                    } else {
                        window.open(commitPoint.authorUrl, "_blank");
                    }
                }}
            />
        </div>
    );
}

export default memo(GlobeComponent);
