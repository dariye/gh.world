"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";

const Separator = ({ className }: { className?: string }) => (
    <div className={`h-[1px] w-full bg-zinc-900 ${className}`} />
);
import {
    AreaChart,
    Area,
    LineChart,
    Line,
    RadialBarChart,
    RadialBar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

// ============================================
// ANIMATED COUNTER COMPONENT
// ============================================

function AnimatedCounter({ value, duration = 2000 }: { value: number; duration?: number }) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let startTime: number;
        let animationFrame: number;

        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);

            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            setDisplayValue(Math.floor(easeOutQuart * value));

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [value, duration]);

    return (
        <span className="tabular-nums">
            {displayValue.toLocaleString()}
        </span>
    );
}

// ============================================
// SECTION WRAPPER
// ============================================

function ChartSection({
    title,
    badge,
    children
}: {
    title: string;
    badge?: string;
    children: React.ReactNode
}) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                    {title}
                </h3>
                {badge && (
                    <Badge variant="outline" className="text-[9px] font-mono border-zinc-800 text-zinc-500 h-5 px-1.5 uppercase tracking-tighter">
                        {badge}
                    </Badge>
                )}
            </div>
            {children}
        </div>
    );
}

// ============================================
// CUSTOM TOOLTIP
// ============================================

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload) return null;

    return (
        <div className="bg-zinc-950/90 border border-zinc-800 rounded px-2.5 py-1.5 shadow-2xl backdrop-blur-md">
            {label && <p className="text-[10px] text-zinc-500 font-mono mb-1 uppercase">{label}</p>}
            {payload.map((entry: any, index: number) => (
                <div key={index} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                    <p className="text-xs font-mono text-zinc-200">
                        <span className="text-zinc-500">{entry.name}:</span> {entry.value?.toLocaleString()}
                    </p>
                </div>
            ))}
        </div>
    );
}

// ============================================
// MAIN DRAWER COMPONENT
// ============================================

const LANGUAGE_COLORS: Record<string, string> = {
    Python: "#3572A5",
    JavaScript: "#F7DF1E",
    TypeScript: "#3178C6",
    Go: "#00ADD8",
    Rust: "#DEA584",
    Java: "#B07219",
    Ruby: "#CC342D",
    "C++": "#F34B7D",
    PHP: "#4F5D95",
    Swift: "#F05138",
    Kotlin: "#A97BFF",
    Other: "#6B7280",
};

export function StatsSidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const currentStats = useQuery(api.stats.getCurrentMonthStats);
    const historicalStats = useQuery(api.stats.getHistoricalStats, { days: 7 });

    const totalCommits = currentStats?.totalCommits || 0;

    // Transform language data for radial chart
    const languageData = useMemo(() => {
        if (!currentStats?.byLanguage) return [];

        return Object.entries(currentStats.byLanguage)
            .map(([name, value]) => ({
                name,
                value,
                fill: LANGUAGE_COLORS[name] || LANGUAGE_COLORS.Other,
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);
    }, [currentStats]);

    // Transform historical data for area/line charts
    const timeSeriesData = useMemo(() => {
        if (!historicalStats) return [];

        return [...historicalStats].reverse().map(d => ({
            date: d.date.split("-").slice(1).join("/"), // MM/DD
            commits: d.totalCommits,
            contributors: d.uniqueContributors,
            ...d.byLanguage
        }));
    }, [historicalStats]);

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 sm:h-9 sm:w-9 bg-zinc-900/40 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 backdrop-blur-sm transition-all"
                >
                    <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
            </SheetTrigger>

            <SheetContent
                side="right"
                className="w-full sm:w-[420px] bg-zinc-950 border-zinc-900 p-0 flex flex-col"
            >
                <SheetHeader className="p-6 pb-4 border-b border-zinc-900 flex-shrink-0">
                    <SheetTitle className="text-zinc-100 flex items-center gap-2 text-sm font-bold tracking-tight">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        LIVE GLOBAL INSIGHTS
                    </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="p-6 space-y-8">

                        {/* ========== BIG TICKER ========== */}
                        <div className="bg-gradient-to-br from-zinc-900/50 to-transparent border border-zinc-900 rounded-xl p-6 shadow-2xl">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-3">
                                Total Commits Tracked
                            </p>
                            <p className="text-4xl font-bold text-zinc-100 tracking-tighter">
                                <AnimatedCounter value={totalCommits} />
                            </p>
                            <div className="flex items-center gap-2 mt-4">
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] uppercase font-mono tracking-tighter">
                                    CONNECTED
                                </Badge>
                                <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
                                    Real-time updates active
                                </span>
                            </div>
                        </div>

                        {/* ========== LANGUAGE RADIAL ========== */}
                        <ChartSection title="Primary Languages" badge="top 6">
                            <div className="h-[200px] -mx-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadialBarChart
                                        cx="50%"
                                        cy="50%"
                                        innerRadius="30%"
                                        outerRadius="100%"
                                        data={languageData}
                                        startAngle={90}
                                        endAngle={-270}
                                    >
                                        <RadialBar
                                            dataKey="value"
                                            cornerRadius={10}
                                            background={{ fill: "#18181b" }}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend
                                            iconType="circle"
                                            iconSize={6}
                                            layout="vertical"
                                            verticalAlign="middle"
                                            align="right"
                                            wrapperStyle={{ fontSize: "10px", color: "#71717a", fontFamily: "monospace" }}
                                        />
                                    </RadialBarChart>
                                </ResponsiveContainer>
                            </div>
                        </ChartSection>

                        <Separator className="bg-zinc-900" />

                        {/* ========== CUMULATIVE AREA ========== */}
                        <ChartSection title="Activity Trend" badge="last 7 days">
                            <div className="h-[160px] -mx-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={timeSeriesData}>
                                        <defs>
                                            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#10B981" stopOpacity={0.2} />
                                                <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 9, fill: "#3f3f46", fontFamily: "monospace" }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 9, fill: "#3f3f46", fontFamily: "monospace" }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area
                                            type="monotone"
                                            dataKey="commits"
                                            stroke="#10B981"
                                            strokeWidth={1.5}
                                            fill="url(#trendGradient)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </ChartSection>

                        <Separator className="bg-zinc-900" />

                        {/* ========== UNIQUE CONTRIBUTORS LINE ========== */}
                        <ChartSection title="Collaborator Growth" badge="unique">
                            <div className="h-[160px] -mx-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={timeSeriesData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 9, fill: "#3f3f46", fontFamily: "monospace" }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 9, fill: "#3f3f46", fontFamily: "monospace" }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Line
                                            type="monotone"
                                            dataKey="contributors"
                                            stroke="#A78BFA"
                                            strokeWidth={1.5}
                                            dot={{ fill: "#A78BFA", r: 2 }}
                                            activeDot={{ r: 4 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </ChartSection>

                    </div>
                </div>

                <div className="p-6 border-t border-zinc-900 flex-shrink-0 text-center">
                    <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest leading-loose">
                        gh.world version 1.0.4<br />
                        built with convex & next.js
                    </p>
                </div>
            </SheetContent>
        </Sheet>
    );
}

export default StatsSidebar;
