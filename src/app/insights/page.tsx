"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { InsightsCharts } from "@/components/InsightsCharts";
import { formatCurrency } from "@/lib/data";
import { Telescope, TrendingDown, Target, Compass } from "lucide-react";
import { useTripStore } from "@/hooks/useTripStore";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useUserStore } from "@/hooks/useUserStore";

export default function InsightsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuthStore();
    const { profile } = useUserStore();
    const { expenses, members } = useTripStore();

    // Auth guard
    useEffect(() => {
        if (!authLoading && (!user || !profile)) router.replace("/login");
    }, [user, profile, authLoading, router]);

    if (authLoading) {
        return (
            <div className="min-h-dvh flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-elevated">
                        <Compass className="w-7 h-7 text-primary-foreground" strokeWidth={1.8} />
                    </div>
                    <p className="text-[13px] text-muted-foreground font-medium">Loading…</p>
                </div>
            </div>
        );
    }

    if (!user || !profile) return null;

    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const budget = 15000;
    const budgetPercentage = Math.min((totalSpent / budget) * 100, 100);

    // Group by category
    const categoryMap = expenses.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
    }, {} as Record<string, number>);

    const categoryData = Object.entries(categoryMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // Group by date for timeline
    const dateMap = expenses.reduce((acc, exp) => {
        const key = exp.date || "Unknown";
        acc[key] = (acc[key] || 0) + exp.amount;
        return acc;
    }, {} as Record<string, number>);

    const timelineData = Object.entries(dateMap).map(([date, amount]) => ({
        date,
        amount,
    }));

    // Top contributor
    const contributorMap = expenses.reduce((acc, exp) => {
        acc[exp.paidBy.id] = (acc[exp.paidBy.id] || 0) + exp.amount;
        return acc;
    }, {} as Record<string, number>);

    const topContributorId = Object.entries(contributorMap).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topContributor = members.find(m => m.id === topContributorId);
    const topContributorAmount = contributorMap[topContributorId || ""] || 0;

    return (
        <div className="min-h-dvh pb-24 page-transition">
            {/* Header */}
            <div className="px-5 pt-6 safe-top flex items-center justify-between">
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <div className="flex items-center gap-2 text-primary mb-1">
                        <Telescope className="w-4 h-4" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Analytics</span>
                    </div>
                    <h1 className="text-[22px] font-bold text-foreground leading-tight tracking-tight">
                        Trip Insights
                    </h1>
                </motion.div>
            </div>

            {expenses.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-5 mt-16 text-center"
                >
                    <p className="text-muted-foreground text-[14px]">No expenses yet. Add some expenses to see insights!</p>
                </motion.div>
            ) : (
                <>
                    {/* Budget Progress */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="px-5 mt-6"
                    >
                        <div className="bg-card paper-texture border border-border/80 rounded-3xl p-5 shadow-card">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2 text-foreground font-semibold text-[14px]">
                                    <Target className="w-4 h-4 text-primary" />
                                    <span>Trip Budget</span>
                                </div>
                                <span className="text-[14px] font-bold text-foreground tabular-nums">
                                    {formatCurrency(totalSpent)} <span className="text-muted-foreground font-medium">/ {formatCurrency(budget)}</span>
                                </span>
                            </div>

                            <div className="h-3 bg-secondary rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${budgetPercentage}%` }}
                                    transition={{ duration: 1, type: "spring", stiffness: 50, delay: 0.2 }}
                                    className={`h-full rounded-full relative ${budgetPercentage > 90 ? "bg-danger" : budgetPercentage > 75 ? "bg-amber" : "bg-primary"}`}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                                </motion.div>
                            </div>
                            <p className="text-[11px] font-medium text-muted-foreground mt-2 text-right">
                                {100 - Math.round(budgetPercentage)}% remaining
                            </p>
                        </div>
                    </motion.div>

                    {/* Charts */}
                    {categoryData.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="px-5 mt-6"
                        >
                            <InsightsCharts categoryData={categoryData} timelineData={timelineData} />
                        </motion.div>
                    )}

                    {/* Top Contributor */}
                    {topContributor && (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="px-5 mt-6"
                        >
                            <div className="bg-primary/5 border border-primary/20 rounded-3xl p-5 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-1.5 text-primary mb-1">
                                        <TrendingDown className="w-4 h-4" />
                                        <span className="text-[11px] font-bold uppercase tracking-wider">Top Spender</span>
                                    </div>
                                    <p className="text-[16px] font-semibold text-foreground">
                                        {topContributor.name}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-[16px] font-bold tabular-nums text-foreground">
                                            {formatCurrency(topContributorAmount)}
                                        </p>
                                    </div>
                                    <div className={`w-10 h-10 rounded-full ${topContributor.color} flex items-center justify-center text-xs font-bold text-white shadow-soft ring-2 ring-background`}>
                                        {topContributor.initials}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </>
            )}

            <BottomNav />
        </div>
    );
}
