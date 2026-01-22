import { useState, useCallback } from "react";
import { TargetLocation } from "@/components/Globe";
import { Location } from "@/components/LocationQuickJump";

interface UseNavigationReturn {
  targetLocation: TargetLocation | null;
  handleJumpToLocation: (location: Location) => void;
}

export function useNavigation(): UseNavigationReturn {
  const [targetLocation, setTargetLocation] = useState<TargetLocation | null>(null);

  const handleJumpToLocation = useCallback((location: Location) => {
    setTargetLocation({ lat: location.lat, lng: location.lng });
  }, []);

  return {
    targetLocation,
    handleJumpToLocation,
  };
}
