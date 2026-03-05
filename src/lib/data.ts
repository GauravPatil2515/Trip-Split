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

export interface Expense {
    id: string;
    title: string;
    amount: number;
    category: "food" | "travel" | "stay" | "activity" | "shopping" | "other";
    paidBy: TripMember;
    splitAmong: TripMember[];
    date: string;
    time: string;
    gstIncluded: boolean;
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

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}
