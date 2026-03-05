"use client";

import { motion } from "framer-motion";
import { TripMember } from "@/lib/data";

interface AvatarChipProps {
    member: TripMember;
    selected?: boolean;
    onToggle?: () => void;
    size?: "sm" | "md" | "lg";
    showName?: boolean;
}

export function AvatarChip({
    member,
    selected = false,
    onToggle,
    size = "md",
    showName = true,
}: AvatarChipProps) {
    const sizes = {
        sm: "w-8 h-8 text-[10px]",
        md: "w-10 h-10 text-xs",
        lg: "w-12 h-12 text-sm",
    };

    return (
        <motion.button
            type="button"
            onClick={onToggle}
            whileTap={{ scale: 0.92 }}
            className={`flex flex-col items-center gap-1.5 ${onToggle ? "cursor-pointer" : "cursor-default"
                }`}
        >
            <div className="relative">
                <div
                    className={`${sizes[size]} ${member.color} rounded-full flex items-center justify-center font-semibold text-white transition-all duration-200 ${selected
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                            : "opacity-50"
                        }`}
                >
                    {member.initials}
                </div>
                {selected && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center"
                    >
                        <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </motion.div>
                )}
            </div>
            {showName && (
                <span
                    className={`text-[11px] font-medium transition-colors ${selected ? "text-foreground" : "text-muted-foreground"
                        }`}
                >
                    {member.name}
                </span>
            )}
        </motion.button>
    );
}
