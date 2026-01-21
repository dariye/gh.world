"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useMemo, memo } from "react";
import * as THREE from "three";
import {
    CONTRIBUTION_COLORS,
    LANGUAGE_COLORS_RGB,
    getLanguageRgba,
    getContributionColor,
    getContributionAltitude,
} from "@/lib/colors";

const Globe = dynamic(() => import("react-globe.gl"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-[#060a0f]">
            <div className="text-blue-400 animate-pulse text-lg font-mono">
                Initializing Global Commits...
            </div>
        </div>
    ),
});

// GeoJSON feature type for hexPolygons
interface GeoJSONFeature {
    type: string;
    properties: Record<string, unknown>;
    geometry: {
        type: string;
        coordinates: number[][][] | number[][][][];
    };
}

// Grid cell size in degrees for activity mapping
const GRID_CELL_SIZE = 5;

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

// Time in ms before auto-rotation resumes after user stops interacting
const AUTO_ROTATE_RESUME_DELAY = 5000;

export interface TargetLocation {
    lat: number;
    lng: number;
    altitude?: number;
}

function GlobeComponent({
    commits,
    selectedLanguage,
    viewTime,
    onSelectCommit,
    onViewportChange,
    isPlaying = false,
    targetLocation
}: {
    commits: Commit[],
    selectedLanguage: string | null,
    viewTime?: number,
    onSelectCommit?: (commit: Commit) => void,
    onViewportChange?: (viewport: Viewport) => void,
    isPlaying?: boolean,
    targetLocation?: TargetLocation | null
}) {
    const globeRef = useRef<any>(null);
    const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);

    const [atmosphereAltitude, setAtmosphereAltitude] = useState(0.15);
    const [atmosphereColor, setAtmosphereColor] = useState("#1a3050");
    const [countries, setCountries] = useState<GeoJSONFeature[]>([]);

    // Fetch countries GeoJSON for hexed polygons terrain
    useEffect(() => {
        fetch('https://unpkg.com/three-globe/example/country-polygons/ne_110m_admin_0_countries.geojson')
            .then(res => res.json())
            .then(data => setCountries(data.features || []))
            .catch(err => console.error('Failed to load countries GeoJSON:', err));
    }, []);

    // Create activity grid from commits (maps grid cells to commit counts)
    const activityGrid = useMemo(() => {
        const grid = new Map<string, number>();
        for (const commit of commits) {
            if (commit.coordinates && commit.coordinates.length === 2) {
                // Filter by language if selected
                if (selectedLanguage && commit.language !== selectedLanguage) continue;

                const lat = commit.coordinates[0];
                const lng = commit.coordinates[1];
                const cellKey = `${Math.floor(lat / GRID_CELL_SIZE)},${Math.floor(lng / GRID_CELL_SIZE)}`;
                grid.set(cellKey, (grid.get(cellKey) || 0) + 1);
            }
        }
        return grid;
    }, [commits, selectedLanguage]);

    // Get a representative point from a country GeoJSON feature
    const getCountryPoint = (feature: GeoJSONFeature): [number, number] | null => {
        const coords = feature.geometry.coordinates;
        if (!coords || !coords.length) return null;

        if (feature.geometry.type === 'Polygon') {
            const ring = coords[0] as number[][];
            if (ring.length > 0) {
                return [ring[0][1], ring[0][0]]; // [lat, lng]
            }
        } else if (feature.geometry.type === 'MultiPolygon') {
            const polygon = coords[0] as number[][][];
            if (polygon.length > 0 && polygon[0].length > 0) {
                return [polygon[0][0][1], polygon[0][0][0]]; // [lat, lng]
            }
        }
        return null;
    };

    // Generate hex color based on commit activity (GitHub contribution graph style)
    const getHexColor = useMemo(() => {
        return (obj: object) => {
            const feature = obj as GeoJSONFeature;
            const point = getCountryPoint(feature);

            if (!point) return CONTRIBUTION_COLORS.level0;

            const [lat, lng] = point;
            const latCell = Math.floor(lat / GRID_CELL_SIZE);
            const lngCell = Math.floor(lng / GRID_CELL_SIZE);

            // Check 3x3 grid around the point to capture nearby activity
            let activity = 0;
            for (let dLat = -1; dLat <= 1; dLat++) {
                for (let dLng = -1; dLng <= 1; dLng++) {
                    const cellKey = `${latCell + dLat},${lngCell + dLng}`;
                    activity += activityGrid.get(cellKey) || 0;
                }
            }

            return getContributionColor(activity);
        };
    }, [activityGrid]);

    // Generate hex altitude based on commit activity (extruded contribution tiles)
    const getHexAltitude = useMemo(() => {
        return (obj: object) => {
            const feature = obj as GeoJSONFeature;
            const point = getCountryPoint(feature);

            if (!point) return getContributionAltitude(0);

            const [lat, lng] = point;
            const latCell = Math.floor(lat / GRID_CELL_SIZE);
            const lngCell = Math.floor(lng / GRID_CELL_SIZE);

            // Check 3x3 grid around the point to capture nearby activity
            let activity = 0;
            for (let dLat = -1; dLat <= 1; dLat++) {
                for (let dLng = -1; dLng <= 1; dLng++) {
                    const cellKey = `${latCell + dLat},${lngCell + dLng}`;
                    activity += activityGrid.get(cellKey) || 0;
                }
            }

            return getContributionAltitude(activity);
        };
    }, [activityGrid]);

    // Generate hex tooltip label showing country name and commit activity
    const getHexLabel = useMemo(() => {
        return (obj: object) => {
            const feature = obj as GeoJSONFeature;
            const props = feature.properties;
            const countryName = (props?.NAME || props?.ADMIN || props?.name || 'Unknown') as string;
            const point = getCountryPoint(feature);

            if (!point) {
                return `<div style="padding: 8px; background: rgba(0,0,0,0.8); border-radius: 4px; font-family: monospace;">
                    <div style="font-weight: bold; color: #fff;">${countryName}</div>
                    <div style="color: #888; font-size: 12px;">No activity data</div>
                </div>`;
            }

            const [lat, lng] = point;
            const latCell = Math.floor(lat / GRID_CELL_SIZE);
            const lngCell = Math.floor(lng / GRID_CELL_SIZE);

            // Check 3x3 grid around the point to capture nearby activity
            let activity = 0;
            for (let dLat = -1; dLat <= 1; dLat++) {
                for (let dLng = -1; dLng <= 1; dLng++) {
                    const cellKey = `${latCell + dLat},${lngCell + dLng}`;
                    activity += activityGrid.get(cellKey) || 0;
                }
            }

            // Determine activity level label and color
            let levelLabel: string;
            let levelColor: string;
            if (activity === 0) {
                levelLabel = 'No activity';
                levelColor = HEX_COLORS.inactive;
            } else if (activity < 3) {
                levelLabel = 'Low';
                levelColor = HEX_COLORS.level1;
            } else if (activity < 10) {
                levelLabel = 'Medium';
                levelColor = HEX_COLORS.level2;
            } else if (activity < 30) {
                levelLabel = 'High';
                levelColor = HEX_COLORS.level3;
            } else {
                levelLabel = 'Very High';
                levelColor = HEX_COLORS.level4;
            }

            const commitText = activity === 1 ? '1 commit' : `${activity} commits`;

            return `<div style="padding: 8px; background: rgba(0,0,0,0.85); border-radius: 4px; font-family: monospace; border-left: 3px solid ${levelColor};">
                <div style="font-weight: bold; color: #fff; margin-bottom: 4px;">${countryName}</div>
                <div style="color: ${levelColor}; font-size: 12px;">${commitText}</div>
                <div style="color: #888; font-size: 11px; margin-top: 2px;">${levelLabel} activity</div>
            </div>`;
        };
    }, [activityGrid]);

    // Create solid contribution color material for globe base (ocean = level 0)
    // This makes the entire globe look like GitHub contribution squares
    const globeMaterial = useMemo(() => {
        if (typeof window === 'undefined') return undefined;
        // Use level 0 contribution color for ocean/base
        return new THREE.MeshBasicMaterial({
            color: new THREE.Color(CONTRIBUTION_COLORS.level0),
        });
    }, []);

    // Quantize viewTime to nearest second to reduce update frequency
    // viewTime is always provided by page.tsx, so default to 0 as a safe fallback
    const quantizedTime = Math.floor((viewTime ?? 0) / 1000) * 1000;

    // Single-pass memoized computation for points, rings, and recent unlocated commits
    const { points, rings, recentUnlocated } = useMemo(() => {
        const points: Array<Commit & { lat: number; lng: number; size: number; color: string; label: string }> = [];
        const rings: Array<{ lat: number; lng: number; maxR: number; propagationSpeed: number; repeatPeriod: number; language: string | null }> = [];
        const recentUnlocated: Commit[] = [];

        for (const commit of commits) {
            // Filter by language
            if (selectedLanguage && commit.language !== selectedLanguage) continue;

            const hasCoords = commit.coordinates && commit.coordinates.length === 2;
            const age = quantizedTime - commit.timestamp;

            if (hasCoords) {
                // Add to points - "data bits" that pulse with freshness
                const opacity = Math.max(0.15, 1 - age / (24 * 60 * 60 * 1000)); // Fade over 24h, min 0.15
                // Fresh commits are larger (0.12-0.2), older commits shrink to base size
                const ageHours = age / (60 * 60 * 1000);
                const size = Math.max(0.12, 0.2 - ageHours * 0.01); // Shrink 0.01 per hour
                points.push({
                    lat: commit.coordinates[0],
                    lng: commit.coordinates[1],
                    size,
                    color: getLanguageRgba(commit.language ?? null, opacity),
                    label: `${commit.author}: ${commit.message}`,
                    ...commit,
                });

                // Add ring if recent (last 10 mins)
                if (age < 10 * 60 * 1000) {
                    // Fresher commits get larger, faster ripples
                    const freshness = 1 - age / (10 * 60 * 1000); // 1 = brand new, 0 = 10 mins old
                    const maxR = 3 + freshness * 5; // 3-8 radius based on freshness
                    const propagationSpeed = 2 + freshness * 3; // 2-5 speed
                    const repeatPeriod = 1000 + (1 - freshness) * 1500; // 1000-2500ms (fresher = faster repeat)

                    rings.push({
                        lat: commit.coordinates[0],
                        lng: commit.coordinates[1],
                        maxR,
                        propagationSpeed,
                        repeatPeriod,
                        language: commit.language ?? null
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
            setAtmosphereColor(getLanguageRgba(dominantLang, 0.6));

            // Reset after animation
            const timer = setTimeout(() => {
                setAtmosphereAltitude(0.15);
                setAtmosphereColor("#1a3050");
            }, 1000);
            return () => clearTimeout(timer);
        } else {
            setAtmosphereAltitude(0.15);
            setAtmosphereColor("#1a3050");
        }
    }, [recentUnlocated]);

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

    // Quick-jump to target location
    useEffect(() => {
        if (!targetLocation || !globeRef.current) return;

        const altitude = targetLocation.altitude ?? 1.5; // Default zoom level for city view
        globeRef.current.pointOfView({
            lat: targetLocation.lat,
            lng: targetLocation.lng,
            altitude
        }, 800); // 800ms smooth transition
    }, [targetLocation]);

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

    // Configure orbit controls with damping for smooth camera movement
    useEffect(() => {
        if (!globeRef.current) return;

        const controls = globeRef.current.controls();
        if (controls) {
            controls.enableDamping = true;
            controls.dampingFactor = 0.1;
            controls.rotateSpeed = 0.8;
        }
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

    // Auto-rotate with pause on user interaction
    useEffect(() => {
        if (!globeRef.current) return;

        const controls = globeRef.current.controls();
        if (!controls) return;

        // Enable auto-rotation by default
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;

        const handleInteractionStart = () => {
            // Clear any pending resume timer
            if (resumeTimerRef.current) {
                clearTimeout(resumeTimerRef.current);
                resumeTimerRef.current = null;
            }
            // Pause auto-rotation while user is interacting
            controls.autoRotate = false;
        };

        const handleInteractionEnd = () => {
            // Clear any existing timer
            if (resumeTimerRef.current) {
                clearTimeout(resumeTimerRef.current);
            }
            // Resume auto-rotation after delay
            resumeTimerRef.current = setTimeout(() => {
                controls.autoRotate = true;
                resumeTimerRef.current = null;
            }, AUTO_ROTATE_RESUME_DELAY);
        };

        controls.addEventListener('start', handleInteractionStart);
        controls.addEventListener('end', handleInteractionEnd);

        return () => {
            controls.removeEventListener('start', handleInteractionStart);
            controls.removeEventListener('end', handleInteractionEnd);
            if (resumeTimerRef.current) {
                clearTimeout(resumeTimerRef.current);
            }
        };
    }, []);

    return (
        <div ref={globeContainerRef} className="w-full h-full bg-[#060a0f]">
            <Globe
                ref={globeRef}
                backgroundColor="rgba(0,0,0,0)"
                width={dimensions.width}
                height={dimensions.height}
                globeMaterial={globeMaterial ?? undefined}

                // Hexed polygons terrain (GitHub contribution squares style)
                hexPolygonsData={countries}
                hexPolygonResolution={3}
                hexPolygonMargin={0.4}
                hexPolygonColor={getHexColor}
                hexPolygonAltitude={getHexAltitude}
                hexPolygonLabel={getHexLabel}

                // Atmosphere
                showAtmosphere={true}
                atmosphereColor={atmosphereColor}
                atmosphereAltitude={atmosphereAltitude}

                // Points (Commits) - "data bits" floating above data zones
                pointsData={points}
                pointRadius="size"
                pointColor="color"
                pointAltitude={0.12}
                pointLabel="label"

                // Rings (Recent activity ripple with language colors and fade-out)
                ringsData={rings}
                ringColor={((ring: { language: string | null }) => {
                    const [r, g, b] = LANGUAGE_COLORS_RGB[ring.language || "Other"] || LANGUAGE_COLORS_RGB["Other"];
                    // Return a function that fades out as the ring expands (t: 0->1)
                    return (t: number) => `rgba(${r}, ${g}, ${b}, ${Math.max(0, 1 - t)})`;
                }) as any}
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
