import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
    id: string;           // = Firebase UID
    name: string;
    phone: string;
    upiId: string;
    qrImage: string | null; // base64 data URL
    color: string;
    initials: string;
}

interface UserStore {
    profile: UserProfile | null;
    setProfile: (profile: UserProfile) => void;
    saveProfile: (profile: UserProfile) => Promise<void>; // persists to Firestore
    updateProfile: (partial: Partial<UserProfile>) => void;
    clearProfile: () => void;
}

export const useUserStore = create<UserStore>()(
    persist(
        (set) => ({
            profile: null,

            setProfile: (profile) => set({ profile }),

            saveProfile: async (profile: UserProfile) => {
                set({ profile });
                // Persist to Firestore (non-blocking, best-effort)
                try {
                    const { firebaseReady, db } = await import('@/lib/firebase');
                    if (firebaseReady && db) {
                        const { doc, setDoc } = await import('firebase/firestore');
                        await setDoc(doc(db, 'users', profile.id), profile, { merge: true });
                    }
                } catch (e) {
                    console.warn('[UserStore] Could not save profile to Firestore:', e);
                }
            },

            updateProfile: (partial) =>
                set((state) => ({
                    profile: state.profile ? { ...state.profile, ...partial } : null,
                })),

            clearProfile: () => set({ profile: null }),
        }),
        { name: 'tripledger-user' }
    )
);

