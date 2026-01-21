"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Globe = dynamic(() => import("react-globe.gl"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-[#000510]">
            <div className="text-blue-400 animate-pulse text-lg font-mono">
                Initializing Global Commits...
            </div>
        </div>
    ),
});

const LANGUAGE_COLORS: Record<string, string> = {
    Python: "#3572A5",
    JavaScript: "#F7DF1E",
    TypeScript: "#3178C6",
    Go: "#00ADD8",
    Rust: "#DEA584",
    Java: "#B07219",
    Ruby: "#CC342D",
    "C++": "#F34B7D",
    PHP: "#4F5D95",
    Swift: "#F05138",
    Kotlin: "#A97BFF",
    Other: "#8B8B8B"
};

function getLanguageColor(language: string | null, opacity: number) {
    const hex = LANGUAGE_COLORS[language || "Other"] || LANGUAGE_COLORS["Other"];
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    const rgb = result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 139, g: 139, b: 139 };

    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
}

interface Commit {
    _id: string;
    author: string;
    message: string;
    repo: string;
    timestamp: number;
    coordinates: number[];
    authorUrl: string;
    language?: string | null;
}

interface GlobeComponentProps {
    commits: Commit[];
}

export default function GlobeComponent({ commits }: GlobeComponentProps) {
    const [points, setPoints] = useState<any[]>([]);
    const [rings, setRings] = useState<any[]>([]);

    useEffect(() => {
        const now = Date.now();
        // Transform commits to globe points
        const newPoints = commits.map((commit) => {
            const age = now - commit.timestamp;
            const opacity = Math.max(0.1, 1 - age / (24 * 60 * 60 * 1000)); // Fade over 24h

            return {
                lat: commit.coordinates[0],
                lng: commit.coordinates[1],
                size: 0.15,
                color: getLanguageColor(commit.language ?? null, opacity),
                label: `${commit.author}: ${commit.message}`,
                ...commit,
            };
        });
        setPoints(newPoints);

        // Create rings for very recent commits (last 10 mins)
        const newRings = commits
            .filter(c => now - c.timestamp < 10 * 60 * 1000)
            .map(c => ({
                lat: c.coordinates[0],
                lng: c.coordinates[1],
                maxR: 2,
                propagationSpeed: 1,
                repeatPeriod: 2000
            }));
        setRings(newRings);
    }, [commits]);

    return (
        <div className="w-full h-full">
            <Globe
                backgroundColor="rgba(0,0,0,0)"
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"

                // Atmosphere
                showAtmosphere={true}
                atmosphereColor="#3a445e"
                atmosphereAltitude={0.15}

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

                onPointClick={(point: any) => {
                    window.open(point.authorUrl, "_blank");
                }}
            />
        </div>
    );
}
