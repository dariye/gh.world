"use client";

import { Component, ReactNode } from "react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ConvexErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error for debugging
        console.error("Convex error caught by boundary:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // Check if this is a Convex-related error
            const isConvexError =
                this.state.error?.message?.includes("Convex") ||
                this.state.error?.message?.includes("Server Error") ||
                this.state.error?.message?.includes("4") || // 4xx errors
                this.state.error?.name === "ConvexError";

            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex items-center justify-center min-h-screen bg-[#060a0f] text-white">
                    <div className="text-center max-w-md p-6">
                        <div className="text-4xl mb-4">🌍</div>
                        <h1 className="text-xl font-bold mb-2">gh.world</h1>
                        {isConvexError ? (
                            <>
                                <p className="text-white/60 text-sm mb-4">
                                    The real-time data service is temporarily unavailable.
                                    This usually happens when our free tier limits are exceeded.
                                </p>
                                <p className="text-white/40 text-xs">
                                    Please check back later or visit{" "}
                                    <a
                                        href="https://github.com/dariye/ghworld"
                                        className="text-blue-400 hover:underline"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        our GitHub
                                    </a>{" "}
                                    for updates.
                                </p>
                            </>
                        ) : (
                            <p className="text-white/60 text-sm">
                                Something went wrong. Please try refreshing the page.
                            </p>
                        )}
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-sm transition-colors"
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
