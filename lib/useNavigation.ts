import { useState } from "react";
import { TargetLocation } from "@/components/Globe";

interface UseNavigationReturn {
  targetLocation: TargetLocation | null;
}

export function useNavigation(): UseNavigationReturn {
  const [targetLocation] = useState<TargetLocation | null>(null);

  return {
    targetLocation,
  };
}
