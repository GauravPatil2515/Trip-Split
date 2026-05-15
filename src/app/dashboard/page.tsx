"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ChevronRight, Receipt, Share2, Compass, Check, Copy, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { LiveBalanceBar } from "@/components/LiveBalanceBar";
import { ExpenseCard } from "@/components/ExpenseCard";
import { useTripStore } from "@/hooks/useTripStore";
import { useTripRealtime } from "@/hooks/useTripRealtime";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useUserStore } from "@/hooks/useUserStore";
import { TripQRCode } from "@/components/TripQRCode";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthStore();
  const { profile } = useUserStore();
  const { expenses, balances, members, tripName, currentUserId, tripId } = useTripStore();
  const [shareCopied, setShareCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !profile)) router.replace("/login");
  }, [user, profile, authLoading, router]);

  useTripRealtime(tripId);

  if (authLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-3xl gradient-hero flex items-center justify-center shadow-float">
            <Compass className="w-7 h-7 text-white" strokeWidth={1.8} />
          </div>
          <p className="text-[13px] text-muted-foreground font-medium">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) return null;

  const handleShare = () => { if (!tripId || tripId === "mock-trip") return; setShowShareModal(true); };
  const copyInvite = async () => {
    if (!tripId) return;
    await navigator.clipboard.writeText(`${window.location.origin}/t/${tripId}`);
    setShareCopied(true); setTimeout(() => setShareCopied(false), 2000);
  };

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const youPaid = expenses.filter((e) => e.paidBy.id === currentUserId).reduce((s, e) => s + e.amount, 0);
  const youOwe = balances.filter((b) => b.from.id === currentUserId).reduce((s, b) => s + b.amount, 0);
  const youGetBack = balances.filter((b) => b.to.id === currentUserId).reduce((s, b) => s + b.amount, 0);
  const pendingSettlements = balances.filter((b) => b.from.id === currentUserId || b.to.id === currentUserId).length;

  return (
    <div className="min-h-dvh pb-24 relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="orb w-56 h-56 top-[-40px] right-[-40px] bg-violet-600/10" />
      <div className="orb w-40 h-40 bottom-[120px] left-[-30px] bg-pink-500/8" />

      {/* Header */}
      <div className="px-5 pt-6 safe-top flex items-center justify-between">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex -space-x-2">
          {members.slice(0, 4).map((member) => (
            <div key={member.id} className={`w-8 h-8 rounded-full ${member.color} flex items-center justify-center text-[10px] font-semibold text-white ring-2 ring-background shadow-soft`}>
              {member.initials}
            </div>
          ))}
          {members.length > 4 && (
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground ring-2 ring-background">
              +{members.length - 4}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
          {tripId && tripId !== "mock-trip" && (
            <button
              onClick={handleShare}
              className="w-10 h-10 rounded-full glass border border-border/60 flex items-center justify-center shadow-soft btn-press hover:bg-primary/10 transition-colors"
            >
              <Share2 className="w-4 h-4 text-primary" strokeWidth={1.8} />
            </button>
          )}
          <Link href="/home">
            <button className="w-10 h-10 rounded-full glass border border-border/60 flex items-center justify-center shadow-soft btn-press hover:bg-white/5 transition-colors">
              <Compass className="w-4 h-4 text-muted-foreground" strokeWidth={1.8} />
            </button>
          </Link>
        </motion.div>
      </div>

      {/* Live Balance Bar */}
      <div className="px-5 mt-5 sticky top-4 z-30">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <LiveBalanceBar
            tripName={tripName || "Your Trip ✈️"}
            totalSpent={totalSpent} youPaid={youPaid}
            youOwe={youOwe} youGetBack={youGetBack}
          />
        </motion.div>
      </div>

      {/* Settlement nudge */}
      {pendingSettlements > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="px-5 mt-4">
          <Link href="/settlement" className="flex items-center justify-between glass border border-amber/20 rounded-2xl px-4 py-3.5 group btn-press hover:border-amber/40 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber/20 flex items-center justify-center">
                <span className="text-base">💳</span>
              </div>
              <span className="text-[14px] font-semibold text-amber-foreground">
                {pendingSettlements} pending settlement{pendingSettlements !== 1 ? "s" : ""}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-foreground/60 group-hover:text-amber-foreground transition-colors" />
          </Link>
        </motion.div>
      )}

      {/* Expense Timeline */}
      <div className="px-5 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-[17px] font-bold text-foreground">Recent Activity</h2>
          {expenses.length > 0 && (
            <span className="text-[13px] font-semibold text-muted-foreground">
              {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {expenses.length > 0 ? (
          <div className="space-y-3">
            {expenses.map((expense, index) => (
              <ExpenseCard key={expense.id} expense={expense} index={index} />
            ))}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-16 h-16 rounded-3xl glass border border-border/60 flex items-center justify-center mb-4">
              <Receipt className="w-7 h-7 text-muted-foreground/50" strokeWidth={1.5} />
            </div>
            <h3 className="font-display text-lg font-bold text-foreground mb-1">No expenses yet</h3>
            <p className="text-sm text-muted-foreground max-w-[200px] mb-6 leading-relaxed">
              Add your first expense and start splitting with the crew.
            </p>
            <Link href="/add-expense">
              <button className="gradient-primary text-white font-semibold px-6 py-3 rounded-2xl text-sm shadow-card glow-primary btn-press">
                Add First Expense 🧾
              </button>
            </Link>
          </motion.div>
        )}
      </div>

      {/* Floating FAB */}
      {expenses.length > 0 && (
        <Link href="/add-expense">
          <motion.button
            whileTap={{ scale: 0.88 }} whileHover={{ scale: 1.06 }}
            className="fixed bottom-24 right-1/2 translate-x-[170px] w-14 h-14 rounded-full gradient-primary text-white shadow-float glow-primary flex items-center justify-center z-40"
          >
            <Plus className="w-6 h-6" strokeWidth={2.5} />
          </motion.button>
        </Link>
      )}

      <BottomNav />

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && tripId && tripId !== "mock-trip" && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-5 right-5 -translate-y-1/2 glass-strong border border-border/60 rounded-3xl p-6 shadow-float z-50"
            >
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-between w-full mb-5">
                  <h3 className="font-display text-[18px] font-bold text-foreground">Invite to {tripName || "Trip"} 🔗</h3>
                  <button onClick={() => setShowShareModal(false)} className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <TripQRCode tripId={tripId} size={180} />
                <div className="mt-6 flex flex-col gap-3 w-full">
                  <button onClick={copyInvite} className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl gradient-primary text-white text-[14px] font-semibold btn-press shadow-elevated glow-primary">
                    {shareCopied ? <><Check className="w-5 h-5" />Copied!</> : <><Copy className="w-5 h-5" />Copy Invite Link</>}
                  </button>
                  <button onClick={() => setShowShareModal(false)} className="w-full py-3.5 rounded-2xl glass border border-border/60 text-[14px] font-semibold btn-press hover:bg-white/5 transition-colors">
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
