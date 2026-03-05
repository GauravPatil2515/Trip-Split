"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
    ArrowLeft,
    ChevronDown,
    ChevronUp,
    PartyPopper,
    Sparkles,
    ShieldCheck,
    CheckCircle2,
    Clock,
    Copy,
    Check,
    ExternalLink,
    Compass,
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { formatCurrency } from "@/lib/data";
import { useTripStore } from "@/hooks/useTripStore";
import { useSettlementEngine } from "@/hooks/useSettlementEngine";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useUserStore } from "@/hooks/useUserStore";

export default function SettlementPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuthStore();
    const { profile } = useUserStore();
    const { balances, settlementStates, settlementRefs, markSettlement, setSettlementRef, tripId } = useTripStore();
    const { confirmSettlement } = useSettlementEngine(tripId);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [activeInputId, setActiveInputId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

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

    const copyUpi = async (upiId: string, key: string) => {
        await navigator.clipboard.writeText(upiId);
        setCopiedId(key);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const settlements = balances.map((b, i) => ({
        id: String(i),
        from: b.from,
        to: b.to,
        amount: b.amount,
    }));

    const settledCount = Object.values(settlementStates).filter(s => s === "settled").length;
    const allSettled = settlements.length > 0 && settledCount === settlements.length;

    const handlePay = (id: string) => {
        markSettlement(id, "awaiting");
        setActiveInputId(id);
        setExpandedId(null);
    };

    const handleConfirm = async (id: string) => {
        const ref = settlementRefs[id] ?? "";
        if (ref.length > 4) {
            // Fires Firestore transaction atomically (falls back to local if no Firebase)
            await confirmSettlement(id, ref);
            setActiveInputId(null);
        }
    };

    return (
        <div className="min-h-dvh pb-24 page-transition">
            {/* Header */}
            <div className="px-5 pt-6 safe-top flex items-center justify-between">
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3"
                >
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-full bg-card border border-border/80 flex items-center justify-center shadow-soft btn-press hover:bg-secondary/50 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-foreground" strokeWidth={1.8} />
                    </button>
                    <div>
                        <h1 className="text-[18px] font-bold text-foreground leading-tight">
                            Settlements
                        </h1>
                        <p className="text-[12px] font-medium text-muted-foreground mt-0.5">
                            Smart minimized payments
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Trust Badge */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="px-5 mt-5"
            >
                <div className="bg-secondary/40 border border-border/60 rounded-xl px-4 py-3 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-[12px] text-muted-foreground leading-relaxed">
                        <strong className="text-foreground">No platform fee.</strong> Direct peer-to-peer payments. Always verify the receiver&apos;s UPI ID before sending money.
                    </p>
                </div>
            </motion.div>

            {/* Summary Card */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="px-5 mt-5"
            >
                <div className="bg-card paper-texture border border-border/80 rounded-3xl p-6 shadow-card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                                Total to settle
                            </p>
                            <p className="text-[28px] font-extrabold tabular-nums text-foreground">
                                {formatCurrency(
                                    settlements
                                        .filter((s) => settlementStates[s.id] !== "settled")
                                        .reduce((sum, s) => sum + s.amount, 0)
                                )}
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber/10 rounded-full border border-amber/20">
                            <Sparkles className="w-3.5 h-3.5 text-amber" strokeWidth={2} />
                            <span className="text-[12px] font-bold text-amber-foreground">
                                {settlements.length - settledCount} remaining
                            </span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {settlements.length > 0 && (
                        <>
                            <div className="mt-5 h-2 bg-secondary rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: `${(settledCount / settlements.length) * 100}%`,
                                    }}
                                    transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
                                    className="h-full bg-primary rounded-full relative"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                                </motion.div>
                            </div>
                            <div className="flex items-center justify-between mt-2.5">
                                <span className="text-[11px] font-medium text-muted-foreground">
                                    {settledCount} of {settlements.length} settled
                                </span>
                                <span className="text-[11px] font-bold text-primary tabular-nums">
                                    {Math.round((settledCount / settlements.length) * 100)}%
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>

            {/* All Settled Celebration */}
            <AnimatePresence>
                {allSettled && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="px-5 mt-6"
                    >
                        <div className="bg-success/10 border-2 border-success/30 rounded-3xl p-8 text-center shadow-elevated relative overflow-hidden">
                            <motion.div
                                initial={{ scale: 0, rotate: -10 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                            >
                                <div className="w-20 h-20 mx-auto rounded-full bg-success flex items-center justify-center mb-4 shadow-float">
                                    <PartyPopper className="w-10 h-10 text-success-foreground" />
                                </div>
                            </motion.div>
                            <h3 className="text-[22px] font-bold text-success mb-2">
                                All Settled Up! 🎉
                            </h3>
                            <p className="text-[14px] font-medium text-success/80">
                                You&apos;re all square with the group. Ready for the next adventure?
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* No settlements */}
            {settlements.length === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-5 mt-12 text-center"
                >
                    <p className="text-muted-foreground text-[14px]">No settlements needed yet. Add some expenses first!</p>
                </motion.div>
            )}

            {/* Settlement Cards */}
            <div className="px-5 mt-6 space-y-4">
                {settlements.map((settlement, index) => {
                    const isExpanded = expandedId === settlement.id;
                    const pState = settlementStates[settlement.id] || "idle";

                    return (
                        <motion.div
                            key={settlement.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 + index * 0.06, duration: 0.3 }}
                            layout
                            className={`bg-card paper-texture border rounded-3xl overflow-hidden shadow-card transition-all duration-300 ${pState === "settled"
                                ? "border-success/30 bg-success/5"
                                : pState === "awaiting"
                                    ? "border-amber/30 ring-2 ring-amber/10"
                                    : "border-border/80"
                                }`}
                        >
                            {/* Main Row */}
                            <div className="p-5">
                                <div className="flex items-center gap-4">
                                    <div className="relative shrink-0">
                                        <div
                                            className={`w-11 h-11 rounded-full ${settlement.from.color} flex items-center justify-center text-xs font-bold text-white shadow-soft`}
                                        >
                                            {settlement.from.initials}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-card border border-border flex items-center justify-center shadow-sm">
                                            <span className="text-[10px] font-bold">→</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-[15px] font-bold text-foreground">
                                                {settlement.from.name}
                                            </span>
                                            <span className="text-[13px] font-medium text-muted-foreground">
                                                pays
                                            </span>
                                            <span className="text-[15px] font-bold text-foreground">
                                                {settlement.to.name}
                                            </span>
                                        </div>
                                        <p className="text-[22px] font-extrabold tabular-nums text-foreground mt-0.5">
                                            {formatCurrency(settlement.amount)}
                                        </p>
                                    </div>

                                    {pState === "settled" && (
                                        <div className="flex flex-col items-end">
                                            <CheckCircle2 className="w-6 h-6 text-success mb-1" />
                                            <span className="text-[10px] font-bold text-success uppercase tracking-wider">Done</span>
                                        </div>
                                    )}
                                    {pState === "awaiting" && activeInputId !== settlement.id && (
                                        <div className="flex flex-col items-end">
                                            <Clock className="w-6 h-6 text-amber mb-1" />
                                            <span className="text-[10px] font-bold text-amber uppercase tracking-wider">Pending</span>
                                        </div>
                                    )}
                                </div>

                                {/* Actions Grid (Idle State) */}
                                <AnimatePresence>
                                    {pState === "idle" && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="mt-5 grid grid-cols-2 gap-3"
                                        >
                                            <button
                                                onClick={() => setExpandedId(isExpanded ? null : settlement.id)}
                                                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary/50 text-foreground text-[14px] font-semibold border border-transparent hover:border-border/80 transition-all btn-press"
                                            >
                                                {isExpanded ? "Hide Details" : "Details"}
                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => handlePay(settlement.id)}
                                                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-[14px] font-semibold shadow-card hover:shadow-elevated transition-shadow btn-press"
                                            >
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M20.16 7.8L18.12 9.84C16.08 7.8 13.68 6.72 10.92 6.72C9.72 6.72 8.64 6.96 7.56 7.32L9.48 9.24C9.96 9.12 10.44 9 10.92 9C12.72 9 14.28 9.72 15.6 11.04L13.56 13.08C12.84 12.36 11.88 12 10.92 12C9.96 12 9.12 12.36 8.4 13.08L6 10.68C4.32 12.36 3.48 14.4 3.48 16.8H6C6 15.24 6.6 13.92 7.68 12.84L10.08 15.24C9.84 15.6 9.72 15.96 9.72 16.44C9.72 17.16 10.08 17.76 10.68 18.24L12 19.56L13.32 18.24C13.92 17.76 14.16 17.16 14.16 16.44C14.16 15.72 13.92 15.12 13.32 14.64L12 13.32L14.88 10.44C16.44 12 18.24 12.84 20.16 12.84V10.32C18.96 10.32 17.76 9.84 16.68 8.88L18.72 6.84L20.16 7.8Z" />
                                                </svg>
                                                Pay
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Reference Input (Awaiting State) */}
                                <AnimatePresence>
                                    {pState === "awaiting" && activeInputId === settlement.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="mt-4 pt-4 border-t border-border/50"
                                        >
                                            <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                                                Verify Payment
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Enter UPI Ref No. (e.g. 1234...)"
                                                    value={settlementRefs[settlement.id] || ""}
                                                    onChange={(e) => setSettlementRef(settlement.id, e.target.value)}
                                                    className="flex-1 bg-secondary/50 border border-border rounded-xl px-4 py-3 text-[14px] font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                />
                                                <button
                                                    onClick={() => handleConfirm(settlement.id)}
                                                    disabled={(settlementRefs[settlement.id] || "").length < 5}
                                                    className="px-5 py-3 bg-primary text-primary-foreground font-bold text-[14px] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed btn-press"
                                                >
                                                    Confirm
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Expandable Breakdown */}
                            <AnimatePresence>
                                {isExpanded && pState === "idle" && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-5 pb-5 bg-card/50">
                                            <div className="pt-4 border-t border-border/40 space-y-3">
                                                <h4 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">
                                                    Settlement Details
                                                </h4>

                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-[14px]">
                                                        <span className="text-muted-foreground">Amount</span>
                                                        <span className="font-bold tabular-nums text-foreground">{formatCurrency(settlement.amount)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[14px]">
                                                        <span className="text-muted-foreground">From</span>
                                                        <span className="font-semibold text-foreground">{settlement.from.name}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[14px]">
                                                        <span className="text-muted-foreground">To</span>
                                                        <span className="font-semibold text-foreground">{settlement.to.name}</span>
                                                    </div>
                                                </div>

                                                {/* UPI ID row */}
                                                {settlement.to.upiId && (
                                                    <div className="mt-3 pt-3 border-t border-border/30 space-y-2.5">
                                                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                            Pay via UPI
                                                        </p>
                                                        <div className="flex items-center justify-between gap-2 bg-secondary/60 rounded-xl px-3 py-2.5">
                                                            <span className="text-[14px] font-semibold text-foreground truncate">
                                                                {settlement.to.upiId}
                                                            </span>
                                                            <button
                                                                onClick={() => copyUpi(settlement.to.upiId!, `upi-${settlement.id}`)}
                                                                className="shrink-0 w-7 h-7 rounded-lg bg-card border border-border/60 flex items-center justify-center btn-press"
                                                            >
                                                                {copiedId === `upi-${settlement.id}`
                                                                    ? <Check className="w-3.5 h-3.5 text-success" strokeWidth={2.5} />
                                                                    : <Copy className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.8} />
                                                                }
                                                            </button>
                                                        </div>

                                                        {/* UPI Deep Link */}
                                                        <a
                                                            href={`upi://pay?pa=${encodeURIComponent(settlement.to.upiId)}&pn=${encodeURIComponent(settlement.to.name)}&am=${settlement.amount}&tn=TripLedger+Settlement&cu=INR`}
                                                            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-primary-foreground text-[14px] font-bold shadow-card btn-press"
                                                        >
                                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M20.16 7.8L18.12 9.84C16.08 7.8 13.68 6.72 10.92 6.72C9.72 6.72 8.64 6.96 7.56 7.32L9.48 9.24C9.96 9.12 10.44 9 10.92 9C12.72 9 14.28 9.72 15.6 11.04L13.56 13.08C12.84 12.36 11.88 12 10.92 12C9.96 12 9.12 12.36 8.4 13.08L6 10.68C4.32 12.36 3.48 14.4 3.48 16.8H6C6 15.24 6.6 13.92 7.68 12.84L10.08 15.24C9.84 15.6 9.72 15.96 9.72 16.44C9.72 17.16 10.08 17.76 10.68 18.24L12 19.56L13.32 18.24C13.92 17.76 14.16 17.16 14.16 16.44C14.16 15.72 13.92 15.12 13.32 14.64L12 13.32L14.88 10.44C16.44 12 18.24 12.84 20.16 12.84V10.32C18.96 10.32 17.76 9.84 16.68 8.88L18.72 6.84L20.16 7.8Z" />
                                                            </svg>
                                                            Open in UPI App
                                                            <ExternalLink className="w-3.5 h-3.5 opacity-70" strokeWidth={2} />
                                                        </a>

                                                        {/* QR Code */}
                                                        {settlement.to.qrImage && (
                                                            <div className="flex flex-col items-center pt-1">
                                                                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                                                    UPI QR Code
                                                                </p>
                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                <img
                                                                    src={settlement.to.qrImage}
                                                                    alt={`${settlement.to.name} UPI QR`}
                                                                    className="w-36 h-36 rounded-2xl object-contain border border-border/60 shadow-soft bg-white p-1"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>

            <BottomNav />
        </div>
    );
}
