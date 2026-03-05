/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * useTripRealtime
 *
 * Binds a Firestore onSnapshot listener to a trip document.
 * When Firebase IS configured, syncs expenses and trip metadata into Zustand.
 * When Firebase is NOT configured, the store runs entirely in local mode.
 *
 * Call this once, at the top of the dashboard layout:
 *   useTripRealtime(tripId)
 */

import { useEffect, useRef } from 'react';
import { useTripStore } from './useTripStore';
import { Expense, TripMember } from '@/lib/data';

/**
 * Converts a raw Firestore expense document into the typed Expense object
 * expected by balanceEngine / UI components.
 *
 * Convention (set by useSettlementEngine.addExpenseTransaction):
 *   - amount  → stored in PAISE (integer)
 *   - paidBy  → { id, name, initials, color } sub-object
 *   - splitAmong → array of { id, name, initials, color }
 *   - createdAt → Firestore Timestamp
 */
function firestoreDocToExpense(docId: string, data: Record<string, any>): Expense {
    return {
        id: docId,
        title: data.title ?? 'Expense',
        amount: typeof data.amount === 'number' ? data.amount / 100 : 0, // paise → rupees
        category: data.category ?? 'other',
        paidBy: data.paidBy as TripMember,
        splitAmong: (data.splitAmong ?? []) as TripMember[],
        date: data.createdAt?.toDate
            ? data.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
            : (data.date ?? 'Unknown'),
        time: data.createdAt?.toDate
            ? data.createdAt.toDate().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
            : (data.time ?? ''),
        gstIncluded: data.gstIncluded ?? false,
        splitType: data.splitType ?? 'equal',
        splitValues: data.splitValues ?? {},
    };
}

export function useTripRealtime(tripId: string | null) {
    const { replaceExpenses, setTripName, setTripMetadata, setSyncing } = useTripStore();
    // Track the last snapshot size so we only log updates, not every render
    const lastSizeRef = useRef<number>(-1);

    useEffect(() => {
        if (!tripId || tripId === 'mock-trip') {
            return;
        }

        let unsubExpenses = () => { };
        let unsubMeta = () => { };

        (async () => {
            try {
                // Wait for Firebase to fully initialise before reading db/auth
                const { firebaseReadyPromise } = await import('@/lib/firebase');
                await firebaseReadyPromise;

                const { firebaseReady, db } = await import('@/lib/firebase');

                if (!firebaseReady || !db) {
                    // Firebase not configured — store runs in local mode
                    return;
                }

                const {
                    collection,
                    doc,
                    query,
                    orderBy,
                    onSnapshot,
                } = await import('firebase/firestore');

                setSyncing(true);

                // ── 1. Listen to trip metadata (name, members) ────────────────
                unsubMeta = onSnapshot(
                    doc(db, 'trips', tripId),
                    (snap: any) => {
                        if (snap.exists()) {
                            const data = snap.data();
                            if (data.name) setTripName(data.name);
                            if (data.currency) {
                                setTripMetadata(data.currency, data.budget);
                            }
                            if (Array.isArray(data.members)) {
                                useTripStore.setState({ members: data.members as TripMember[] });
                            }
                        }
                    },
                    (err: any) => console.warn('[TripRealtime] Metadata sync error:', err)
                );

                // ── 2. Listen to the expenses sub-collection ──────────────────
                const expensesQ = query(
                    collection(db, 'trips', tripId, 'expenses'),
                    orderBy('createdAt', 'desc')
                );

                unsubExpenses = onSnapshot(
                    expensesQ,
                    { includeMetadataChanges: false },
                    (snapshot: any) => {
                        const expenses: Expense[] = snapshot.docs.map((d: any) =>
                            firestoreDocToExpense(d.id, d.data())
                        );

                        if (expenses.length !== lastSizeRef.current) {
                            lastSizeRef.current = expenses.length;
                        }

                        replaceExpenses(expenses);
                        setSyncing(false);
                    },
                    (error: any) => {
                        console.error('[TripRealtime] Expense sync error:', error);
                        setSyncing(false);
                    }
                );
            } catch (e) {
                console.warn('[TripRealtime] Connection failed — running in local mode:', e);
                setSyncing(false);
            }
        })();

        return () => {
            unsubExpenses();
            unsubMeta();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tripId]);
}
