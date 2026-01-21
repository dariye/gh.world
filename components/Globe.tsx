"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useMemo, memo } from "react";
import SunCalc from "suncalc";
import * as THREE from "three";

const Globe = dynamic(() => import("react-globe.gl"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-[#0d1117]">
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

// Calculate sun position as a 3D vector for directional light
function getSunPosition(date: Date): THREE.Vector3 {
    // Get sun position at lat 0, lng 0 - this gives us the subsolar point
    const sunPos = SunCalc.getPosition(date, 0, 0);

    // Convert altitude (elevation) and azimuth to a direction vector
    // SunCalc azimuth: 0 = south, positive = west
    // We need to convert to a coordinate system where the light points toward Earth
    const altitude = sunPos.altitude;
    const azimuth = sunPos.azimuth;

    // Calculate subsolar point (where sun is directly overhead)
    // The sun's declination determines latitude, and hour angle determines longitude
    const sunTimes = SunCalc.getTimes(date, 0, 0);
    const solarNoon = sunTimes.solarNoon;
    const hourAngle = ((date.getTime() - solarNoon.getTime()) / (1000 * 60 * 60)) * 15; // degrees per hour

    // Get sun's declination (latitude of subsolar point)
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const declination = -23.45 * Math.cos((360 / 365) * (dayOfYear + 10) * (Math.PI / 180));

    // Subsolar longitude: opposite of hour angle from UTC
    const subsolarLng = -hourAngle - (date.getTimezoneOffset() / 60) * 15;
    const subsolarLat = declination;

    // Convert lat/lng to 3D position (distance from globe center)
    const phi = (90 - subsolarLat) * (Math.PI / 180);
    const theta = (subsolarLng + 180) * (Math.PI / 180);

    // Position the light far from the globe, pointing at the subsolar point
    const distance = 200;
    const x = distance * Math.sin(phi) * Math.cos(theta);
    const z = distance * Math.sin(phi) * Math.sin(theta);
    const y = distance * Math.cos(phi);

    return new THREE.Vector3(x, y, z);
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

export interface Viewport {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
}

function GlobeComponent({
    commits,
    selectedLanguage,
    viewTime,
    onSelectCommit,
    onViewportChange,
    isPlaying = false
}: {
    commits: Commit[],
    selectedLanguage: string | null,
    viewTime?: number,
    onSelectCommit?: (commit: Commit) => void,
    onViewportChange?: (viewport: Viewport) => void,
    isPlaying?: boolean
}) {
    const globeRef = useRef<any>(null);
    const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
    const directionalLightRef = useRef<THREE.DirectionalLight | null>(null);
    const lightsInitializedRef = useRef(false);

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

    // Set up directional sun lighting
    useEffect(() => {
        if (!globeRef.current || lightsInitializedRef.current) return;

        const scene = globeRef.current.scene();
        if (!scene) return;

        // Create ambient light with intensity π
        const ambientLight = new THREE.AmbientLight(0xffffff, Math.PI);
        scene.add(ambientLight);
        ambientLightRef.current = ambientLight;

        // Create directional light with intensity 0.6π
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6 * Math.PI);
        scene.add(directionalLight);
        directionalLightRef.current = directionalLight;

        lightsInitializedRef.current = true;

        return () => {
            if (ambientLightRef.current) {
                scene.remove(ambientLightRef.current);
                ambientLightRef.current = null;
            }
            if (directionalLightRef.current) {
                scene.remove(directionalLightRef.current);
                directionalLightRef.current = null;
            }
            lightsInitializedRef.current = false;
        };
    }, []);

    // Update directional light position based on sun position for current viewTime
    useEffect(() => {
        if (!directionalLightRef.current) return;

        const date = new Date(quantizedTime);
        const sunPosition = getSunPosition(date);
        directionalLightRef.current.position.copy(sunPosition);
        directionalLightRef.current.lookAt(0, 0, 0);
    }, [quantizedTime]);

    // Auto-focus logic during playback
    useEffect(() => {
        if (!isPlaying || !globeRef.current || points.length === 0) return;

        // Calculate centroid of current visible points
        let sumLat = 0;
        let sumLng = 0;
        let count = 0;

        // Use a subset of points to determine focus (e.g., recent ones)
        // Since 'points' are already filtered by time window in useMemo, we can use them all or weight recent ones.
        // Simple centroid of all visible:
        for (const p of points) {
            sumLat += p.lat;
            sumLng += p.lng;
            count++;
        }

        if (count > 0) {
            const targetLat = sumLat / count;
            const targetLng = sumLng / count;

            // Smoothly move camera to look at activity
            // We use the current altitude to maintain zoom level
            const currentPos = globeRef.current.pointOfView();
            globeRef.current.pointOfView({
                lat: targetLat,
                lng: targetLng,
                altitude: currentPos.altitude
            }, 1000); // 1 second transition
        }
    }, [isPlaying, points]);

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

    // Viewport tracking logic
    useEffect(() => {
        if (!globeRef.current || !onViewportChange) return;

        const updateViewport = () => {
            const { lat, lng, altitude } = globeRef.current.getPointOfView();

            // Geometric Field of View calculation
            // Visible horizon angle theta = arccos(R / (R + h))
            // R = Earth Radius (1 in globe units)
            // h = altitude
            // FOV span = 2 * theta (converted to degrees)
            const R = 1;
            const h = Math.max(0, altitude);
            const theta = Math.acos(R / (R + h)); // radians
            const span = (2 * theta * 180) / Math.PI; // degrees

            // Add a safety buffer (1.2x) to ensure we seek enough data
            const safeSpan = Math.min(180, span * 1.2);

            const viewport = {
                minLat: Math.max(-90, lat - safeSpan / 2),
                maxLat: Math.min(90, lat + safeSpan / 2),
                minLng: lng - safeSpan,
                maxLng: lng + safeSpan,
            };

            // Normalize longitude bounds to -180, 180 range
            // (Convex query handles the wrap-around if minLng > maxLng)
            const normalize = (n: number) => {
                while (n > 180) n -= 360;
                while (n < -180) n += 360;
                return n;
            };

            onViewportChange({
                ...viewport,
                minLng: normalize(viewport.minLng),
                maxLng: normalize(viewport.maxLng),
            });
        };

        // Initial update
        updateViewport();

        // Listen for changes
        // react-globe.gl uses OrbitControls, we can access them
        const controls = globeRef.current.controls();
        if (controls) {
            controls.addEventListener('change', updateViewport);
            return () => controls.removeEventListener('change', updateViewport);
        }
    }, [onViewportChange]);

    return (
        <div ref={globeContainerRef} className="w-full h-full bg-[#0d1117]">
            <Globe
                ref={globeRef}
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
