"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/data";
import { ChevronDown, RefreshCw } from "lucide-react";

interface LiveBalanceBarProps {
    tripName: string;
    totalSpent: number;
    youPaid: number;
    youOwe: number;
    youGetBack: number;
}

export function LiveBalanceBar({
    tripName,
    totalSpent,
    youPaid,
    youOwe,
    youGetBack,
}: LiveBalanceBarProps) {
    const [expanded, setExpanded] = useState(false);
    const [syncing, setSyncing] = useState(false);

    const netBalance = youGetBack - youOwe;

    const handleSync = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSyncing(true);
        setTimeout(() => setSyncing(false), 1200);
    };

    return (
        <motion.div
            layout
            onClick={() => setExpanded(!expanded)}
            className="bg-card paper-texture border border-border/80 rounded-2xl shadow-card cursor-pointer overflow-hidden z-20 relative"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
            {/* Collapsed Header Area */}
            <div className="p-4 flex items-center justify-between relative z-10">
                <div className="flex flex-col">
                    <motion.p layout="position" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {tripName}
                    </motion.p>
                    <motion.div layout="position" className="flex items-center gap-2 mt-0.5">
                        <span className="text-[15px] font-bold text-foreground">
                            Net Balance
                        </span>
                        <span
                            className={`text-[15px] font-bold tabular-nums ${netBalance >= 0 ? "text-success" : "text-danger"
                                }`}
                        >
                            {netBalance >= 0 ? "+" : ""}
                            {formatCurrency(Math.abs(netBalance))}
                        </span>
                    </motion.div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSync}
                        className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
                    >
                        <RefreshCw
                            className={`w-3.5 h-3.5 text-muted-foreground ${syncing ? "animate-spin text-primary" : ""
                                }`}
                        />
                    </button>
                    <motion.div
                        animate={{ rotate: expanded ? 180 : 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="w-6 h-6 flex items-center justify-center text-muted-foreground"
                    >
                        <ChevronDown className="w-5 h-5" />
                    </motion.div>
                </div>
            </div>

            {/* Expanded Area */}
            <AnimatePresence initial={false}>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    >
                        <div className="px-4 pb-5 pt-1 border-t border-border/40">
                            <div className="grid grid-cols-2 gap-y-4 gap-x-2 mt-3">

                                <div>
                                    <p className="text-[11px] text-muted-foreground font-medium mb-1">
                                        Total Trip Spend
                                    </p>
                                    <p className="text-[17px] font-semibold tabular-nums text-foreground">
                                        {formatCurrency(totalSpent)}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[11px] text-muted-foreground font-medium mb-1">
                                        You Paid
                                    </p>
                                    <p className="text-[17px] font-semibold tabular-nums text-foreground">
                                        {formatCurrency(youPaid)}
                                    </p>
                                </div>

                                <div className="bg-success/10 border border-success/20 rounded-xl p-3">
                                    <p className="text-[11px] text-success/80 font-semibold uppercase tracking-wider mb-1">
                                        You Get Back
                                    </p>
                                    <p className="text-[18px] font-bold tabular-nums text-success">
                                        {formatCurrency(youGetBack)}
                                    </p>
                                </div>

                                <div className="bg-danger/10 border border-danger/20 rounded-xl p-3">
                                    <p className="text-[11px] text-danger/80 font-semibold uppercase tracking-wider mb-1">
                                        You Owe
                                    </p>
                                    <p className="text-[18px] font-bold tabular-nums text-danger">
                                        {formatCurrency(youOwe)}
                                    </p>
                                </div>

                            </div>

                            <div className="flex items-center justify-center mt-5">
                                {syncing ? (
                                    <span className="text-[10px] text-primary font-medium animate-pulse">
                                        Syncing with cloud...
                                    </span>
                                ) : (
                                    <span className="text-[10px] text-muted-foreground/50">
                                        Updated just now
                                    </span>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
