"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/hooks/useUserStore";
import { useAuthStore } from "@/hooks/useAuthStore";
import { motion } from "framer-motion";
import { Compass } from "lucide-react";

export default function RootPage() {
    const router = useRouter();
    const { profile } = useUserStore();
    const { user, loading } = useAuthStore();

    useEffect(() => {
        if (loading) return; // wait for Firebase auth to resolve
        const t = setTimeout(() => {
            if (user && profile) {
                router.replace("/home");
            } else {
                router.replace("/login");
            }
        }, 600);
        return () => clearTimeout(t);
    }, [user, profile, loading, router]);

    return (
        <div className="min-h-dvh flex flex-col items-center justify-center gap-4">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-elevated"
            >
                <Compass className="w-8 h-8 text-primary-foreground" strokeWidth={1.8} />
            </motion.div>
            <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-[15px] font-semibold text-muted-foreground"
            >
                TripLedger
            </motion.p>
        </div>
    );
}
