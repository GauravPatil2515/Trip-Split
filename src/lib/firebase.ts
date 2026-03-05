/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Firebase Configuration
 *
 * Safely initializes Firebase using credentials from .env.local.
 * If no credentials are provided the app continues in offline/mock mode.
 *
 * Exports a `firebaseReadyPromise` that consumers can `await` to ensure
 * all Firebase services are initialized before using them.
 */

let db: any = null;
let app: any = null;
let auth: any = null;
let analytics: any = null;
let firebaseReady = false;

async function initFirebase() {
    try {
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

        if (!projectId) {
            console.info("[Firebase] No project ID found. Running in offline/mock mode.");
            return;
        }

        const { initializeApp, getApps, getApp } = await import("firebase/app");
        const {
            getFirestore,
            initializeFirestore,
            persistentLocalCache,
            persistentMultipleTabManager,
        } = await import("firebase/firestore");
        const {
            getAuth,
            initializeAuth,
            browserLocalPersistence,
            browserPopupRedirectResolver,
        } = await import("firebase/auth");

        const firebaseConfig = {
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
            projectId,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
            measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "",
        };

        app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

        // Firestore with multi-tab offline persistence
        try {
            db = initializeFirestore(app, {
                localCache: persistentLocalCache({
                    tabManager: persistentMultipleTabManager(),
                }),
            });
        } catch {
            db = getFirestore(app);
        }

        // Firebase Auth — use initializeAuth with explicit browserPopupRedirectResolver
        // so COOP-blocked window.close() on the popup is handled gracefully
        try {
            auth = initializeAuth(app, {
                persistence: browserLocalPersistence,
                popupRedirectResolver: browserPopupRedirectResolver,
            });
        } catch {
            // Already initialized on hot reload — fall back to getAuth
            auth = getAuth(app);
        }

        // Analytics (client-only, non-blocking)
        try {
            const { getAnalytics, isSupported } = await import("firebase/analytics");
            if (await isSupported()) {
                analytics = getAnalytics(app);
                console.info("[Firebase] Analytics enabled.");
            }
        } catch {
            // Analytics is purely optional — never block the app
        }

        firebaseReady = true;
        console.info(`[Firebase] Connected to project: ${projectId}`);
    } catch (e) {
        console.warn("[Firebase] Initialization failed. Continuing in mock mode.", e);
        firebaseReady = false;
    }
}

// Client-side only — create a promise that resolves when Firebase is ready.
// Server-side — resolves immediately (no Firebase on server).
const firebaseReadyPromise: Promise<void> =
    typeof window !== "undefined" ? initFirebase() : Promise.resolve();

export { db, app, auth, analytics, firebaseReady, firebaseReadyPromise };
