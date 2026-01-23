"use client";

import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Globe } from "lucide-react";

interface Props {
    children: ReactNode;
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
        console.error("Convex Error:", error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
                    <div className="max-w-md w-full text-center space-y-6">
                        <div className="flex justify-center">
                            <Globe className="w-16 h-16 text-zinc-700" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-xl font-bold text-zinc-100">
                                Connection Lost
                            </h1>
                            <p className="text-sm text-zinc-400">
                                Unable to connect to the data server. This could be a temporary network issue.
                            </p>
                        </div>
                        <Button
                            onClick={this.handleRetry}
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Try Again
                        </Button>
                        <p className="text-xs text-zinc-600">
                            If the problem persists, please check your internet connection.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ConvexErrorBoundary;
