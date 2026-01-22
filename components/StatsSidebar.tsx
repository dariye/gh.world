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
import { BarChart3, Globe, TrendingUp, TrendingDown, Minus, Clock } from "lucide-react";

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
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Cell,
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

// ============================================
// REGION COLORS
// ============================================

const REGION_COLORS: Record<string, string> = {
    "North America": "#3B82F6",
    "South America": "#10B981",
    "Europe": "#8B5CF6",
    "Africa": "#F59E0B",
    "Asia": "#EF4444",
    "Oceania": "#06B6D4",
};

// ============================================
// TAB BUTTON COMPONENT
// ============================================

function TabButton({
    active,
    onClick,
    children,
    icon: Icon,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    icon: React.ElementType;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                active
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
            }`}
        >
            <Icon className="h-3 w-3" />
            {children}
        </button>
    );
}

// ============================================
// TREND INDICATOR
// ============================================

function TrendIndicator({ trend, change }: { trend: "up" | "down" | "stable"; change: number }) {
    if (trend === "up") {
        return (
            <span className="flex items-center gap-0.5 text-emerald-400 text-[9px] font-mono">
                <TrendingUp className="h-3 w-3" />+{change}%
            </span>
        );
    }
    if (trend === "down") {
        return (
            <span className="flex items-center gap-0.5 text-red-400 text-[9px] font-mono">
                <TrendingDown className="h-3 w-3" />{change}%
            </span>
        );
    }
    return (
        <span className="flex items-center gap-0.5 text-zinc-500 text-[9px] font-mono">
            <Minus className="h-3 w-3" />stable
        </span>
    );
}

interface StatsSidebarProps {
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function StatsSidebar({ isOpen: controlledIsOpen, onOpenChange }: StatsSidebarProps = {}) {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"overview" | "global">("overview");

    // Support both controlled and uncontrolled modes
    const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
    const setIsOpen = onOpenChange || setInternalIsOpen;

    // Overview data
    const currentStats = useQuery(api.stats.getCurrentMonthStats);
    const historicalStats = useQuery(api.stats.getHistoricalStats, { days: 7 });

    // Global activity data (only fetch when on global tab to save resources)
    const hourlyActivity = useQuery(
        api.stats.getHourlyActivity,
        activeTab === "global" ? {} : "skip"
    );
    const regionalActivity = useQuery(
        api.stats.getRegionalActivity,
        activeTab === "global" ? {} : "skip"
    );
    const languageTrends = useQuery(
        api.stats.getLanguageTrends,
        activeTab === "global" ? {} : "skip"
    );
    const peakActivity = useQuery(
        api.stats.getPeakActivityByRegion,
        activeTab === "global" ? {} : "skip"
    );

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
                    className="h-8 w-8 sm:h-8 sm:w-8 md:h-9 md:w-9 bg-zinc-900/40 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 backdrop-blur-sm transition-all"
                >
                    <BarChart3 className="h-3.5 w-3.5 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                </Button>
            </SheetTrigger>

            <SheetContent
                side="right"
                className="w-full sm:w-[380px] md:w-[420px] bg-zinc-950 border-zinc-900 p-0 flex flex-col"
            >
                <SheetHeader className="p-6 pb-4 border-b border-zinc-900 flex-shrink-0">
                    <SheetTitle className="text-zinc-100 flex items-center gap-2 text-sm font-bold tracking-tight">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        LIVE GLOBAL INSIGHTS
                    </SheetTitle>

                    {/* Tab Navigation */}
                    <div className="flex gap-1 mt-3 bg-zinc-900/30 p-1 rounded-lg">
                        <TabButton
                            active={activeTab === "overview"}
                            onClick={() => setActiveTab("overview")}
                            icon={BarChart3}
                        >
                            Overview
                        </TabButton>
                        <TabButton
                            active={activeTab === "global"}
                            onClick={() => setActiveTab("global")}
                            icon={Globe}
                        >
                            Global Activity
                        </TabButton>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {activeTab === "overview" ? (
                        <OverviewTab
                            totalCommits={totalCommits}
                            languageData={languageData}
                            timeSeriesData={timeSeriesData}
                        />
                    ) : (
                        <GlobalActivityTab
                            hourlyActivity={hourlyActivity}
                            regionalActivity={regionalActivity}
                            languageTrends={languageTrends}
                            peakActivity={peakActivity}
                        />
                    )}
                </div>

                <div className="p-6 border-t border-zinc-900 flex-shrink-0 text-center">
                    <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
                        {activeTab === "overview" ? "Stats from the last 30 days" : "Real-time global activity"}
                    </p>
                </div>
            </SheetContent>
        </Sheet>
    );
}

// ============================================
// OVERVIEW TAB
// ============================================

function OverviewTab({
    totalCommits,
    languageData,
    timeSeriesData,
}: {
    totalCommits: number;
    languageData: Array<{ name: string; value: number; fill: string }>;
    timeSeriesData: Array<Record<string, unknown>>;
}) {
    return (
        <div className="p-6 space-y-8">
            {/* ========== BIG TICKER ========== */}
            <div className="bg-gradient-to-br from-zinc-900/50 to-transparent border border-zinc-900 rounded-xl p-6 shadow-2xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-3">
                    Total Commits Tracked
                </p>
                <p className="text-4xl font-bold text-zinc-100 tracking-tighter">
                    <AnimatedCounter value={totalCommits} />
                </p>
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
    );
}

// ============================================
// GLOBAL ACTIVITY TAB
// ============================================

interface HourlyData {
    hour: number;
    label: string;
    commits: number;
}

interface RegionalData {
    region: string;
    commits: number;
    topLanguage: string;
}

interface LanguageTrendData {
    language: string;
    data: Array<{ date: string; commits: number }>;
    trend: "up" | "down" | "stable";
    change: number;
}

interface PeakActivityData {
    region: string;
    peakHourUTC: number;
    peakLabel: string;
    totalCommits: number;
    hourlyData: Array<{ hour: number; commits: number }>;
}

function GlobalActivityTab({
    hourlyActivity,
    regionalActivity,
    languageTrends,
    peakActivity,
}: {
    hourlyActivity: HourlyData[] | undefined;
    regionalActivity: RegionalData[] | undefined;
    languageTrends: LanguageTrendData[] | undefined;
    peakActivity: PeakActivityData[] | undefined;
}) {
    // Find the current hour for highlighting
    const currentHourUTC = new Date().getUTCHours();

    return (
        <div className="p-6 space-y-8">
            {/* ========== HOURLY ACTIVITY ========== */}
            <ChartSection title="When The World Codes" badge="last 24h">
                <p className="text-[10px] text-zinc-500 mb-2">
                    Commit activity by hour (UTC). Current hour highlighted.
                </p>
                <div className="h-[140px] -mx-4">
                    {hourlyActivity ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={hourlyActivity}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                                <XAxis
                                    dataKey="hour"
                                    tick={{ fontSize: 8, fill: "#3f3f46", fontFamily: "monospace" }}
                                    axisLine={false}
                                    tickLine={false}
                                    interval={2}
                                    tickFormatter={(h) => `${h}`}
                                />
                                <YAxis
                                    tick={{ fontSize: 9, fill: "#3f3f46", fontFamily: "monospace" }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={30}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="commits" radius={[2, 2, 0, 0]}>
                                    {hourlyActivity.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.hour === currentHourUTC ? "#10B981" : "#3f3f46"}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-zinc-600 text-sm">
                            Loading hourly data...
                        </div>
                    )}
                </div>
            </ChartSection>

            <Separator className="bg-zinc-900" />

            {/* ========== REGIONAL ACTIVITY ========== */}
            <ChartSection title="Geographic Distribution" badge="7 days">
                <p className="text-[10px] text-zinc-500 mb-3">
                    Where code is being written around the world.
                </p>
                {regionalActivity ? (
                    <div className="space-y-2">
                        {regionalActivity.map((region) => {
                            const maxCommits = Math.max(...regionalActivity.map(r => r.commits));
                            const percentage = maxCommits > 0 ? (region.commits / maxCommits) * 100 : 0;

                            return (
                                <div key={region.region} className="space-y-1">
                                    <div className="flex justify-between items-center text-[10px]">
                                        <span className="text-zinc-300 font-medium">{region.region}</span>
                                        <span className="text-zinc-500 font-mono">
                                            {region.commits.toLocaleString()} commits
                                        </span>
                                    </div>
                                    <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${percentage}%`,
                                                backgroundColor: REGION_COLORS[region.region] || "#6B7280",
                                            }}
                                        />
                                    </div>
                                    <div className="text-[9px] text-zinc-600 font-mono">
                                        Top language: {region.topLanguage}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="h-32 flex items-center justify-center text-zinc-600 text-sm">
                        Loading regional data...
                    </div>
                )}
            </ChartSection>

            <Separator className="bg-zinc-900" />

            {/* ========== LANGUAGE TRENDS ========== */}
            <ChartSection title="Language Trends" badge="7 days">
                <p className="text-[10px] text-zinc-500 mb-3">
                    Which languages are gaining or losing momentum.
                </p>
                {languageTrends && languageTrends.length > 0 ? (
                    <div className="space-y-2">
                        {languageTrends.slice(0, 6).map((lang) => (
                            <div
                                key={lang.language}
                                className="flex items-center justify-between bg-zinc-900/30 px-3 py-2 rounded-lg"
                            >
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{
                                            backgroundColor:
                                                LANGUAGE_COLORS[lang.language] || LANGUAGE_COLORS.Other,
                                        }}
                                    />
                                    <span className="text-[11px] text-zinc-200 font-medium">
                                        {lang.language}
                                    </span>
                                </div>
                                <TrendIndicator trend={lang.trend} change={lang.change} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-32 flex items-center justify-center text-zinc-600 text-sm">
                        {languageTrends === undefined ? "Loading trends..." : "Not enough data for trends"}
                    </div>
                )}
            </ChartSection>

            <Separator className="bg-zinc-900" />

            {/* ========== PEAK ACTIVITY BY REGION ========== */}
            <ChartSection title="Peak Hours by Region" badge="24h">
                <p className="text-[10px] text-zinc-500 mb-3">
                    When each region is most active (UTC time).
                </p>
                {peakActivity ? (
                    <div className="grid grid-cols-3 gap-2">
                        {peakActivity.map((region) => (
                            <div
                                key={region.region}
                                className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-center"
                            >
                                <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mb-1">
                                    {region.region.split("/")[0]}
                                </div>
                                <div className="flex items-center justify-center gap-1 text-zinc-200">
                                    <Clock className="h-3 w-3 text-zinc-500" />
                                    <span className="text-sm font-mono font-bold">
                                        {region.peakLabel.replace(" UTC", "")}
                                    </span>
                                </div>
                                <div className="text-[9px] text-zinc-600 mt-1 font-mono">
                                    {region.totalCommits.toLocaleString()} total
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-24 flex items-center justify-center text-zinc-600 text-sm">
                        Loading peak activity...
                    </div>
                )}
            </ChartSection>
        </div>
    );
}

export default StatsSidebar;
