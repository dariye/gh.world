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

    useEffect(() => {
        // Transform commits to globe points
        const newPoints = commits.map((commit) => ({
            lat: commit.coordinates[0],
            lng: commit.coordinates[1],
            size: 0.1,
            color: "#60a5fa", // Default blue
            label: `${commit.author}: ${commit.message}`,
            ...commit,
        }));
        setPoints(newPoints);
    }, [commits]);

    return (
        <div className="w-full h-full">
            <Globe
                backgroundColor="#000510"
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                pointsData={points}
                pointRadius="size"
                pointColor="color"
                pointAltitude={0.1}
                pointLabel="label"
                onPointClick={(point: any) => {
                    window.open(point.authorUrl, "_blank");
                }}
            />
        </div>
    );
}
