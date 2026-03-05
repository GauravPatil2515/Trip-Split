export interface TripMember {
    id: string;
    name: string;
    initials: string;
    color: string;
    // Optional identity fields — populated when user has set up a profile
    phone?: string;
    upiId?: string;
    qrImage?: string | null; // base64 data URL
}

export type SplitType = "equal" | "exact" | "percentage" | "shares";

export interface Expense {
    id: string;
    title: string;
    amount: number; // In rupees/base currency
    category: "food" | "travel" | "stay" | "activity" | "shopping" | "other";
    paidBy: TripMember;
    splitAmong: TripMember[];
    date: string;
    time: string;
    gstIncluded: boolean;
    splitType: SplitType;
    // For non-equal splits, stores the values (amounts, percentages, or shares)
    splitValues?: Record<string, number>;
}

export interface Trip {
    id: string;
    name: string;
    currency: string;
    budget?: number;
    createdBy: string;
    createdAt: string; // ISO String or Firestore Timestamp
}

export interface Balance {
    from: TripMember;
    to: TripMember;
    amount: number;
}

export const CATEGORY_ICONS: Record<Expense["category"], string> = {
    food: "🍽️",
    travel: "🚗",
    stay: "🏨",
    activity: "🎯",
    shopping: "🛍️",
    other: "📦",
};

export const CATEGORY_LABELS: Record<Expense["category"], string> = {
    food: "Food & Drinks",
    travel: "Travel",
    stay: "Stay",
    activity: "Activities",
    shopping: "Shopping",
    other: "Other",
};

export function formatCurrency(amount: number, currency: string = "INR"): string {
    try {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(amount);
    } catch {
        const fallback = currency;
        return `${fallback} ${amount.toFixed(2)}`;
    }
}
