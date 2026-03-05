import {
    splitAmountPrecisely,
    splitByPercentage,
    splitByShares
} from './money';
import { SplitType } from './data';

export interface BaseExpense {
    id: string;
    amount: number; // in paise
    paidById: string;
    splitAmongIds: string[];
    splitType?: SplitType;
    splitValues?: Record<string, number>;
}

/**
 * Derived Balance System.
 * Do NOT store user balances directly. 
 * Compute balances dynamically from expenses.
 */
export function calculateTripBalances(expenses: BaseExpense[]): Record<string, number> {
    const balances: Record<string, number> = {}; // userId -> netBalanceInPaise (Positive = gets back, Negative = owes)

    for (const exp of expenses) {
        if (!balances[exp.paidById]) balances[exp.paidById] = 0;
        balances[exp.paidById] += exp.amount;

        let splits: Record<string, number> = {};
        const type = exp.splitType || "equal";

        switch (type) {
            case "equal":
                splits = splitAmountPrecisely(exp.amount, exp.splitAmongIds);
                break;
            case "percentage":
                splits = splitByPercentage(exp.amount, exp.splitValues || {});
                break;
            case "shares":
                splits = splitByShares(exp.amount, exp.splitValues || {});
                break;
            case "exact":
                // For exact, splitValues already contains the paise amounts
                splits = exp.splitValues || {};
                break;
        }

        for (const [userId, amountOwed] of Object.entries(splits)) {
            if (!balances[userId]) balances[userId] = 0;
            balances[userId] -= amountOwed;
        }
    }

    return balances;
}

/**
 * Resolves net balances into peer-to-peer minimum transactions.
 * Uses greedy algorithm for maximum efficiency.
 */
export function computeOptimizedSettlements(balances: Record<string, number>) {
    const debtors: { id: string; amount: number }[] = [];
    const creditors: { id: string; amount: number }[] = [];

    for (const [id, bal] of Object.entries(balances)) {
        if (bal < 0) debtors.push({ id, amount: Math.abs(bal) });
        else if (bal > 0) creditors.push({ id, amount: bal });
    }

    // Sort by largest amounts first
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const transactions: { from: string; to: string; amount: number }[] = [];

    let d = 0;
    let c = 0;

    while (d < debtors.length && c < creditors.length) {
        const debtor = debtors[d];
        const creditor = creditors[c];

        const amount = Math.min(debtor.amount, creditor.amount);

        if (amount > 0) {
            transactions.push({
                from: debtor.id,
                to: creditor.id,
                amount,
            });
        }

        debtor.amount -= amount;
        creditor.amount -= amount;

        if (debtor.amount === 0) d++;
        if (creditor.amount === 0) c++;
    }

    return transactions;
}
