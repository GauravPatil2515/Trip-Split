"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Compass,
    User,
    Phone,
    CreditCard,
    QrCode,
    ArrowRight,
    Check,
    X,
    Camera,
} from "lucide-react";
import { useUserStore } from "@/hooks/useUserStore";
import { useAuthStore } from "@/hooks/useAuthStore";

const PROFILE_COLORS = [
    "bg-primary", "bg-blue-500", "bg-rose-400",
    "bg-violet-500", "bg-emerald-500", "bg-amber-500",
];

function pickColor(): string {
    return PROFILE_COLORS[Math.floor(Math.random() * PROFILE_COLORS.length)];
}

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get("redirect") || "/home";
    const { profile, saveProfile } = useUserStore();
    const { user: authUser, loading: authLoading } = useAuthStore();

    // Step 1 = google sign-in, Step 2 = profile form
    const [step, setStep] = useState<1 | 2>(1);
    const [signingIn, setSigningIn] = useState(false);
    const [authError, setAuthError] = useState("");

    // If already authed + has profile → skip to destination
    useEffect(() => {
        if (!authLoading && authUser) {
            if (profile) {
                router.replace(redirectTo);
            } else {
                setStep(2);
                setSigningIn(false);
            }
        }
    }, [authUser, authLoading, profile, router, redirectTo]);

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [upiId, setUpiId] = useState("");
    const [qrImage, setQrImage] = useState<string | null>(null);
    const [qrFileName, setQrFileName] = useState("");
    const [focused, setFocused] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    // Pre-fill name from auth user
    useEffect(() => {
        if (authUser?.displayName && !name) setName(authUser.displayName);
        if (authUser?.phoneNumber && !phone) setPhone(authUser.phoneNumber);
    }, [authUser, name, phone]);

    const canProceed = name.trim().length > 0;

    const handleGoogleSignIn = async () => {
        setSigningIn(true);
        setAuthError("");
        try {
            const { auth } = await import("@/lib/firebase");
            const {
                signInWithPopup,
                GoogleAuthProvider,
                browserPopupRedirectResolver,
            } = await import("firebase/auth");
            const provider = new GoogleAuthProvider();
            // Pass browserPopupRedirectResolver explicitly so Firebase uses
            // the message-channel method instead of polling window.closed (COOP-safe)
            const result = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
            void result; // used only for side-effect
            // onAuthStateChanged in AuthProvider fires → sets user → useEffect moves to step 2
            setSigningIn(false);
        } catch (err: unknown) {
            const code = (err as { code?: string }).code ?? "";
            const msg = err instanceof Error ? err.message : "Sign-in failed";
            if (code.includes("popup-closed") || code.includes("cancelled")) {
                setAuthError("Sign-in cancelled.");
            } else if (code === "auth/popup-blocked") {
                setAuthError("Popup was blocked. If you're using Brave, disable Shields for localhost (lion icon → Shields off), then retry.");
            } else if (code === "auth/operation-not-allowed") {
                setAuthError("Google sign-in not enabled. Enable it in Firebase Console → Authentication → Sign-in method → Google.");
            } else if (code === "auth/unauthorized-domain") {
                setAuthError("Domain not authorised. Add 'localhost' in Firebase Console → Authentication → Settings → Authorised domains.");
            } else if (msg.includes("Cross-Origin") || msg.includes("COOP") || code === "auth/internal-error") {
                setAuthError("Browser security policy blocked sign-in. In Brave: click the lion icon → disable Shields for localhost. Or try Chrome.");
            } else {
                setAuthError(`Sign-in failed (${code || "unknown"}). Try disabling Brave Shields or use Chrome.`);
            }
            setSigningIn(false);
        }
    };

    const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setQrFileName(file.name);
        const reader = new FileReader();
        reader.onload = (ev) => setQrImage(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        if (!canProceed || saving) return;
        setSaving(true);
        await new Promise((r) => setTimeout(r, 300));

        const id = authUser?.uid ?? crypto.randomUUID();
        await saveProfile({
            id,
            name: name.trim(),
            phone: phone.trim(),
            upiId: upiId.trim(),
            qrImage,
            color: pickColor(),
            initials: name.trim().slice(0, 2).toUpperCase(),
        });

        router.push(redirectTo);
    };

    const inputBase =
        "flex items-center gap-3 bg-card border rounded-2xl px-4 py-3.5 transition-all duration-200 shadow-soft";
    const focused_ = (key: string) =>
        focused === key
            ? "border-primary/40 shadow-card ring-1 ring-primary/10"
            : "border-border/60";

    // ── Splash while Firebase auth resolves ──────────────────────────────
    if (authLoading) {
        return (
            <div className="min-h-dvh flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-elevated">
                        <Compass className="w-7 h-7 text-primary-foreground" strokeWidth={1.8} />
                    </div>
                    <p className="text-[13px] text-muted-foreground font-medium">Loading…</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-dvh flex flex-col px-6 safe-top safe-bottom">
            <div className="flex-1 min-h-[40px]" />

            <AnimatePresence mode="wait">
                {/* ── STEP 1: Google Sign-In ── */}
                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        className="flex flex-col items-center"
                    >
                        {/* Logo */}
                        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-5 shadow-elevated">
                            <Compass className="w-8 h-8 text-primary-foreground" strokeWidth={1.8} />
                        </div>
                        <h1 className="text-[26px] font-bold text-foreground tracking-tight mb-1">
                            TripLedger
                        </h1>
                        <p className="text-[14px] text-muted-foreground text-center max-w-[260px] leading-relaxed mb-10">
                            Split trip expenses effortlessly. Sign in to get started.
                        </p>

                        {/* Google button */}
                        <button
                            onClick={handleGoogleSignIn}
                            disabled={signingIn}
                            className="w-full max-w-[320px] flex items-center justify-center gap-3 bg-card border border-border/70 rounded-2xl px-5 py-4 text-[15px] font-semibold text-foreground shadow-soft hover:shadow-card transition-all duration-200 btn-press disabled:opacity-60"
                        >
                            {signingIn ? (
                                <span className="text-muted-foreground">Signing in…</span>
                            ) : (
                                <>
                                    {/* Google "G" SVG */}
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Continue with Google
                                </>
                            )}
                        </button>

                        {authError && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-3 text-[13px] text-destructive text-center"
                            >
                                {authError}
                            </motion.p>
                        )}

                        <p className="mt-8 text-[11px] text-muted-foreground/40 text-center max-w-[260px] leading-relaxed">
                            By continuing, you agree to our Terms of Service and Privacy Policy.
                        </p>
                    </motion.div>
                )}

                {/* ── STEP 2: Profile Form ── */}
                {step === 2 && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        className="w-full"
                    >
                        {/* Branding */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-elevated">
                                <Compass className="w-8 h-8 text-primary-foreground" strokeWidth={1.8} />
                            </div>
                            <h1 className="text-[26px] font-bold text-foreground tracking-tight">
                                Set up your profile
                            </h1>
                            <p className="text-[14px] text-muted-foreground mt-1.5 text-center max-w-[270px] leading-relaxed">
                                This lets your group know who you are and how to pay you back.
                            </p>
                        </div>

                        {/* Form fields */}
                        <div className="space-y-3">
                            {/* Name */}
                            <div className={`${inputBase} ${focused_("name")}`}>
                                <User
                                    className={`w-[18px] h-[18px] shrink-0 transition-colors ${focused === "name" ? "text-primary" : "text-muted-foreground/50"}`}
                                    strokeWidth={1.8}
                                />
                                <input
                                    type="text"
                                    placeholder="Your full name *"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onFocus={() => setFocused("name")}
                                    onBlur={() => setFocused(null)}
                                    className="flex-1 bg-transparent text-[15px] font-medium text-foreground placeholder:text-muted-foreground/40 outline-none"
                                />
                            </div>

                            {/* Phone */}
                            <div className={`${inputBase} ${focused_("phone")}`}>
                                <Phone
                                    className={`w-[18px] h-[18px] shrink-0 transition-colors ${focused === "phone" ? "text-primary" : "text-muted-foreground/50"}`}
                                    strokeWidth={1.8}
                                />
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    placeholder="Phone number"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    onFocus={() => setFocused("phone")}
                                    onBlur={() => setFocused(null)}
                                    className="flex-1 bg-transparent text-[15px] font-medium text-foreground placeholder:text-muted-foreground/40 outline-none"
                                />
                            </div>

                            {/* UPI ID */}
                            <div className={`${inputBase} ${focused_("upi")}`}>
                                <CreditCard
                                    className={`w-[18px] h-[18px] shrink-0 transition-colors ${focused === "upi" ? "text-primary" : "text-muted-foreground/50"}`}
                                    strokeWidth={1.8}
                                />
                                <input
                                    type="text"
                                    inputMode="email"
                                    placeholder="UPI ID (e.g. name@upi)"
                                    value={upiId}
                                    onChange={(e) => setUpiId(e.target.value)}
                                    onFocus={() => setFocused("upi")}
                                    onBlur={() => setFocused(null)}
                                    className="flex-1 bg-transparent text-[15px] font-medium text-foreground placeholder:text-muted-foreground/40 outline-none"
                                />
                                {upiId.includes("@") && (
                                    <Check className="w-4 h-4 text-success shrink-0" strokeWidth={2.5} />
                                )}
                            </div>

                            {/* QR Upload */}
                            <div className="bg-card border border-border/60 rounded-2xl px-4 py-3.5 shadow-soft">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <QrCode
                                            className="w-[18px] h-[18px] shrink-0 text-muted-foreground/50"
                                            strokeWidth={1.8}
                                        />
                                        <div>
                                            <p className="text-[14px] font-medium text-foreground">UPI QR Code</p>
                                            {qrFileName ? (
                                                <p className="text-[11px] text-success font-medium truncate max-w-[150px]">{qrFileName}</p>
                                            ) : (
                                                <p className="text-[11px] text-muted-foreground/50">Optional — for easy in-person payments</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {qrImage && (
                                            <>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={qrImage} alt="QR preview" className="w-9 h-9 rounded-lg object-cover border border-border/60" />
                                                <button
                                                    onClick={() => { setQrImage(null); setQrFileName(""); }}
                                                    className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-destructive/10 transition-colors"
                                                >
                                                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => fileRef.current?.click()}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary text-secondary-foreground text-[12px] font-semibold btn-press hover:bg-secondary/70 transition-colors"
                                        >
                                            <Camera className="w-3.5 h-3.5" />
                                            {qrImage ? "Change" : "Upload"}
                                        </button>
                                    </div>
                                </div>
                                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleQrUpload} />
                            </div>
                        </div>

                        <p className="text-[11px] text-muted-foreground/40 text-center mt-4">
                            Phone, UPI ID and QR are optional — you can update them later.
                        </p>

                        <div className="mt-8">
                            <AnimatePresence mode="wait">
                                <motion.button
                                    key={canProceed ? "on" : "off"}
                                    onClick={handleSave}
                                    disabled={!canProceed || saving}
                                    whileTap={canProceed ? { scale: 0.97, y: 1 } : {}}
                                    className={`w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-semibold text-[15px] transition-all duration-200 btn-press ${canProceed && !saving
                                        ? "bg-primary text-primary-foreground shadow-elevated hover:shadow-float"
                                        : "bg-muted text-muted-foreground/40 cursor-not-allowed"
                                        }`}
                                >
                                    {saving ? (
                                        <span>Saving…</span>
                                    ) : (
                                        <>
                                            <span>Continue</span>
                                            <ArrowRight className="w-4 h-4" strokeWidth={2} />
                                        </>
                                    )}
                                </motion.button>
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 min-h-[24px]" />
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-dvh flex items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-elevated">
                    <Compass className="w-7 h-7 text-primary-foreground" strokeWidth={1.8} />
                </div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
