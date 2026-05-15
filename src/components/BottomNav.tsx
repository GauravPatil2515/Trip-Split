"use client";

import { Home, Receipt, PieChart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useTripStore } from "@/hooks/useTripStore";

export function BottomNav() {
  const pathname = usePathname();
  const { balances, settlementStates } = useTripStore();
  const unsettledCount = balances.filter((_, i) => settlementStates[String(i)] !== "settled").length;

  const tabs = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/insights", label: "Insights", icon: PieChart },
    { href: "/settlement", label: "Settle", icon: Receipt, badge: unsettledCount },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pb-safe">
      <div className="max-w-[430px] mx-auto px-4 pb-3">
        <div className="glass-strong border border-border/60 rounded-3xl shadow-elevated flex items-center justify-around h-16 px-2">
          {tabs.map(({ href, label, icon: Icon, badge }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} className="flex flex-col items-center gap-1 relative btn-press group w-20 py-2">
                <div className="relative">
                  {active && (
                    <motion.div
                      layoutId="nav-active-bg"
                      className="absolute inset-[-6px] rounded-xl bg-primary/15"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon
                    className={`w-[20px] h-[20px] relative z-10 transition-colors ${
                      active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    }`}
                    strokeWidth={active ? 2.5 : 1.8}
                  />
                  {badge !== undefined && badge > 0 && (
                    <div className="absolute -top-2 -right-2.5 w-4 h-4 rounded-full bg-amber flex items-center justify-center text-[9px] font-bold text-amber-foreground ring-2 ring-background shadow-sm">
                      {badge}
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-semibold transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
