"use client";

import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/data";
import { TrendingDown, TrendingUp } from "lucide-react";

interface BalanceSummaryProps {
    youOwe: number;
    youGetBack: number;
}

export function BalanceSummary({ youOwe, youGetBack }: BalanceSummaryProps) {
    const netBalance = youGetBack - youOwe;

    return (
        <div className="grid grid-cols-2 gap-3">
            {/* You Get Back */}
            <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, duration: 0.35 }}
                className="bg-card paper-texture border border-border/60 rounded-2xl p-4 shadow-card"
            >
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                        You get back
                    </span>
                </div>
                <p className="text-xl font-bold tabular-nums text-emerald-700">
                    {formatCurrency(youGetBack)}
                </p>
            </motion.div>

            {/* You Owe */}
            <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.35 }}
                className="bg-card paper-texture border border-border/60 rounded-2xl p-4 shadow-card"
            >
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center">
                        <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                        You owe
                    </span>
                </div>
                <p className="text-xl font-bold tabular-nums text-rose-600">
                    {formatCurrency(youOwe)}
                </p>
            </motion.div>

            {/* Net balance bar */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="col-span-2 bg-card border border-border/60 rounded-xl px-4 py-3 shadow-soft flex items-center justify-between"
            >
                <span className="text-[12px] font-medium text-muted-foreground">
                    Net Balance
                </span>
                <span
                    className={`text-[15px] font-bold tabular-nums ${netBalance >= 0 ? "text-emerald-700" : "text-rose-600"
                        }`}
                >
                    {netBalance >= 0 ? "+" : ""}
                    {formatCurrency(Math.abs(netBalance))}
                </span>
            </motion.div>
        </div>
    );
}
