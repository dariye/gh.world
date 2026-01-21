"use client"

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { BarChart3, TrendingUp } from "lucide-react";
import { Label, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
    commits: {
        label: "Commits",
        color: "hsl(var(--chart-1))",
    },
} satisfies ChartConfig

export function StatsSidebar() {
    const stats = useQuery(api.stats.getCurrentMonthStats);

    // Prepare chart data
    // Since we only have "totalCommits" broadly, for now, we'll visualize "Goal vs Current" or just a single radial value
    // Ideally, stats would have a goal, but we'll simulate a "monthly goal" dynamic for visualization or just show relative density
    const chartData = [
        {
            name: "activity",
            commits: stats?.totalCommits || 0,
            fill: "var(--color-commits)"
        },
    ]

    // Calculate dynamic angle based on hypothetical goal of 10k commits (for visual interest)
    const goal = 10000;
    const endAngle = Math.min(360, ((stats?.totalCommits || 0) / goal) * 360);

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white/60 hover:text-white hover:bg-white/10">
                    <BarChart3 className="h-6 w-6" />
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-[#000510] border-white/10 text-white w-[400px]">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-white">Monthly Insights</SheetTitle>
                    <SheetDescription className="text-white/40">
                        Real-time activity analysis
                    </SheetDescription>
                </SheetHeader>

                <div className="flex flex-col gap-8">
                    {/* RADIAL CHART */}
                    <div className="flex-1 pb-0">
                        <ChartContainer
                            config={chartConfig}
                            className="mx-auto aspect-square max-h-[250px]"
                        >
                            <RadialBarChart
                                data={chartData}
                                startAngle={0}
                                endAngle={endAngle}
                                innerRadius={80}
                                outerRadius={110}
                            >
                                <PolarGrid
                                    gridType="circle"
                                    radialLines={false}
                                    stroke="none"
                                    className="first:fill-muted last:fill-background"
                                    polarRadius={[86, 74]}
                                />
                                <RadialBar dataKey="commits" background cornerRadius={10} />
                                <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                                    <Label
                                        content={({ viewBox }) => {
                                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                return (
                                                    <text
                                                        x={viewBox.cx}
                                                        y={viewBox.cy}
                                                        textAnchor="middle"
                                                        dominantBaseline="middle"
                                                    >
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={viewBox.cy}
                                                            className="fill-foreground text-4xl font-bold fill-white"
                                                        >
                                                            {(stats?.totalCommits || 0).toLocaleString()}
                                                        </tspan>
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={(viewBox.cy || 0) + 24}
                                                            className="fill-muted-foreground fill-white/60"
                                                        >
                                                            Commits
                                                        </tspan>
                                                    </text>
                                                )
                                            }
                                        }}
                                    />
                                </PolarRadiusAxis>
                                {/* Tooltip for hover */}
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel nameKey="name" />}
                                />
                            </RadialBarChart>
                        </ChartContainer>
                        <div className="flex-col gap-2 text-sm text-center mt-4">
                            <div className="flex items-center justify-center gap-2 font-medium leading-none text-white">
                                Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
                            </div>
                            <div className="leading-none text-muted-foreground text-white/40 mt-2">
                                Showing total commits for {stats?.month || "Current Month"}
                            </div>
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <div className="text-xs text-white/40 uppercase font-mono mb-1">Contributors</div>
                            <div className="text-2xl font-bold">{stats?.uniqueContributors.toLocaleString() || 0}</div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <div className="text-xs text-white/40 uppercase font-mono mb-1">Geo Rate</div>
                            <div className="text-2xl font-bold">{(stats?.geolocationRate || 0 * 100).toFixed(1)}%</div>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
