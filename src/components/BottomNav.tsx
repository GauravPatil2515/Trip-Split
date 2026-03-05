"use client";

import { Home, Receipt, PieChart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useTripStore } from "@/hooks/useTripStore";

export function BottomNav() {
    const pathname = usePathname();
    const { balances, settlementStates } = useTripStore();

    // Count unsettled balances
    const unsettledCount = balances.filter(
        (_, i) => settlementStates[String(i)] !== "settled"
    ).length;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/85 backdrop-blur-xl border-t border-border/60 pb-safe">
            <div className="max-w-[430px] mx-auto flex items-center justify-around h-16 px-4">
                <Link href="/dashboard" className="flex flex-col items-center gap-1 relative btn-press group w-16">
                    <Home
                        className={`w-[22px] h-[22px] transition-colors ${pathname === "/dashboard"
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-foreground"
                            }`}
                        strokeWidth={pathname === "/dashboard" ? 2.5 : 2}
                    />
                    <span className={`text-[10px] font-semibold ${pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"}`}>Home</span>
                    {pathname === "/dashboard" && (
                        <motion.div layoutId="nav-pill" className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary" />
                    )}
                </Link>

                <Link href="/insights" className="flex flex-col items-center gap-1 relative btn-press group w-16">
                    <PieChart
                        className={`w-[22px] h-[22px] transition-colors ${pathname === "/insights"
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-foreground"
                            }`}
                        strokeWidth={pathname === "/insights" ? 2.5 : 2}
                    />
                    <span className={`text-[10px] font-semibold ${pathname === "/insights" ? "text-primary" : "text-muted-foreground"}`}>Insights</span>
                    {pathname === "/insights" && (
                        <motion.div layoutId="nav-pill" className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary" />
                    )}
                </Link>

                <Link
                    href="/settlement"
                    className="flex flex-col items-center gap-1 relative btn-press group w-16"
                >
                    <div className="relative">
                        <Receipt
                            className={`w-[22px] h-[22px] transition-colors ${pathname === "/settlement"
                                ? "text-primary"
                                : "text-muted-foreground group-hover:text-foreground"
                                }`}
                            strokeWidth={pathname === "/settlement" ? 2.5 : 2}
                        />
                        {unsettledCount > 0 && (
                            <div className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-amber flex items-center justify-center text-[9px] font-bold text-amber-foreground ring-2 ring-card shadow-sm">
                                {unsettledCount}
                            </div>
                        )}
                    </div>
                    <span className={`text-[10px] font-semibold ${pathname === "/settlement" ? "text-primary" : "text-muted-foreground"}`}>Settle</span>
                    {pathname === "/settlement" && (
                        <motion.div layoutId="nav-pill" className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary" />
                    )}
                </Link>
            </div>
        </div>
    );
}
