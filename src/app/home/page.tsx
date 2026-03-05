"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
    Plus,
    QrCode,
    ArrowRight,
    MapPin,
    Loader2,
    Users,
    LogOut,
    Link2,
    Copy,
    Check,
    X,
} from "lucide-react";
import { useUserStore } from "@/hooks/useUserStore";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useTripStore } from "@/hooks/useTripStore";
import { TripQRCode } from "@/components/TripQRCode";

function toSlug(str: string): string {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .trim()
        .toLowerCase()
        .replace(/[\s_]+/g, "-")
        .slice(0, 30) || "trip";
}

export default function HomePage() {
    const router = useRouter();
    const { profile, clearProfile } = useUserStore();
    const { user, loading: authLoading } = useAuthStore();
    const { setTripName, setTripId, setCurrentUser, replaceExpenses } = useTripStore();

    // Auth guard: wait for auth to resolve, then check
    useEffect(() => {
        if (!authLoading && (!user || !profile)) router.replace("/login");
    }, [profile, user, authLoading, router]);

    const [mode, setMode] = useState<"idle" | "create" | "join">("idle");
    const [tripName, setTripNameInput] = useState("");
    const [joinCode, setJoinCode] = useState("");
    const [focused, setFocused] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [createdTripId, setCreatedTripId] = useState<string | null>(null);
    const [linkCopied, setLinkCopied] = useState(false);

    if (!profile) return null;

    // ── Create trip ──────────────────────────────────────────────────────────
    const handleCreate = async () => {
        if (!tripName.trim() || loading) return;
        setLoading(true);

        try {
            const tripId = `${toSlug(tripName)}-${Date.now().toString(36)}`;
            const currentMember = {
                id: profile.id,
                name: profile.name,
                initials: profile.initials,
                color: profile.color,
                phone: profile.phone,
                upiId: profile.upiId,
                qrImage: profile.qrImage,
            };

            setTripName(tripName.trim());
            setTripId(tripId);
            setCurrentUser(profile.id, profile.name);
            replaceExpenses([]);
            useTripStore.setState({ members: [currentMember] });

            // Firebase: create trip doc
            const { firebaseReady, db } = await import("@/lib/firebase");
            if (firebaseReady && db) {
                try {
                    const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
                    await setDoc(doc(db, "trips", tripId), {
                        name: tripName.trim(),
                        createdAt: serverTimestamp(),
                        createdBy: profile.id,
                        members: [currentMember],
                    });
                } catch (e) {
                    console.warn("[Home] Could not create Firestore trip:", e);
                }
            }

            setCreatedTripId(tripId);
            setShowQR(true);
        } finally {
            setLoading(false);
        }
    };

    // ── Join via invite code / URL ────────────────────────────────────────────
    const handleJoin = () => {
        if (!joinCode.trim()) return;
        // Accept full URL or bare trip ID
        const match = joinCode.trim().match(/\/t\/([^/?#]+)/);
        const tripId = match ? match[1] : joinCode.trim();
        router.push(`/t/${tripId}`);
    };

    // ── Share most recent trip URL ────────────────────────────────────────────
    const currentTripId = useTripStore.getState().tripId;
    const copyInvite = async (id?: string | null) => {
        const targetId = id || currentTripId;
        if (!targetId || targetId === "mock-trip") return;
        const url = `${window.location.origin}/t/${targetId}`;
        await navigator.clipboard.writeText(url);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    };

    return (
        <div className="min-h-dvh flex flex-col px-6 safe-top safe-bottom">
            {/* Header */}
            <div className="pt-8 pb-2 flex items-center justify-between">
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                    <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">
                        Welcome back
                    </p>
                    <h1 className="text-[24px] font-bold text-foreground mt-0.5">
                        {profile.name} 👋
                    </h1>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2"
                >
                    {/* Avatar */}
                    <div
                        className={`w-10 h-10 rounded-full ${profile.color} flex items-center justify-center text-[13px] font-bold text-white shadow-soft`}
                    >
                        {profile.initials}
                    </div>
                    <button
                        onClick={async () => {
                            try {
                                const { auth } = await import("@/lib/firebase");
                                const { signOut } = await import("firebase/auth");
                                await signOut(auth);
                            } catch {
                                // no-op if Firebase unavailable
                            }
                            clearProfile();
                            router.push("/login");
                        }}
                        title="Log out"
                        className="w-10 h-10 rounded-full bg-card border border-border/80 flex items-center justify-center shadow-soft btn-press hover:bg-destructive/10 transition-colors"
                    >
                        <LogOut className="w-4 h-4 text-muted-foreground" strokeWidth={1.8} />
                    </button>
                </motion.div>
            </div>

            {/* Profile chips */}
            {(profile.upiId || profile.phone) && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-2 mt-2 flex-wrap"
                >
                    {profile.upiId && (
                        <span className="text-[11px] font-semibold text-muted-foreground bg-secondary/60 px-2.5 py-1 rounded-full border border-border/50">
                            💳 {profile.upiId}
                        </span>
                    )}
                    {profile.phone && (
                        <span className="text-[11px] font-semibold text-muted-foreground bg-secondary/60 px-2.5 py-1 rounded-full border border-border/50">
                            📱 {profile.phone}
                        </span>
                    )}
                </motion.div>
            )}

            <div className="flex-1 min-h-[40px]" />

            {/* Action cards */}
            <div className="space-y-4">

                {/* QR Invite Modal */}
                <AnimatePresence>
                    {showQR && createdTripId && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-card paper-texture border border-primary/20 ring-2 ring-primary/10 rounded-3xl p-6 shadow-elevated"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[16px] font-bold text-foreground">Trip Created! 🎉</h3>
                                <button
                                    onClick={() => { setShowQR(false); router.push("/dashboard"); }}
                                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-destructive/10 transition-colors"
                                >
                                    <X className="w-4 h-4 text-muted-foreground" />
                                </button>
                            </div>
                            <div className="flex flex-col items-center">
                                <TripQRCode tripId={createdTripId} size={160} />
                                <div className="mt-6 flex flex-col gap-3 w-full">
                                    <button
                                        onClick={() => copyInvite(createdTripId)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-secondary text-secondary-foreground text-[14px] font-semibold btn-press hover:bg-secondary/70 transition-colors"
                                    >
                                        {linkCopied ? (
                                            <><Check className="w-5 h-5 text-success" />Copied to clipboard!</>
                                        ) : (
                                            <><Copy className="w-5 h-5" />Copy Invite Link</>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => router.push("/dashboard")}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-primary text-primary-foreground text-[14px] font-semibold btn-press shadow-elevated"
                                    >
                                        <span>Continue to Dashboard</span>
                                        <ArrowRight className="w-4 h-4" strokeWidth={2} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Create Trip Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className={`bg-card paper-texture border rounded-3xl overflow-hidden shadow-card transition-all duration-300 ${mode === "create" ? "border-primary/30 ring-2 ring-primary/10" : "border-border/80"}`}
                >
                    <button
                        onClick={() => setMode(mode === "create" ? "idle" : "create")}
                        className="w-full flex items-center gap-4 p-5 btn-press"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Plus className="w-6 h-6 text-primary" strokeWidth={2} />
                        </div>
                        <div className="text-left flex-1">
                            <p className="text-[16px] font-bold text-foreground">Create a Trip</p>
                            <p className="text-[13px] text-muted-foreground mt-0.5">
                                Start a new group and invite friends
                            </p>
                        </div>
                        <ArrowRight
                            className={`w-5 h-5 text-muted-foreground/50 transition-transform duration-200 ${mode === "create" ? "rotate-90" : ""}`}
                            strokeWidth={1.8}
                        />
                    </button>

                    <AnimatePresence>
                        {mode === "create" && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="px-5 pb-5 space-y-3 border-t border-border/40 pt-4">
                                    <div
                                        className={`flex items-center gap-3 bg-background border rounded-2xl px-4 py-3.5 transition-all duration-200 ${focused ? "border-primary/40 ring-1 ring-primary/10" : "border-border/60"}`}
                                    >
                                        <MapPin
                                            className={`w-[18px] h-[18px] shrink-0 transition-colors ${focused ? "text-primary" : "text-muted-foreground/50"}`}
                                            strokeWidth={1.8}
                                        />
                                        <input
                                            type="text"
                                            placeholder="e.g. Goa Weekend 🌴"
                                            value={tripName}
                                            onChange={(e) => setTripNameInput(e.target.value)}
                                            onFocus={() => setFocused(true)}
                                            onBlur={() => setFocused(false)}
                                            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                                            autoFocus
                                            className="flex-1 bg-transparent text-[15px] font-medium text-foreground placeholder:text-muted-foreground/40 outline-none"
                                        />
                                    </div>
                                    <button
                                        onClick={handleCreate}
                                        disabled={!tripName.trim() || loading}
                                        className={`w-full py-3.5 rounded-2xl font-bold text-[15px] transition-all btn-press ${tripName.trim() && !loading
                                            ? "bg-primary text-primary-foreground shadow-card"
                                            : "bg-muted text-muted-foreground/40 cursor-not-allowed"
                                            }`}
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Creating…
                                            </span>
                                        ) : "Create Trip"}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Join Trip Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22 }}
                    className={`bg-card paper-texture border rounded-3xl overflow-hidden shadow-card transition-all duration-300 ${mode === "join" ? "border-blue-500/30 ring-2 ring-blue-500/10" : "border-border/80"}`}
                >
                    <button
                        onClick={() => setMode(mode === "join" ? "idle" : "join")}
                        className="w-full flex items-center gap-4 p-5 btn-press"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                            <QrCode className="w-6 h-6 text-blue-500" strokeWidth={1.8} />
                        </div>
                        <div className="text-left flex-1">
                            <p className="text-[16px] font-bold text-foreground">Join a Trip</p>
                            <p className="text-[13px] text-muted-foreground mt-0.5">
                                Paste an invite link or code
                            </p>
                        </div>
                        <ArrowRight
                            className={`w-5 h-5 text-muted-foreground/50 transition-transform duration-200 ${mode === "join" ? "rotate-90" : ""}`}
                            strokeWidth={1.8}
                        />
                    </button>

                    <AnimatePresence>
                        {mode === "join" && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="px-5 pb-5 space-y-3 border-t border-border/40 pt-4">
                                    <div className="flex items-center gap-3 bg-background border border-border/60 rounded-2xl px-4 py-3.5">
                                        <Link2 className="w-[18px] h-[18px] shrink-0 text-muted-foreground/50" strokeWidth={1.8} />
                                        <input
                                            type="text"
                                            placeholder="Paste invite link or trip ID…"
                                            value={joinCode}
                                            onChange={(e) => setJoinCode(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                                            autoFocus
                                            className="flex-1 bg-transparent text-[15px] font-medium text-foreground placeholder:text-muted-foreground/40 outline-none"
                                        />
                                    </div>
                                    <button
                                        onClick={handleJoin}
                                        disabled={!joinCode.trim()}
                                        className={`w-full py-3.5 rounded-2xl font-bold text-[15px] transition-all btn-press ${joinCode.trim()
                                            ? "bg-blue-500 text-white shadow-card"
                                            : "bg-muted text-muted-foreground/40 cursor-not-allowed"
                                            }`}
                                    >
                                        Join Trip
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Continue existing trip */}
                {currentTripId && currentTripId !== "mock-trip" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.28 }}
                    >
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="w-full flex items-center gap-3 py-3.5 px-5 rounded-2xl bg-secondary/40 border border-border/60 btn-press hover:bg-secondary/60 transition-colors"
                        >
                            <Users className="w-4 h-4 text-muted-foreground" strokeWidth={1.8} />
                            <span className="text-[14px] font-semibold text-muted-foreground">
                                Continue current trip
                            </span>
                            <ArrowRight className="w-4 h-4 text-muted-foreground/40 ml-auto" strokeWidth={1.8} />
                        </button>
                        <button
                            onClick={() => copyInvite()}
                            className="w-full flex items-center gap-3 py-3 px-5 mt-2 rounded-2xl btn-press hover:bg-secondary/30 transition-colors"
                        >
                            <Link2 className="w-4 h-4 text-muted-foreground/50" strokeWidth={1.8} />
                            <span className="text-[13px] font-medium text-muted-foreground/60">
                                Copy invite link for current trip
                            </span>
                        </button>
                    </motion.div>
                )}
            </div>

            <div className="flex-1 min-h-[40px]" />
        </div>
    );
}
