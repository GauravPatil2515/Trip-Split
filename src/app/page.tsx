"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/hooks/useUserStore";
import { useAuthStore } from "@/hooks/useAuthStore";
import { motion } from "framer-motion";

export default function RootPage() {
  const router = useRouter();
  const { profile } = useUserStore();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      if (user && profile) router.replace("/home");
      else router.replace("/login");
    }, 900);
    return () => clearTimeout(t);
  }, [user, profile, loading, router]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-5 relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="orb w-64 h-64 top-[-80px] left-[-60px] bg-violet-600/20" />
      <div className="orb w-48 h-48 bottom-[-40px] right-[-40px] bg-pink-500/15" />

      {/* Logo mark */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 18 }}
        className="relative"
      >
        <div className="w-20 h-20 rounded-3xl gradient-hero flex items-center justify-center shadow-float glow-primary">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0" />
            <path d="M12 8v4l3 3" />
            <path d="M8.5 4.5A10 10 0 0 1 21 12" />
          </svg>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col items-center gap-1"
      >
        <h1 className="font-display text-2xl font-bold text-gradient tracking-tight">
          TripSplit
        </h1>
        <p className="text-xs text-muted-foreground font-medium tracking-widest uppercase">
          Travel · Split · Flex
        </p>
      </motion.div>

      {/* Loader dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex gap-1.5"
      >
        {[0, 0.15, 0.3].map((d, i) => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1, delay: d }}
            className="w-1.5 h-1.5 rounded-full bg-primary"
          />
        ))}
      </motion.div>
    </div>
  );
}
