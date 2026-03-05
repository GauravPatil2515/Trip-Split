import { create } from 'zustand';
import { TripMember, Expense, Balance } from '@/lib/data';
import { calculateTripBalances, computeOptimizedSettlements } from '@/lib/balanceEngine';

export interface TripState {
    // Core data
    tripName: string;
    tripId: string | null;
    members: TripMember[];
    expenses: Expense[];
    balances: Balance[];

    // Identity — who is using this session
    currentUserId: string;
    currentUserName: string;

    // Settlement tracking
    settlementStates: Record<string, 'idle' | 'awaiting' | 'settled'>;
    settlementRefs: Record<string, string>;

    // UI states
    syncing: boolean;

    // Actions
    setTripName: (name: string) => void;
    setTripId: (id: string) => void;
    setCurrentUser: (id: string, name: string) => void;
    addExpense: (expense: Omit<Expense, 'id'>) => void;
    deleteExpense: (id: string) => void;
    replaceExpenses: (expenses: Expense[]) => void;
    recalculateBalances: () => void;
    markSettlement: (key: string, status: 'idle' | 'awaiting' | 'settled') => void;
    setSettlementRef: (key: string, ref: string) => void;
    resetAllSettlements: () => void;
    setSyncing: (syncing: boolean) => void;
}

let nextId = 100;

function deriveBalances(expenses: Expense[], members: TripMember[]): Balance[] {
    if (expenses.length === 0) return [];

    // Convert expenses to the format the balance engine expects (paise)
    const engineExpenses = expenses.map(e => ({
        id: e.id,
        amount: Math.round(e.amount * 100), // rupees -> paise
        paidById: e.paidBy.id,
        splitAmongIds: e.splitAmong.map(m => m.id),
    }));

    const rawBalances = calculateTripBalances(engineExpenses);
    const settlements = computeOptimizedSettlements(rawBalances);

    return settlements
        .map(s => ({
            from: members.find(m => m.id === s.from)!,
            to: members.find(m => m.id === s.to)!,
            amount: Math.round(s.amount) / 100, // paise -> rupees
        }))
        .filter(b => b.from && b.to && b.amount > 0);
}

export const useTripStore = create<TripState>((set) => ({
    tripName: '',
    tripId: null,
    members: [],
    expenses: [],
    balances: [],
    currentUserId: '',
    currentUserName: '',
    settlementStates: {},
    settlementRefs: {},
    syncing: false,

    setTripName: (tripName) => set({ tripName }),

    setTripId: (tripId) => set({ tripId }),

    setCurrentUser: (id, name) => {
        set(state => {
            // Update the member entry that corresponds to this user so UI names are correct
            const members = state.members.map(m =>
                m.id === state.currentUserId
                    ? { ...m, id, name, initials: name.slice(0, 2).toUpperCase() }
                    : m
            );
            return { currentUserId: id, currentUserName: name, members };
        });
    },

    addExpense: (expenseData) => {
        const id = String(nextId++);
        const newExpense: Expense = { ...expenseData, id };

        set(state => {
            const expenses = [newExpense, ...state.expenses];
            const balances = deriveBalances(expenses, state.members);
            return {
                expenses,
                balances,
                // Reset settlement states because balances changed
                settlementStates: {},
                settlementRefs: {},
            };
        });
    },

    deleteExpense: (id) => {
        set(state => {
            const expenses = state.expenses.filter(e => e.id !== id);
            const balances = deriveBalances(expenses, state.members);
            return {
                expenses,
                balances,
                settlementStates: {},
                settlementRefs: {},
            };
        });
    },

    // Replace full expense list (used by Firestore realtime sync)
    replaceExpenses: (expenses) => {
        set(state => ({
            expenses,
            balances: deriveBalances(expenses, state.members),
            settlementStates: {},
            settlementRefs: {},
        }));
    },

    recalculateBalances: () => {
        set(state => ({
            balances: deriveBalances(state.expenses, state.members),
        }));
    },

    markSettlement: (key, status) => {
        set(state => ({
            settlementStates: { ...state.settlementStates, [key]: status },
        }));
    },

    setSettlementRef: (key, ref) => {
        set(state => ({
            settlementRefs: { ...state.settlementRefs, [key]: ref },
        }));
    },

    resetAllSettlements: () => {
        set({ settlementStates: {}, settlementRefs: {} });
    },

    setSyncing: (syncing) => set({ syncing }),
}));
