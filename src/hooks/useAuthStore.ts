/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';

export interface AuthUser {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    phoneNumber: string | null;
}

interface AuthStore {
    user: AuthUser | null;
    loading: boolean;             // true while onAuthStateChanged fires first time
    setUser: (user: AuthUser | null) => void;
    setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    loading: true,
    // setUser no longer auto-sets loading: false — AuthProvider controls that
    // after both auth AND profile have been resolved
    setUser: (user) => set({ user }),
    setLoading: (loading) => set({ loading }),
}));
