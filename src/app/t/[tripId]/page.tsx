"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { Compass, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useTripStore } from "@/hooks/useTripStore";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useUserStore } from "@/hooks/useUserStore";
import { TripMember } from "@/lib/data";

interface TripPreview {
    name: string;
    members: TripMember[];
    createdBy: string;
}

export default function JoinTripPage() {
    const router = useRouter();
    const params = useParams<{ tripId: string }>();
    const tripId = params.tripId;

    const { user, loading: authLoading } = useAuthStore();
    const { profile } = useUserStore();
    const { setTripName, setTripId, setCurrentUser, replaceExpenses } = useTripStore();

    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [trip, setTrip] = useState<TripPreview | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Auth guard: redirect to login with redirect param
    useEffect(() => {
        if (!authLoading && (!user || !profile)) {
            router.replace(`/login?redirect=/t/${tripId}`);
        }
    }, [user, profile, authLoading, router, tripId]);

    // ── Load trip preview from Firestore ────────────────────────────────────
    useEffect(() => {
        if (!tripId || !user) return;

        (async () => {
            try {
                const { firebaseReady, db } = await import("@/lib/firebase");

                if (!firebaseReady || !db) {
                    setError("You're offline. Ask the trip creator to share credentials directly, or start a new trip.");
                    setLoading(false);
                    return;
                }

                const { doc, getDoc } = await import("firebase/firestore");
                const snap = await getDoc(doc(db, "trips", tripId));

                if (!snap.exists()) {
                    setError("Trip not found. The link may be invalid or the trip has been deleted.");
                } else {
                    const data = snap.data() as TripPreview;
                    // Check if already a member
                    if (data.members?.some(m => m.id === user.uid)) {
                        // Already in this trip — go directly to dashboard
                        setTripName(data.name);
                        setTripId(tripId);
                        setCurrentUser(user.uid, profile?.name ?? user.displayName ?? "You");
                        useTripStore.setState({ members: data.members });
                        router.replace("/dashboard");
                        return;
                    }
                    setTrip(data);
                }
            } catch (e) {
                console.error("[JoinTrip] Failed to load trip:", e);
                setError("Could not connect to the server. Check your connection and try again.");
            } finally {
                setLoading(false);
            }
        })();
    }, [tripId, user, profile, setTripName, setTripId, setCurrentUser, router]);

    // ── Join the trip ────────────────────────────────────────────────────────
    const handleJoin = async () => {
        if (!profile || !user || joining) return;
        setJoining(true);

        try {
            const newMember: TripMember = {
                id: user.uid,
                name: profile.name,
                initials: profile.initials,
                color: profile.color,
                phone: profile.phone,
                upiId: profile.upiId,
                qrImage: profile.qrImage,
            };

            const updatedMembers = [...(trip?.members ?? []), newMember];

            // ── Firebase: add new member to the trip doc ───────────────────
            const { firebaseReady, db } = await import("@/lib/firebase");
            if (firebaseReady && db) {
                try {
                    const { doc, updateDoc } = await import("firebase/firestore");
                    await updateDoc(doc(db, "trips", tripId), {
                        members: updatedMembers,
                    });
                } catch (e) {
                    console.warn("[JoinTrip] Could not update members in Firestore:", e);
                }
            }

            // ── Commit to Zustand store ────────────────────────────────────
            setTripName(trip?.name ?? "Trip");
            setTripId(tripId);
            setCurrentUser(user.uid, profile.name);
            replaceExpenses([]);
            useTripStore.setState({ members: updatedMembers });

            router.push("/dashboard");
        } finally {
            setJoining(false);
        }
    };

    // ── Render ───────────────────────────────────────────────────────────────
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

    return (
        <div className="min-h-dvh flex flex-col px-6 safe-top safe-bottom">
            <div className="flex-1 min-h-[60px]" />

            {/* Branding */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center mb-10"
            >
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-5 shadow-elevated">
                    <Compass className="w-8 h-8 text-primary-foreground" strokeWidth={1.8} />
                </div>
                <h1 className="text-[28px] font-bold text-foreground tracking-tight">
                    TripLedger
                </h1>
                <p className="text-[14px] text-muted-foreground mt-1.5">
                    You&apos;ve been invited to join a trip
                </p>
            </motion.div>

            {/* Trip Preview Card */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card border border-border/80 rounded-3xl p-5 shadow-card mb-5"
            >
                {loading ? (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : error ? (
                    <div className="flex items-start gap-3 py-2">
                        <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                        <p className="text-[13px] text-muted-foreground leading-relaxed">{error}</p>
                    </div>
                ) : trip ? (
                    <>
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                            Trip
                        </p>
                        <h2 className="text-[22px] font-bold text-foreground mb-4">
                            {trip.name}
                        </h2>

                        {trip.members.length > 0 && (
                            <>
                                <p className="text-[11px] font-semibold text-muted-foreground mb-2">
                                    {trip.members.length} member{trip.members.length !== 1 ? "s" : ""} already in
                                </p>
                                <div className="flex -space-x-2">
                                    {trip.members.slice(0, 7).map((m) => (
                                        <div
                                            key={m.id}
                                            title={m.name}
                                            className={`w-9 h-9 rounded-full ${m.color} flex items-center justify-center text-[11px] font-semibold text-white ring-2 ring-background`}
                                        >
                                            {m.initials}
                                        </div>
                                    ))}
                                    {trip.members.length > 7 && (
                                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground ring-2 ring-background">
                                            +{trip.members.length - 7}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Joining as... */}
                        <div className="mt-4 pt-4 border-t border-border/40 flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full ${profile.color} flex items-center justify-center text-[11px] font-semibold text-white`}>
                                {profile.initials}
                            </div>
                            <div>
                                <p className="text-[13px] font-semibold text-foreground">Joining as {profile.name}</p>
                                {profile.upiId && <p className="text-[11px] text-muted-foreground">💳 {profile.upiId}</p>}
                            </div>
                        </div>
                    </>
                ) : null}
            </motion.div>

            <div className="flex-1 min-h-[40px]" />

            {/* CTA */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="pb-6"
            >
                {error ? (
                    <button
                        onClick={() => router.push("/")}
                        className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-semibold text-[15px] bg-primary text-primary-foreground shadow-elevated btn-press"
                    >
                        Start a New Trip
                        <ArrowRight className="w-4 h-4" strokeWidth={2} />
                    </button>
                ) : (
                    <button
                        onClick={handleJoin}
                        disabled={joining || loading || !!error}
                        className={`w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-semibold text-[15px] transition-all duration-200 btn-press ${!joining && !loading
                            ? "bg-primary text-primary-foreground shadow-elevated hover:shadow-float"
                            : "bg-muted text-muted-foreground/40 cursor-not-allowed"
                            }`}
                    >
                        {joining ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                                <span>Joining…</span>
                            </>
                        ) : (
                            <>
                                <span>Join Trip</span>
                                <ArrowRight className="w-4 h-4" strokeWidth={2} />
                            </>
                        )}
                    </button>
                )}
            </motion.div>
        </div>
    );
}
