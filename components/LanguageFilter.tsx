"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { LANGUAGE_COLORS, SUPPORTED_LANGUAGES } from "@/lib/colors";
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
    ...SUPPORTED_LANGUAGES.map((lang) => ({
        value: lang,
        label: lang,
        color: LANGUAGE_COLORS[lang],
    })),
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
