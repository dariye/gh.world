import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BarChart, Activity, Users, Globe } from "lucide-react";

interface StatsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function StatsPanel({ isOpen, onClose }: StatsPanelProps) {
    const stats = useQuery(api.stats.getCurrentMonthStats);

    return (
        <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DrawerContent className="bg-[#000510] border-white/10 text-white max-h-[85vh]">
                <DrawerHeader>
                    <div className="flex items-center gap-2 text-blue-400 mb-2">
                        <BarChart className="w-5 h-5" />
                        <span className="text-sm font-mono tracking-widest uppercase">Global Activity</span>
                    </div>
                    <DrawerTitle className="text-2xl font-bold">
                        Monthly Statistics
                    </DrawerTitle>
                    <DrawerDescription className="text-white/60">
                        Insights for {stats?.month || new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </DrawerDescription>
                </DrawerHeader>

                <div className="p-4 flex flex-col gap-6 overflow-y-auto">
                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <div className="flex items-center gap-2 text-white/60 text-xs mb-1">
                                <Activity className="w-3 h-3" /> TOTAL COMMITS
                            </div>
                            <div className="text-2xl font-bold">{stats?.totalCommits.toLocaleString() ?? "-"}</div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <div className="flex items-center gap-2 text-white/60 text-xs mb-1">
                                <Users className="w-3 h-3" /> CONTRIBUTORS
                            </div>
                            <div className="text-2xl font-bold">{stats?.uniqueContributors.toLocaleString() ?? "-"}</div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 col-span-2">
                            <div className="flex items-center gap-2 text-white/60 text-xs mb-1">
                                <Globe className="w-3 h-3" /> GEOLOCATION RATE
                            </div>
                            <div className="text-2xl font-bold">
                                {stats ? `${(stats.geolocationRate * 100).toFixed(1)}%` : "-"}
                            </div>
                        </div>
                    </div>

                    {/* Language Breakdown */}
                    <div>
                        <h3 className="text-sm font-semibold mb-3">Top Languages</h3>
                        <div className="space-y-3">
                            {stats?.byLanguage && Object.entries(stats.byLanguage)
                                .sort(([, a], [, b]) => b - a)
                                .slice(0, 5)
                                .map(([lang, count], i) => (
                                    <div key={lang} className="flex items-center gap-3">
                                        <div className="w-6 text-xs text-white/40 font-mono">#{i + 1}</div>
                                        <div className="flex-1">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>{lang}</span>
                                                <span className="text-white/60">{count.toLocaleString()}</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full"
                                                    style={{ width: `${(count / (stats.totalCommits || 1)) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            }
                            {!stats && <div className="text-white/40 text-sm">Loading stats...</div>}
                        </div>
                    </div>
                </div>

                <DrawerFooter>
                    <DrawerClose asChild>
                        <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/10">
                            Close Report
                        </Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
