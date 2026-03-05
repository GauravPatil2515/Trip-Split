"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    IndianRupee,
    Receipt,
    Check,
    Camera,
    Info,
    Compass
} from "lucide-react";
import { AvatarChip } from "@/components/AvatarChip";
import {
    CATEGORY_ICONS,
    CATEGORY_LABELS,
    Expense,
    formatCurrency,
} from "@/lib/data";
import { BottomNav } from "@/components/BottomNav";
import { useTripStore } from "@/hooks/useTripStore";
import { useSettlementEngine } from "@/hooks/useSettlementEngine";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useUserStore } from "@/hooks/useUserStore";

const CATEGORIES: Expense["category"][] = [
    "food",
    "travel",
    "stay",
    "activity",
    "shopping",
    "other",
];

export default function AddExpensePage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuthStore();
    const { profile } = useUserStore();
    const { members, tripId, currentUserId } = useTripStore();
    const { addExpense } = useSettlementEngine(tripId);

    // Auth guard
    useEffect(() => {
        if (!authLoading && (!user || !profile)) router.replace("/login");
    }, [user, profile, authLoading, router]);



    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState<Expense["category"]>("food");
    const [gstIncluded, setGstIncluded] = useState(false);
    const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
        new Set(members.map((m) => m.id))
    );
    const [showSuccess, setShowSuccess] = useState(false);

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

    const toggleMember = (id: string) => {
        setSelectedMembers((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                if (next.size > 1) next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const numericAmount = amount ? parseFloat(amount) : 0;

    // Tax breakdown estimation
    const estBase = gstIncluded && numericAmount > 0 ? numericAmount / 1.18 : numericAmount;
    const estTax = gstIncluded && numericAmount > 0 ? numericAmount - estBase : 0;

    const perPerson =
        numericAmount > 0 && selectedMembers.size > 0
            ? Math.ceil(numericAmount / selectedMembers.size)
            : 0;

    const handleSubmit = async () => {
        if (!canSubmit) return;

        // Find current user as payer using dynamic currentUserId
        const paidBy = members.find(m => m.id === currentUserId) || members[0];
        const splitAmong = members.filter(m => selectedMembers.has(m.id));

        const now = new Date();
        const timeStr = now.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

        setShowSuccess(true);

        // Route through SettlementEngine → Firestore (if configured) or local store
        try {
            await addExpense({
                title: title.trim(),
                amount: numericAmount,
                category,
                paidBy,
                splitAmong,
                date: "Today",
                time: timeStr,
                gstIncluded,
            });
        } catch {
            // Error already handled inside the engine; UI continues
        }

        setTimeout(() => {
            setShowSuccess(false);
            router.push("/dashboard");
        }, 1800);
    };

    const canSubmit = title.trim() && numericAmount > 0;

    return (
        <div className="min-h-dvh pb-24 relative page-transition">
            {/* Success Overlay */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center"
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="flex flex-col items-center p-8 bg-card rounded-3xl shadow-float border border-border/50"
                        >
                            <div className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center mb-5">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
                                >
                                    <Check className="w-10 h-10 text-success" strokeWidth={2.5} />
                                </motion.div>
                            </div>
                            <p className="text-[20px] font-bold text-foreground">
                                Expense Added!
                            </p>
                            <p className="text-[14px] text-muted-foreground mt-1.5 font-medium">
                                {formatCurrency(numericAmount)} split among {selectedMembers.size} people
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="px-5 pt-5 safe-top flex items-center justify-between">
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
                    <h1 className="text-[18px] font-bold text-foreground">
                        Add Expense
                    </h1>
                </motion.div>

                {/* Scan Bill Placeholder */}
                <motion.button
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-full bg-secondary text-secondary-foreground text-[12px] font-semibold btn-press hover:bg-secondary/80 transition-colors"
                >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Scan Bill</span>
                </motion.button>
            </div>

            {/* Amount Input */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="px-5 mt-6"
            >
                <div className="bg-card paper-texture border border-border/80 rounded-3xl p-5 shadow-card relative overflow-hidden">
                    <label className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider block mb-3">
                        Amount
                    </label>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                            <IndianRupee className="w-6 h-6 text-primary" strokeWidth={2.5} />
                        </div>
                        <input
                            type="number"
                            inputMode="decimal"
                            placeholder="0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="flex-1 bg-transparent text-[40px] font-extrabold text-foreground tabular-nums placeholder:text-muted-foreground/30 outline-none w-full"
                        />
                    </div>

                    {/* Tax Breakdown Preview & Toggle */}
                    <div className="mt-5 pt-4 border-t border-border/50">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <Receipt className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
                                    <span className="text-[14px] font-semibold text-foreground">
                                        Includes GST
                                    </span>
                                </div>
                                <AnimatePresence>
                                    {gstIncluded && numericAmount > 0 && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground overflow-hidden"
                                        >
                                            <Info className="w-3 h-3" />
                                            <span>
                                                Base: {formatCurrency(estBase)} · Est. Tax: {formatCurrency(estTax)}
                                            </span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <button
                                onClick={() => setGstIncluded(!gstIncluded)}
                                className={`relative w-[48px] h-[28px] rounded-full transition-colors duration-300 ease-in-out shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${gstIncluded ? "bg-primary" : "bg-muted"
                                    }`}
                            >
                                <motion.div
                                    animate={{ x: gstIncluded ? 22 : 2 }}
                                    transition={{ type: "spring", stiffness: 600, damping: 28 }}
                                    className="absolute top-[2px] w-[24px] h-[24px] rounded-full bg-white shadow-sm"
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Description */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="px-5 mt-4"
            >
                <div className="bg-card border border-border/80 rounded-2xl px-5 py-4 shadow-soft">
                    <input
                        type="text"
                        placeholder="What was this for?"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-transparent text-[16px] font-medium text-foreground placeholder:text-muted-foreground/40 outline-none"
                    />
                </div>
            </motion.div>

            {/* Category Selection */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="px-5 mt-6"
            >
                <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
                    Category
                </h3>
                <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-2 -mx-5 px-5">
                    {CATEGORIES.map((cat) => (
                        <motion.button
                            key={cat}
                            whileTap={{ scale: 0.93 }}
                            onClick={() => setCategory(cat)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-semibold whitespace-nowrap transition-all duration-200 btn-press shrink-0 ${category === cat
                                ? "bg-primary text-primary-foreground shadow-card"
                                : "bg-card border border-border/80 text-muted-foreground hover:bg-secondary/40"
                                }`}
                        >
                            <span className="text-base">{CATEGORY_ICONS[cat]}</span>
                            {CATEGORY_LABELS[cat]}
                        </motion.button>
                    ))}
                </div>
            </motion.div>

            {/* Split Selection */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="px-5 mt-5"
            >
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">
                        Split with
                    </h3>
                    <AnimatePresence mode="popLayout">
                        {numericAmount > 0 && selectedMembers.size > 0 && (
                            <motion.span
                                key={perPerson}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="text-[13px] font-bold text-primary tabular-nums"
                            >
                                ₹{perPerson} each
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                <div className="bg-card paper-texture border border-border/80 rounded-2xl p-5 shadow-card">
                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-5">
                        {members.map((member) => (
                            <AvatarChip
                                key={member.id}
                                member={member}
                                selected={selectedMembers.has(member.id)}
                                onToggle={() => toggleMember(member.id)}
                                size="lg"
                            />
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Submit */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="px-5 mt-8"
            >
                <motion.button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    whileTap={canSubmit ? { scale: 0.97, y: 1 } : {}}
                    className={`w-full py-4 rounded-2xl font-bold text-[16px] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${canSubmit
                        ? "bg-primary text-primary-foreground shadow-elevated hover:shadow-float btn-press"
                        : "bg-muted text-muted-foreground/40 cursor-not-allowed"
                        }`}
                >
                    Add Expense
                </motion.button>

                <button
                    className={`w-full mt-3 py-3.5 rounded-2xl font-semibold text-[15px] border transition-all btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${canSubmit
                        ? "border-primary/20 text-primary bg-primary/[0.04] hover:bg-primary/[0.08]"
                        : "border-border/60 text-muted-foreground/40 cursor-not-allowed"
                        }`}
                >
                    <span className="flex items-center justify-center gap-2">
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            className="opacity-70"
                        >
                            <path
                                d="M20.16 7.8L18.12 9.84C16.08 7.8 13.68 6.72 10.92 6.72C9.72 6.72 8.64 6.96 7.56 7.32L9.48 9.24C9.96 9.12 10.44 9 10.92 9C12.72 9 14.28 9.72 15.6 11.04L13.56 13.08C12.84 12.36 11.88 12 10.92 12C9.96 12 9.12 12.36 8.4 13.08L6 10.68C4.32 12.36 3.48 14.4 3.48 16.8H6C6 15.24 6.6 13.92 7.68 12.84L10.08 15.24C9.84 15.6 9.72 15.96 9.72 16.44C9.72 17.16 10.08 17.76 10.68 18.24L12 19.56L13.32 18.24C13.92 17.76 14.16 17.16 14.16 16.44C14.16 15.72 13.92 15.12 13.32 14.64L12 13.32L14.88 10.44C16.44 12 18.24 12.84 20.16 12.84V10.32C18.96 10.32 17.76 9.84 16.68 8.88L18.72 6.84L20.16 7.8Z"
                                fill="currentColor"
                            />
                        </svg>
                        Generate UPI Request
                    </span>
                </button>
            </motion.div>

            <BottomNav />
        </div>
    );
}
