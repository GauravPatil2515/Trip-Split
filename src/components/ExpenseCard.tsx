"use client";

import { motion } from "framer-motion";
import { Expense, CATEGORY_ICONS, CATEGORY_LABELS, formatCurrency } from "@/lib/data";
import { useTripStore } from "@/hooks/useTripStore";

interface ExpenseCardProps {
  expense: Expense;
  index: number;
}

export function ExpenseCard({ expense, index }: ExpenseCardProps) {
  const { currency } = useTripStore();
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      whileTap={{ scale: 0.983 }}
      className="group glass border border-border/50 rounded-2xl p-4 shadow-card hover:border-primary/20 hover:shadow-elevated transition-all duration-300 cursor-pointer"
    >
      <div className="flex items-start gap-3.5">
        {/* Category Icon */}
        <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center text-lg">
          {CATEGORY_ICONS[expense.category]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-display text-[15px] font-bold text-foreground truncate leading-tight">
                {expense.title}
              </h4>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                {CATEGORY_LABELS[expense.category]} · Paid by{" "}
                <span className="font-semibold text-primary/80">{expense.paidBy.name}</span>
              </p>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-[15px] font-bold tabular-nums text-foreground">
                {formatCurrency(expense.amount, currency)}
              </p>
              {expense.gstIncluded && (
                <span className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wide">incl. GST</span>
              )}
            </div>
          </div>

          {/* Split avatars */}
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/30">
            <div className="flex items-center -space-x-1.5">
              {expense.splitAmong.slice(0, 4).map((member) => (
                <div key={member.id} className={`w-6 h-6 rounded-full ${member.color} flex items-center justify-center text-[9px] font-bold text-white ring-2 ring-card`}>
                  {member.initials}
                </div>
              ))}
              {expense.splitAmong.length > 4 && (
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[9px] font-medium text-muted-foreground ring-2 ring-card">
                  +{expense.splitAmong.length - 4}
                </div>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground/60">
              {expense.time} · {expense.date}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
