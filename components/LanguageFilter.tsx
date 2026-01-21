"use client";

import { cn } from "@/lib/utils";

const LANGUAGES = [
    { value: "all", label: "All", color: "#FFFFFF" },
    { value: "Python", label: "Python", color: "#3572A5" },
    { value: "JavaScript", label: "JS", color: "#F7DF1E" },
    { value: "TypeScript", label: "TS", color: "#3178C6" },
    { value: "Go", label: "Go", color: "#00ADD8" },
    { value: "Rust", label: "Rust", color: "#DEA584" },
    { value: "Java", label: "Java", color: "#B07219" },
    { value: "Other", label: "Other", color: "#8B8B8B" },
];

interface LanguageFilterProps {
    value: string | null;
    onChange: (language: string | null) => void;
}

export default function LanguageFilter({ value, onChange }: LanguageFilterProps) {
    const selectedValue = value || "all";

    return (
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-1 px-0.5">
            {LANGUAGES.map((language) => {
                const isActive = selectedValue === language.value;
                return (
                    <button
                        key={language.value}
                        onClick={() => onChange(language.value === "all" ? null : language.value)}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                            "border backdrop-blur-sm",
                            isActive
                                ? "border-transparent text-white shadow-lg"
                                : "border-white/10 text-white/60 bg-black/40 hover:bg-white/10 hover:text-white/80"
                        )}
                        style={isActive ? {
                            backgroundColor: language.color,
                            color: language.value === "JavaScript" || language.value === "all" ? "#000" : "#fff",
                            boxShadow: `0 0 12px ${language.color}40`
                        } : undefined}
                    >
                        {!isActive && (
                            <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: language.color }}
                            />
                        )}
                        {language.label}
                    </button>
                );
            })}
        </div>
    );
}
