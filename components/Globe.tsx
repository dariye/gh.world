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
import { createDayNightMaterial, updateSunDirection } from "./DayNightShader";
import { SUNRISE_CONFIG, lerpLongitude } from "@/lib/sunrise";
import { useReducedMotion } from "@/lib/useReducedMotion";

const Globe = dynamic(() => import("react-globe.gl"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-[#060a0f]">
            <div className="text-blue-400 motion-safe:animate-pulse text-lg font-mono">
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

// Auto-rotate settings
const AUTO_ROTATE_SPEED = 0.3; // Degrees per frame (slow rotation)
const AUTO_ROTATE_RESUME_DELAY = 5000; // Resume after 5 seconds of inactivity

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
    targetLocation,
    highlightedUser,
    sunriseCameraTarget,
    onSunriseInteraction
}: {
    commits: Commit[],
    selectedLanguage: string | null,
    viewTime?: number,
    onSelectCommit?: (commit: Commit) => void,
    onViewportChange?: (viewport: Viewport) => void,
    isPlaying?: boolean,
    targetLocation?: TargetLocation | null,
    /** Username to highlight on the globe (their commits will stand out) */
    highlightedUser?: string | null,
    /** Target longitude for sunrise mode camera follow */
    sunriseCameraTarget?: number | null,
    /** Callback when user interacts during sunrise mode (to pause/exit) */
    onSunriseInteraction?: () => void
}) {
    const globeRef = useRef<any>(null);
    const autoRotateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const prefersReducedMotion = useReducedMotion();

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

    // Calculate centroid of a polygon ring for click-to-zoom
    const getPolygonCentroid = (feature: GeoJSONFeature): [number, number] | null => {
        const coords = feature.geometry.coordinates;
        if (!coords || !coords.length) return null;

        let ring: number[][] | null = null;
        if (feature.geometry.type === 'Polygon') {
            ring = coords[0] as number[][];
        } else if (feature.geometry.type === 'MultiPolygon') {
            // Use the first (usually largest) polygon
            const polygon = coords[0] as number[][][];
            ring = polygon[0];
        }

        if (!ring || ring.length === 0) return null;

        // Calculate centroid as average of all points
        let sumLng = 0;
        let sumLat = 0;
        for (const point of ring) {
            sumLng += point[0];
            sumLat += point[1];
        }
        return [sumLat / ring.length, sumLng / ring.length]; // [lat, lng]
    };

    // Click-to-zoom handler for hex polygon tiles
    const handleHexPolygonClick = (polygon: object) => {
        const feature = polygon as GeoJSONFeature;
        const centroid = getPolygonCentroid(feature);

        if (centroid && globeRef.current) {
            const [lat, lng] = centroid;
            // Zoom in to altitude 0.8 (closer view) with smooth animation
            // Reduced motion: instant transition (WCAG 2.3.3)
            globeRef.current.pointOfView({ lat, lng, altitude: 0.8 }, prefersReducedMotion ? 0 : 1000);
        }
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
                levelColor = CONTRIBUTION_COLORS.level0;
            } else if (activity < 3) {
                levelLabel = 'Low';
                levelColor = CONTRIBUTION_COLORS.level1;
            } else if (activity < 10) {
                levelLabel = 'Medium';
                levelColor = CONTRIBUTION_COLORS.level2;
            } else if (activity < 30) {
                levelLabel = 'High';
                levelColor = CONTRIBUTION_COLORS.level3;
            } else {
                levelLabel = 'Very High';
                levelColor = CONTRIBUTION_COLORS.level4;
            }

            const commitText = activity === 1 ? '1 commit' : `${activity} commits`;

            return `<div style="padding: 8px; background: rgba(0,0,0,0.85); border-radius: 4px; font-family: monospace; border-left: 3px solid ${levelColor};">
                <div style="font-weight: bold; color: #fff; margin-bottom: 4px;">${countryName}</div>
                <div style="color: ${levelColor}; font-size: 12px;">${commitText}</div>
                <div style="color: #888; font-size: 11px; margin-top: 2px;">${levelLabel} activity</div>
            </div>`;
        };
    }, [activityGrid]);

    // Create day/night blended material for globe base (ocean areas)
    // The shader blends earth-day.jpg and earth-night.jpg based on sun position
    const globeMaterial = useMemo(() => {
        if (typeof window === 'undefined') return undefined;
return createDayNightMaterial();
    }, []);

    // Update sun direction when viewTime changes
    // This enables real-time day/night visualization that follows the current time
    useEffect(() => {
        if (!globeMaterial) return;
        const viewDate = viewTime ? new Date(viewTime) : new Date();
        updateSunDirection(globeMaterial, viewDate);
    }, [globeMaterial, viewTime]);

    // Quantize viewTime to nearest second to reduce update frequency
    // viewTime is always provided by page.tsx, so default to 0 as a safe fallback
    const quantizedTime = Math.floor((viewTime ?? 0) / 1000) * 1000;

    // Single-pass memoized computation for points, rings, and recent unlocated commits
    const { points, rings, recentUnlocated } = useMemo(() => {
        const points: Array<Commit & { lat: number; lng: number; size: number; color: string; label: string; isHighlighted?: boolean }> = [];
        const rings: Array<{ lat: number; lng: number; maxR: number; propagationSpeed: number; repeatPeriod: number; language: string | null; isHighlighted?: boolean }> = [];
        const recentUnlocated: Commit[] = [];

        for (const commit of commits) {
            // Filter by language
            if (selectedLanguage && commit.language !== selectedLanguage) continue;

            const hasCoords = commit.coordinates && commit.coordinates.length === 2;
            const age = quantizedTime - commit.timestamp;
            const isHighlighted = Boolean(highlightedUser && commit.author === highlightedUser);

            if (hasCoords) {
                // Add to points - "data bits" that pulse with freshness
                const opacity = Math.max(0.15, 1 - age / (24 * 60 * 60 * 1000)); // Fade over 24h, min 0.15
                // Fresh commits are larger (0.12-0.2), older commits shrink to base size
                const ageHours = age / (60 * 60 * 1000);
                let size = Math.max(0.12, 0.2 - ageHours * 0.01); // Shrink 0.01 per hour

                // Highlighted user's commits are larger and use a distinct color
                if (isHighlighted) {
                    size = Math.max(0.25, size * 1.5); // 50% larger, min 0.25
                }

                points.push({
                    lat: commit.coordinates[0],
                    lng: commit.coordinates[1],
                    size,
                    // Highlighted commits get a golden glow, others use language color
                    color: isHighlighted
                        ? `rgba(255, 215, 100, ${Math.max(0.7, opacity)})` // Golden with higher min opacity
                        : getLanguageRgba(commit.language ?? null, opacity),
                    label: `${commit.author}: ${commit.message}`,
                    isHighlighted,
                    ...commit,
                });

                // Add ring for recent commits (last 10 mins) OR for highlighted user's commits
                if (age < 10 * 60 * 1000 || isHighlighted) {
                    // Fresher commits get larger, faster ripples
                    const freshness = Math.max(0, 1 - age / (10 * 60 * 1000)); // 1 = brand new, 0 = 10 mins old (clamp to 0)
                    let maxR = 3 + freshness * 5; // 3-8 radius based on freshness
                    let propagationSpeed = 2 + freshness * 3; // 2-5 speed
                    let repeatPeriod = 1000 + (1 - freshness) * 1500; // 1000-2500ms (fresher = faster repeat)

                    // Highlighted user gets persistent subtle rings
                    if (isHighlighted && age >= 10 * 60 * 1000) {
                        maxR = 4;
                        propagationSpeed = 1.5;
                        repeatPeriod = 3000;
                    }

                    rings.push({
                        lat: commit.coordinates[0],
                        lng: commit.coordinates[1],
                        maxR,
                        propagationSpeed,
                        repeatPeriod,
                        language: isHighlighted ? null : (commit.language ?? null), // null triggers golden color for highlighted
                        isHighlighted
                    });
                }
            } else if (age < 30 * 1000) {
                // Track recent unlocated for atmosphere effect
                recentUnlocated.push(commit);
            }
        }

        return { points, rings, recentUnlocated };
    }, [commits, selectedLanguage, quantizedTime, highlightedUser]);

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
            // Reduced motion: instant transition (WCAG 2.3.3)
            const currentPos = globeRef.current.pointOfView();
            globeRef.current.pointOfView({
                lat: targetLat,
                lng: targetLng,
                altitude: currentPos.altitude
            }, prefersReducedMotion ? 0 : 1000);
        }
    }, [isPlaying, points, prefersReducedMotion]);

    // Quick-jump to target location
    useEffect(() => {
        if (!targetLocation || !globeRef.current) return;

        const altitude = targetLocation.altitude ?? 1.5; // Default zoom level for city view
        // Reduced motion: instant transition (WCAG 2.3.3)
        globeRef.current.pointOfView({
            lat: targetLocation.lat,
            lng: targetLocation.lng,
            altitude
        }, prefersReducedMotion ? 0 : 800);
    }, [targetLocation, prefersReducedMotion]);

    // Sunrise mode: smoothly follow the sun
    useEffect(() => {
        if (sunriseCameraTarget === null || sunriseCameraTarget === undefined || !globeRef.current) return;

        const currentPov = globeRef.current.pointOfView();

        // Lerp camera longitude toward target
        const newLng = lerpLongitude(currentPov.lng, sunriseCameraTarget, SUNRISE_CONFIG.CAMERA_LERP);

        // Only update if there's meaningful movement
        if (Math.abs(newLng - currentPov.lng) > 0.01) {
            globeRef.current.pointOfView({
                lat: SUNRISE_CONFIG.CAMERA_LAT,
                lng: newLng,
                altitude: SUNRISE_CONFIG.CAMERA_ALTITUDE
            }, 0); // Instant update for smooth lerp
        }
    }, [sunriseCameraTarget]);

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

