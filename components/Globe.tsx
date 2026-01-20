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

interface Commit {
    _id: string;
    author: string;
    message: string;
    repo: string;
    timestamp: number;
    coordinates: number[];
    authorUrl: string;
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
                color: `rgba(96, 165, 250, ${opacity})`, // Blue with fading opacity
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
