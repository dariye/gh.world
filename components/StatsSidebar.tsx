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
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
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
// LANGUAGE BAR COMPONENT
// ============================================

interface LanguageBarData {
    name: string;
    value: number;
    percent: number;
    fill: string;
}

function LanguageBar({ data, maxValue }: { data: LanguageBarData; maxValue: number }) {
    const barWidth = (data.value / maxValue) * 100;

    return (
        <div className="group flex items-center gap-3 py-1.5">
            <div
                className="w-2 h-2 rounded-full flex-shrink-0 transition-transform group-hover:scale-125"
                style={{ backgroundColor: data.fill }}
            />
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono text-zinc-300 truncate pr-2">
                        {data.name}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 tabular-nums flex-shrink-0">
                        {data.percent.toFixed(1)}%
                    </span>
                </div>
                <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                            width: `${barWidth}%`,
                            backgroundColor: data.fill,
                        }}
                    />
                </div>
            </div>
            <span className="text-[10px] font-mono text-zinc-600 tabular-nums w-12 text-right flex-shrink-0">
                {data.value.toLocaleString()}
            </span>
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
    "C#": "#178600",
    C: "#555555",
    PHP: "#4F5D95",
    Swift: "#F05138",
    Kotlin: "#A97BFF",
    Scala: "#C22D40",
    Shell: "#89E051",
    Bash: "#89E051",
    PowerShell: "#012456",
    Perl: "#0298C3",
    R: "#198CE7",
    Lua: "#000080",
    Dart: "#00B4AB",
    Elixir: "#6E4A7E",
    Clojure: "#DB5855",
    Haskell: "#5E5086",
    Julia: "#A270BA",
    "Objective-C": "#438EFF",
    Groovy: "#4298B8",
    HTML: "#E34C26",
    CSS: "#563D7C",
    SCSS: "#C6538C",
    Vue: "#41B883",
    Svelte: "#FF3E00",
    SQL: "#E38C00",
    YAML: "#CB171E",
    JSON: "#292929",
    Markdown: "#083FA1",
    Dockerfile: "#384D54",
    Makefile: "#427819",
    Terraform: "#5C4EE5",
    HCL: "#5C4EE5",
    Nix: "#7E7EFF",
    Zig: "#EC915C",
    OCaml: "#3BE133",
    "F#": "#B845FC",
    Erlang: "#B83998",
    Nim: "#FFE953",
    Crystal: "#000100",
    V: "#4F87C4",
    Other: "#6B7280",
};

interface StatsSidebarProps {
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function StatsSidebar({ isOpen: controlledIsOpen, onOpenChange }: StatsSidebarProps = {}) {
    const [internalIsOpen, setInternalIsOpen] = useState(false);

    // Support both controlled and uncontrolled modes
    const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
    const setIsOpen = onOpenChange || setInternalIsOpen;
    const currentStats = useQuery(api.stats.getCurrentMonthStats);
    const historicalStats = useQuery(api.stats.getHistoricalStats, { days: 7 });

    const totalCommits = currentStats?.totalCommits || 0;

    // Transform language data for bar chart - show all languages, group small ones
    const languageData = useMemo(() => {
        if (!currentStats?.byLanguage) return [];

        const entries = Object.entries(currentStats.byLanguage);
        const total = entries.reduce((sum, [, val]) => sum + val, 0);
        if (total === 0) return [];

        // Sort by value descending
        const sorted = entries
            .map(([name, value]) => ({
                name,
                value,
                percent: (value / total) * 100,
                fill: LANGUAGE_COLORS[name] || LANGUAGE_COLORS.Other,
            }))
            .sort((a, b) => b.value - a.value);

        // Group languages under 1% into "Other"
        const threshold = 1;
        const significant = sorted.filter(d => d.percent >= threshold);
        const small = sorted.filter(d => d.percent < threshold);

        if (small.length > 0) {
            const otherValue = small.reduce((sum, d) => sum + d.value, 0);
            const otherPercent = (otherValue / total) * 100;
            significant.push({
                name: `Other (${small.length})`,
                value: otherValue,
                percent: otherPercent,
                fill: LANGUAGE_COLORS.Other,
            });
        }

        return significant;
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
                        </div>

                        {/* ========== LANGUAGE BREAKDOWN ========== */}
                        <ChartSection title="Languages" badge={`${languageData.length} tracked`}>
                            <div className="max-h-[280px] overflow-y-auto custom-scrollbar pr-1 -mr-1">
                                {languageData.length > 0 ? (
                                    languageData.map((lang) => (
                                        <LanguageBar
                                            key={lang.name}
                                            data={lang}
                                            maxValue={languageData[0]?.value || 1}
                                        />
                                    ))
                                ) : (
                                    <p className="text-[11px] text-zinc-600 font-mono py-4 text-center">
                                        No language data yet
                                    </p>
                                )}
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
                    <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
                        Stats from the last 30 days
                    </p>
                </div>
            </SheetContent>
        </Sheet>
    );
}

export default StatsSidebar;
