"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

const LANGUAGES = [
    { value: "all", label: "All Languages", color: "#FFFFFF" },
    { value: "Python", label: "Python", color: "#3572A5" },
    { value: "JavaScript", label: "JavaScript", color: "#F7DF1E" },
    { value: "TypeScript", label: "TypeScript", color: "#3178C6" },
    { value: "Go", label: "Go", color: "#00ADD8" },
    { value: "Rust", label: "Rust", color: "#DEA584" },
    { value: "Java", label: "Java", color: "#B07219" },
    { value: "Ruby", label: "Ruby", color: "#CC342D" },
    { value: "C++", label: "C++", color: "#F34B7D" },
    { value: "PHP", label: "PHP", color: "#4F5D95" },
    { value: "Swift", label: "Swift", color: "#F05138" },
    { value: "Kotlin", label: "Kotlin", color: "#A97BFF" },
    { value: "Other", label: "Other", color: "#8B8B8B" },
];

interface LanguageFilterProps {
    value: string | null;
    onChange: (language: string | null) => void;
}

export default function LanguageFilter({ value, onChange }: LanguageFilterProps) {
    const [open, setOpen] = useState(false);

    const selectedLanguage = LANGUAGES.find(
        (lang) => lang.value === (value || "all")
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[180px] justify-between bg-black/40 border-white/10 text-white/80 hover:bg-white/10 hover:text-white"
                >
                    <span className="flex items-center gap-2">
                        <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: selectedLanguage?.color }}
                        />
                        {selectedLanguage?.label || "All Languages"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0 bg-black/90 border-white/10">
                <Command className="bg-transparent">
                    <CommandInput
                        placeholder="Search languages..."
                        className="text-white/80"
                    />
                    <CommandList>
                        <CommandEmpty className="text-white/40">
                            No language found.
                        </CommandEmpty>
                        <CommandGroup>
                            {LANGUAGES.map((language) => (
                                <CommandItem
                                    key={language.value}
                                    value={language.value}
                                    onSelect={(currentValue) => {
                                        onChange(currentValue === "all" ? null : currentValue);
                                        setOpen(false);
                                    }}
                                    className="text-white/80 hover:bg-white/10"
                                >
                                    <span
                                        className="w-3 h-3 rounded-full mr-2"
                                        style={{ backgroundColor: language.color }}
                                    />
                                    {language.label}
                                    <Check
                                        className={cn(
                                            "ml-auto h-4 w-4",
                                            (value || "all") === language.value
                                                ? "opacity-100"
                                                : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
