"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Bell, MoreHorizontal, ChevronRight, Receipt, Share2, Compass, Check, Copy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { LiveBalanceBar } from "@/components/LiveBalanceBar";
import { ExpenseCard } from "@/components/ExpenseCard";
import { useTripStore } from "@/hooks/useTripStore";
import { useTripRealtime } from "@/hooks/useTripRealtime";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useUserStore } from "@/hooks/useUserStore";
import { useState } from "react";
import { TripQRCode } from "@/components/TripQRCode";
import { AnimatePresence } from "framer-motion";

export default function DashboardPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuthStore();
    const { profile } = useUserStore();
    const { expenses, balances, members, tripName, currentUserId, tripId } = useTripStore();
    const [shareCopied, setShareCopied] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    // Auth guard
    useEffect(() => {
        if (!authLoading && (!user || !profile)) router.replace("/login");
    }, [user, profile, authLoading, router]);

    // Activates Firestore real-time sync when Firebase credentials are present
    useTripRealtime(tripId);

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

    const handleShare = () => {
        if (!tripId || tripId === "mock-trip") return;
        setShowShareModal(true);
    };

    const copyInvite = async () => {
        if (!tripId) return;
        const url = `${window.location.origin}/t/${tripId}`;
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
    };

    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const youPaid = expenses
        .filter((e) => e.paidBy.id === currentUserId)
        .reduce((sum, e) => sum + e.amount, 0);

    const youOwe = balances
        .filter((b) => b.from.id === currentUserId)
        .reduce((sum, b) => sum + b.amount, 0);

    const youGetBack = balances
        .filter((b) => b.to.id === currentUserId)
        .reduce((sum, b) => sum + b.amount, 0);

    const pendingSettlements = balances.filter(
        (b) => b.from.id === currentUserId || b.to.id === currentUserId
    ).length;

    return (
        <div className="min-h-dvh pb-24 page-transition">
            {/* Header */}
            <div className="px-5 pt-6 safe-top flex items-center justify-between">
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex -space-x-2"
                >
                    {members.slice(0, 4).map((member) => (
                        <div
                            key={member.id}
                            className={`w-8 h-8 rounded-full ${member.color} flex items-center justify-center text-[10px] font-semibold text-white ring-2 ring-background`}
                        >
                            {member.initials}
                        </div>
                    ))}
                    {members.length > 4 && (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground ring-2 ring-background">
                            +{members.length - 4}
                        </div>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2"
                >
                    {/* Share Trip invite link */}
                    {tripId && tripId !== "mock-trip" && (
                        <button
                            onClick={handleShare}
                            title="Share trip invite link"
                            className="w-10 h-10 rounded-full bg-card border border-border/80 flex items-center justify-center shadow-soft btn-press hover:bg-secondary/50 transition-colors relative"
                        >
                            <Share2 className="w-4 h-4 text-foreground" strokeWidth={1.8} />
                        </button>
                    )}
                    <button className="w-10 h-10 rounded-full bg-card border border-border/80 flex items-center justify-center shadow-soft btn-press hover:bg-secondary/50 transition-colors">
                        <Bell className="w-4 h-4 text-foreground" strokeWidth={1.8} />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-card border border-border/80 flex items-center justify-center shadow-soft btn-press hover:bg-secondary/50 transition-colors">
                        <MoreHorizontal
                            className="w-4 h-4 text-foreground"
                            strokeWidth={1.8}
                        />
                    </button>
                </motion.div>
            </div>

            {/* Live Balance Bar */}
            <div className="px-5 mt-6 sticky top-4 z-30">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <LiveBalanceBar
                        tripName={tripName || "Goa Weekend 🌴"}
                        totalSpent={totalSpent}
                        youPaid={youPaid}
                        youOwe={youOwe}
                        youGetBack={youGetBack}
                    />
                </motion.div>
            </div>

            {/* Quick Settlement Nudge */}
            {pendingSettlements > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="px-5 mt-5"
                >
                    <Link
                        href="/settlement"
                        className="flex items-center justify-between bg-amber/10 border border-amber/20 rounded-2xl px-4 py-3.5 group btn-press"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-amber/20 flex items-center justify-center">
                                <span className="text-base">💳</span>
                            </div>
                            <span className="text-[14px] font-semibold text-amber-foreground">
                                {pendingSettlements} pending settlement{pendingSettlements !== 1 ? 's' : ''}
                            </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-amber-foreground/50 group-hover:text-amber-foreground transition-colors" />
                    </Link>
                </motion.div>
            )}

            {/* Expense Timeline */}
            <div className="px-5 mt-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[16px] font-bold text-foreground">
                        Recent Activity
                    </h2>
                    {expenses.length > 0 && (
                        <span className="text-[13px] font-semibold text-muted-foreground">
                            {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                {expenses.length > 0 ? (
                    <div className="space-y-4">
                        {expenses.map((expense, index) => (
                            <ExpenseCard key={expense.id} expense={expense} index={index} />
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-12 text-center"
                    >
                        <div className="w-16 h-16 rounded-3xl bg-secondary/80 flex items-center justify-center mb-4">
                            <Receipt className="w-8 h-8 text-muted-foreground/60" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">
                            No expenses yet
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-[200px] mb-6">
                            Start adding your trip expenses to see the magic happen.
                        </p>
                        <Link href="/add-expense">
                            <button className="bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-xl text-sm shadow-soft btn-press">
                                Add First Expense
                            </button>
                        </Link>
                    </motion.div>
                )}
            </div>

            {/* Floating Add Button */}
            {expenses.length > 0 && (
                <Link href="/add-expense">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.05 }}
                        className="fixed bottom-24 right-1/2 translate-x-[170px] w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-float flex items-center justify-center z-40 btn-press"
                    >
                        <Plus className="w-6 h-6" strokeWidth={2} />
                    </motion.button>
                </Link>
            )}

            <BottomNav />

            {/* QR Share Modal overlay */}
            <AnimatePresence>
                {showShareModal && tripId && tripId !== "mock-trip" && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowShareModal(false)}
                            className="fixed inset-0 bg-background/80 backdrop-blur-[2px] z-50 transition-opacity"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed top-1/2 left-6 right-6 -translate-y-1/2 bg-card paper-texture border border-border/80 rounded-3xl p-6 shadow-elevated z-50"
                        >
                            <div className="flex flex-col items-center">
                                <h3 className="text-[18px] font-bold text-foreground mb-6">Invite to {tripName || "Trip"}</h3>
                                <TripQRCode tripId={tripId} size={180} />

                                <div className="mt-8 flex flex-col gap-3 w-full">
                                    <button
                                        onClick={copyInvite}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-primary text-primary-foreground text-[14px] font-semibold btn-press shadow-elevated hover:shadow-float transition-all"
                                    >
                                        {shareCopied ? (
                                            <><Check className="w-5 h-5 text-primary-foreground" />Copied!</>
                                        ) : (
                                            <><Copy className="w-5 h-5" />Copy Invite Link</>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setShowShareModal(false)}
                                        className="w-full py-3.5 rounded-2xl bg-secondary text-secondary-foreground text-[14px] font-semibold btn-press hover:bg-secondary/70 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