// Configure orbit controls with auto-rotate and pause on interaction
    useEffect(() => {
        if (!globeRef.current) return;

        const controls = globeRef.current.controls();
        if (!controls) return;

        // Enable damping for smooth camera movement
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
        controls.rotateSpeed = 0.8;

        // Enable auto-rotate (disabled if user prefers reduced motion - WCAG 2.3.3)
        controls.autoRotate = !prefersReducedMotion;
        controls.autoRotateSpeed = AUTO_ROTATE_SPEED;

        // Handler to pause auto-rotate on user interaction
        const handleInteractionStart = () => {
            controls.autoRotate = false;

            // Clear any existing resume timeout
            if (autoRotateTimeoutRef.current) {
                clearTimeout(autoRotateTimeoutRef.current);
            }

            // Exit sunrise mode on user interaction
            if (onSunriseInteraction) {
                onSunriseInteraction();
            }
        };

        // Handler to schedule auto-rotate resume after interaction ends
        const handleInteractionEnd = () => {
            // Don't resume auto-rotate if user prefers reduced motion
            if (prefersReducedMotion) return;

            // Clear any existing timeout
            if (autoRotateTimeoutRef.current) {
                clearTimeout(autoRotateTimeoutRef.current);
            }

            // Schedule resume after delay
            autoRotateTimeoutRef.current = setTimeout(() => {
                if (controls) {
                    controls.autoRotate = true;
                }
            }, AUTO_ROTATE_RESUME_DELAY);
        };

        // Listen for interaction events
        controls.addEventListener('start', handleInteractionStart);
        controls.addEventListener('end', handleInteractionEnd);

        return () => {
            controls.removeEventListener('start', handleInteractionStart);
            controls.removeEventListener('end', handleInteractionEnd);
            if (autoRotateTimeoutRef.current) {
                clearTimeout(autoRotateTimeoutRef.current);
            }
        };
    }, [onSunriseInteraction, prefersReducedMotion]);

    // Keyboard navigation controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!globeRef.current) return;

            // Don't intercept if user is typing in an input field
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            const currentPov = globeRef.current.pointOfView();
            const rotationStep = 10; // degrees per keypress
            const zoomStep = 0.3; // altitude change per keypress

            let newPov = { ...currentPov };
            let handled = false;

            switch (e.key) {
                case 'ArrowLeft':
                    newPov.lng = currentPov.lng - rotationStep;
                    handled = true;
                    break;
                case 'ArrowRight':
                    newPov.lng = currentPov.lng + rotationStep;
                    handled = true;
                    break;
                case 'ArrowUp':
                    newPov.lat = Math.min(90, currentPov.lat + rotationStep);
                    handled = true;
                    break;
                case 'ArrowDown':
                    newPov.lat = Math.max(-90, currentPov.lat - rotationStep);
                    handled = true;
                    break;
                case '+':
                case '=': // Allow = key without shift for easier zoom in
                    newPov.altitude = Math.max(0.5, currentPov.altitude - zoomStep);
                    handled = true;
                    break;
                case '-':
                case '_':
                    newPov.altitude = Math.min(4, currentPov.altitude + zoomStep);
                    handled = true;
                    break;
                case 'r':
                case 'R':
                    // Reset to default view
                    newPov = { lat: 20, lng: 0, altitude: 2.5 };
                    handled = true;
                    break;
            }

            if (handled) {
                e.preventDefault();
                // Reduced motion: instant transition (WCAG 2.3.3)
                globeRef.current.pointOfView(newPov, prefersReducedMotion ? 0 : 200);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [prefersReducedMotion]);

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

        // Enable auto-rotation by default (disabled if user prefers reduced motion - WCAG 2.3.3)
        controls.autoRotate = !prefersReducedMotion;
        controls.autoRotateSpeed = 0.5;

        const handleInteractionStart = () => {
            // Clear any pending resume timer
            if (autoRotateTimeoutRef.current) {
                clearTimeout(autoRotateTimeoutRef.current);
                autoRotateTimeoutRef.current = null;
            }
            // Pause auto-rotation while user is interacting
            controls.autoRotate = false;
        };

        const handleInteractionEnd = () => {
            // Don't resume auto-rotate if user prefers reduced motion
            if (prefersReducedMotion) return;

            // Clear any existing timer
            if (autoRotateTimeoutRef.current) {
                clearTimeout(autoRotateTimeoutRef.current);
            }
            // Resume auto-rotation after delay
            autoRotateTimeoutRef.current = setTimeout(() => {
                controls.autoRotate = true;
                autoRotateTimeoutRef.current = null;
            }, AUTO_ROTATE_RESUME_DELAY);
        };

        controls.addEventListener('start', handleInteractionStart);
        controls.addEventListener('end', handleInteractionEnd);

        return () => {
            controls.removeEventListener('start', handleInteractionStart);
            controls.removeEventListener('end', handleInteractionEnd);
            if (autoRotateTimeoutRef.current) {
                clearTimeout(autoRotateTimeoutRef.current);
            }
        };
    }, [prefersReducedMotion]);

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
                onHexPolygonClick={handleHexPolygonClick}

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
                // Disabled when user prefers reduced motion (WCAG 2.3.3)
                ringsData={prefersReducedMotion ? [] : rings}
                ringColor={((ring: { language: string | null; isHighlighted?: boolean }) => {
                    // Highlighted user gets golden rings
                    if (ring.isHighlighted) {
                        return (t: number) => `rgba(255, 215, 100, ${Math.max(0, 0.8 - t * 0.8)})`;
                    }
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
