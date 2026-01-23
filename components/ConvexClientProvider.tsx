"use client";

import { ReactNode, useMemo } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexErrorBoundary } from "./ConvexErrorBoundary";

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  // Memoize the client to prevent recreation on re-renders
  const convex = useMemo(() => {
    if (!convexUrl) {
      console.error("NEXT_PUBLIC_CONVEX_URL is not configured");
      return null;
    }
    return new ConvexReactClient(convexUrl);
  }, [convexUrl]);

  // Show error state if Convex URL is not configured
  if (!convex) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-bold text-zinc-100">Configuration Error</h1>
          <p className="text-sm text-zinc-400">
            The application is not properly configured.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ConvexErrorBoundary>
      <ConvexProvider client={convex}>{children}</ConvexProvider>
    </ConvexErrorBoundary>
  );
}
