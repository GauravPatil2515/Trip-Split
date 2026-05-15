"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User, Phone, CreditCard, QrCode, ArrowRight, Check, X, Camera,
} from "lucide-react";
import { useUserStore } from "@/hooks/useUserStore";
import { useAuthStore } from "@/hooks/useAuthStore";

const PROFILE_COLORS = [
  "bg-violet-500", "bg-pink-500", "bg-blue-500",
  "bg-emerald-500", "bg-amber-500", "bg-rose-500",
];
function pickColor() { return PROFILE_COLORS[Math.floor(Math.random() * PROFILE_COLORS.length)]; }

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/home";
  const { profile, saveProfile } = useUserStore();
  const { user: authUser, loading: authLoading } = useAuthStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (!authLoading && authUser) {
      if (profile) router.replace(redirectTo);
      else { setStep(2); setSigningIn(false); }
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

  useEffect(() => {
    if (authUser?.displayName && !name) setName(authUser.displayName);
    if (authUser?.phoneNumber && !phone) setPhone(authUser.phoneNumber);
  }, [authUser, name, phone]);

  const canProceed = name.trim().length > 0;

  const handleGoogleSignIn = async () => {
    setSigningIn(true); setAuthError("");
    try {
      const { auth } = await import("@/lib/firebase");
      const { signInWithPopup, GoogleAuthProvider, browserPopupRedirectResolver } = await import("firebase/auth");
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider, browserPopupRedirectResolver);
      setSigningIn(false);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      const msg = err instanceof Error ? err.message : "Sign-in failed";
      if (code.includes("popup-closed") || code.includes("cancelled")) setAuthError("Sign-in cancelled.");
      else if (code === "auth/popup-blocked") setAuthError("Popup blocked. Disable Brave Shields or use Chrome.");
      else if (code === "auth/operation-not-allowed") setAuthError("Enable Google sign-in in Firebase Console.");
      else if (code === "auth/unauthorized-domain") setAuthError("Add this domain in Firebase → Auth → Authorised domains.");
      else if (msg.includes("Cross-Origin") || msg.includes("COOP")) setAuthError("Browser security blocked sign-in. Try disabling Shields or use Chrome.");
      else setAuthError(`Sign-in failed (${code || "unknown"}).`);
      setSigningIn(false);
    }
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
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
      id, name: name.trim(), phone: phone.trim(), upiId: upiId.trim(),
      qrImage, color: pickColor(), initials: name.trim().slice(0, 2).toUpperCase(),
    });
    router.push(redirectTo);
  };

  const inputBase = "flex items-center gap-3 glass border rounded-2xl px-4 py-3.5 transition-all duration-200";
  const focusCls = (key: string) =>
    focused === key ? "border-primary/50 ring-1 ring-primary/20 shadow-card" : "border-border/60";

  if (authLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-3xl gradient-hero flex items-center justify-center shadow-float">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
              <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0" />
              <path d="M12 8v4l3 3" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col px-6 safe-top safe-bottom relative overflow-hidden">
      {/* Ambient background orbs */}
      <div className="orb w-72 h-72 top-[-100px] left-[-80px] bg-violet-600/15" />
      <div className="orb w-56 h-56 bottom-[-60px] right-[-60px] bg-pink-500/10" />

      <div className="flex-1 min-h-[32px]" />

      <AnimatePresence mode="wait">
        {/* ── STEP 1: Google Sign-In ── */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="w-20 h-20 rounded-3xl gradient-hero flex items-center justify-center mb-6 shadow-float glow-primary"
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0" />
                <path d="M12 8v4l3 3" />
                <path d="M8.5 4.5A10 10 0 0 1 21 12" />
              </svg>
            </motion.div>

            <h1 className="font-display text-[30px] font-bold text-gradient tracking-tight mb-2">
              TripSplit
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-[260px] leading-relaxed mb-10">
              Track expenses, split costs, and share your trip story — the aesthetic way.
            </p>

            {/* Google button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={signingIn}
              className="w-full max-w-[320px] flex items-center justify-center gap-3 glass-strong rounded-2xl px-5 py-4 text-[15px] font-semibold text-foreground shadow-card hover:shadow-elevated transition-all duration-200 btn-press disabled:opacity-50"
            >
              {signingIn ? (
                <span className="text-muted-foreground">Signing in…</span>
              ) : (
                <>
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
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-[13px] text-destructive text-center max-w-[280px] leading-relaxed"
              >
                {authError}
              </motion.p>
            )}

            <p className="mt-8 text-[11px] text-muted-foreground/40 text-center max-w-[260px]">
              By continuing, you agree to our Terms &amp; Privacy Policy.
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
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full"
          >
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-3xl gradient-hero flex items-center justify-center mb-4 shadow-float">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0" />
                  <path d="M12 8v4l3 3" />
                </svg>
              </div>
              <h1 className="font-display text-[24px] font-bold text-foreground tracking-tight">
                Set up your profile
              </h1>
              <p className="text-sm text-muted-foreground mt-1.5 text-center max-w-[270px] leading-relaxed">
                So your crew knows who you are and how to pay you back.
              </p>
            </div>

            <div className="space-y-3">
              {/* Name */}
              <div className={`${inputBase} ${focusCls("name")}`}>
                <User className={`w-[18px] h-[18px] shrink-0 transition-colors ${focused === "name" ? "text-primary" : "text-muted-foreground/50"}`} strokeWidth={1.8} />
                <input
                  type="text" placeholder="Your full name *" value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setFocused("name")} onBlur={() => setFocused(null)}
                  className="flex-1 bg-transparent text-[15px] font-medium text-foreground placeholder:text-muted-foreground/40 outline-none"
                />
              </div>

              {/* Phone */}
              <div className={`${inputBase} ${focusCls("phone")}`}>
                <Phone className={`w-[18px] h-[18px] shrink-0 transition-colors ${focused === "phone" ? "text-primary" : "text-muted-foreground/50"}`} strokeWidth={1.8} />
                <input
                  type="tel" inputMode="numeric" placeholder="Phone number" value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onFocus={() => setFocused("phone")} onBlur={() => setFocused(null)}
                  className="flex-1 bg-transparent text-[15px] font-medium text-foreground placeholder:text-muted-foreground/40 outline-none"
                />
              </div>

              {/* UPI */}
              <div className={`${inputBase} ${focusCls("upi")}`}>
                <CreditCard className={`w-[18px] h-[18px] shrink-0 transition-colors ${focused === "upi" ? "text-primary" : "text-muted-foreground/50"}`} strokeWidth={1.8} />
                <input
                  type="text" inputMode="email" placeholder="UPI ID (e.g. name@upi)" value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  onFocus={() => setFocused("upi")} onBlur={() => setFocused(null)}
                  className="flex-1 bg-transparent text-[15px] font-medium text-foreground placeholder:text-muted-foreground/40 outline-none"
                />
                {upiId.includes("@") && <Check className="w-4 h-4 text-success shrink-0" strokeWidth={2.5} />}
              </div>

              {/* QR Upload */}
              <div className="glass border border-border/60 rounded-2xl px-4 py-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <QrCode className="w-[18px] h-[18px] shrink-0 text-muted-foreground/50" strokeWidth={1.8} />
                    <div>
                      <p className="text-[14px] font-medium text-foreground">UPI QR Code</p>
                      {qrFileName
                        ? <p className="text-[11px] text-success font-medium truncate max-w-[150px]">{qrFileName}</p>
                        : <p className="text-[11px] text-muted-foreground/50">Optional — for in-person payments</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {qrImage && (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={qrImage} alt="QR" className="w-9 h-9 rounded-lg object-cover border border-border/60" />
                        <button onClick={() => { setQrImage(null); setQrFileName(""); }} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-destructive/20 transition-colors">
                          <X className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </>
                    )}
                    <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/15 text-primary text-[12px] font-semibold btn-press hover:bg-primary/25 transition-colors">
                      <Camera className="w-3.5 h-3.5" />
                      {qrImage ? "Change" : "Upload"}
                    </button>
                  </div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleQrUpload} />
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground/40 text-center mt-4">
              Phone, UPI &amp; QR are optional — add later anytime.
            </p>

            <div className="mt-8">
              <motion.button
                onClick={handleSave}
                disabled={!canProceed || saving}
                whileTap={canProceed ? { scale: 0.97, y: 1 } : {}}
                className={`w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-semibold text-[15px] transition-all duration-200 btn-press ${
                  canProceed && !saving
                    ? "gradient-primary text-white shadow-elevated glow-primary"
                    : "bg-muted text-muted-foreground/40 cursor-not-allowed"
                }`}
              >
                {saving ? <span>Saving…</span> : <><span>Continue</span><ArrowRight className="w-4 h-4" strokeWidth={2} /></>}
              </motion.button>
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
        <div className="w-16 h-16 rounded-3xl gradient-hero flex items-center justify-center shadow-float">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
            <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0" />
            <path d="M12 8v4l3 3" />
          </svg>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
