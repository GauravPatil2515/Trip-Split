"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useUserStore } from "@/hooks/useUserStore";

/**
 * AuthProvider
 * Mount once in layout.tsx.
 * Waits for Firebase to initialise, then listens to onAuthStateChanged.
 *  - Updates useAuthStore with the Firebase user
 *  - Loads the user's TripLedger profile from Firestore users/{uid}
 *  - Sets loading=false ONLY after both user + profile are resolved
 *  - Falls back gracefully when Firebase is not configured
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { setUser, setLoading } = useAuthStore();
    const { setProfile, clearProfile } = useUserStore();

    useEffect(() => {
        let unsubscribe = () => { };

        (async () => {
            try {
                // Wait for Firebase to fully initialise (resolves the race condition)
                const { firebaseReadyPromise } = await import("@/lib/firebase");
                await firebaseReadyPromise;

                const { auth, db, firebaseReady } = await import("@/lib/firebase");

                if (!firebaseReady || !auth) {
                    // No Firebase — treat as "no user, not loading"
                    setLoading(false);
                    return;
                }

                const { onAuthStateChanged } = await import("firebase/auth");
                const { doc, getDoc } = await import("firebase/firestore");

                unsubscribe = onAuthStateChanged(auth, async (firebaseUser: any) => {
                    if (!firebaseUser) {
                        setUser(null);
                        clearProfile();
                        setLoading(false);
                        return;
                    }

                    // Sync Firebase user into auth store (does NOT touch loading)
                    setUser({
                        uid: firebaseUser.uid,
                        displayName: firebaseUser.displayName,
                        email: firebaseUser.email,
                        photoURL: firebaseUser.photoURL,
                        phoneNumber: firebaseUser.phoneNumber,
                    });

                    // Load saved profile from Firestore if it exists
                    if (db) {
                        try {
                            const snap = await getDoc(doc(db, "users", firebaseUser.uid));
                            if (snap.exists()) {
                                setProfile(snap.data() as any);
                            }
                            // If no profile doc yet → login page will show the setup form
                        } catch (e) {
                            console.warn("[AuthProvider] Could not load profile:", e);
                        }
                    }

                    // Done: both user and profile are now resolved
                    setLoading(false);
                });
            } catch (e) {
                console.warn("[AuthProvider] Auth init failed:", e);
                setLoading(false);
            }
        })();

        return () => unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <>{children}</>;
}
