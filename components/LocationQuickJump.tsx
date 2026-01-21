"use client";

import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

export interface Location {
  name: string;
  lat: number;
  lng: number;
  shortName?: string;
}

// Major tech hub locations around the world
export const LOCATIONS: Location[] = [
  { name: "San Francisco", shortName: "SF", lat: 37.7749, lng: -122.4194 },
  { name: "New York", shortName: "NYC", lat: 40.7128, lng: -74.006 },
  { name: "London", shortName: "LON", lat: 51.5074, lng: -0.1278 },
  { name: "Tokyo", shortName: "TYO", lat: 35.6762, lng: 139.6503 },
  { name: "Berlin", shortName: "BER", lat: 52.52, lng: 13.405 },
  { name: "Sydney", shortName: "SYD", lat: -33.8688, lng: 151.2093 },
  { name: "Singapore", shortName: "SG", lat: 1.3521, lng: 103.8198 },
  { name: "Bangalore", shortName: "BLR", lat: 12.9716, lng: 77.5946 },
];

interface LocationQuickJumpProps {
  onJumpTo: (location: Location) => void;
}

export default function LocationQuickJump({ onJumpTo }: LocationQuickJumpProps) {
  return (
    <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap max-w-[200px] sm:max-w-none">
      <MapPin className="w-3 h-3 text-white/40 mr-0.5 sm:mr-1 shrink-0" />
      {LOCATIONS.map((location, index) => (
        <Button
          key={location.name}
          variant="ghost"
          size="sm"
          className={`h-5 sm:h-6 px-1.5 sm:px-2 text-[9px] sm:text-[10px] font-mono text-white/60 hover:text-white hover:bg-white/10 transition-colors ${index >= 5 ? 'hidden sm:inline-flex' : ''}`}
          onClick={() => onJumpTo(location)}
        >
          {location.shortName || location.name}
        </Button>
      ))}
    </div>
  );
}
