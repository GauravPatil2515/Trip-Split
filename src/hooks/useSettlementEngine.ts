/* eslint-disable @typescript-eslint/no-explicit-any */
import { toPaise } from '@/lib/money';
import { useTripStore } from './useTripStore';
import { Expense } from '@/lib/data';

/**
 * useSettlementEngine
 *
 * Single entry-point for all trip mutations.
 * When Firebase IS ready: writes via Firestore atomic transactions.
 *   → The onSnapshot listener in useTripRealtime will pick up the change
 *     and update the Zustand store automatically.
 * When Firebase is NOT ready: falls back to direct Zustand store mutation.
 *
 * Usage:
 *   const { addExpense, confirmSettlement } = useSettlementEngine(tripId);
 */
export function useSettlementEngine(tripId: string | null) {
    const store = useTripStore();

    /**
     * Helper: dynamically import Firebase and check readiness.
     * Returns { firebaseReady, db } AFTER the async init has completed.
     */
    async function getFirebase() {
        const { firebaseReadyPromise } = await import('@/lib/firebase');
        await firebaseReadyPromise;
        const { firebaseReady, db } = await import('@/lib/firebase');
        return { firebaseReady, db };
    }

    /**
     * Adds an expense to the trip.
     * Firebase path: atomic transaction writing to trips/{tripId}/expenses
     * Fallback path: direct Zustand store addExpense()
     */
    const addExpense = async (expenseData: Omit<Expense, 'id'>) => {
        const { firebaseReady, db } = await getFirebase();

        if (!tripId || tripId === 'mock-trip' || !firebaseReady || !db) {
            // Local-only mode — mutate the store directly
            store.addExpense(expenseData);
            return;
        }

        const { doc, runTransaction, serverTimestamp, collection } = await import('firebase/firestore');

        try {
            const expenseRef = doc(collection(db, 'trips', tripId, 'expenses'));
            const metadataRef = doc(db, 'trips', tripId, 'metadata', 'status');

            await runTransaction(db, async (transaction: any) => {
                // Guard: reject writes to archived trips
                const metaDoc = await transaction.get(metadataRef);
                if (metaDoc.exists() && metaDoc.data().archived) {
                    throw new Error('Cannot add expense to an archived trip.');
                }

                const pureAmount = toPaise(expenseData.amount); // rupees → paise

                transaction.set(expenseRef, {
                    title: expenseData.title,
                    amount: pureAmount,
                    category: expenseData.category,
                    paidBy: expenseData.paidBy,        // stored as sub-object
                    splitAmong: expenseData.splitAmong, // stored as array
                    gstIncluded: expenseData.gstIncluded,
                    splitType: expenseData.splitType || 'equal',
                    splitValues: expenseData.splitValues || {},
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
            });
            // Note: store update happens via useTripRealtime onSnapshot — no manual store.addExpense() needed
        } catch (error) {
            console.error('[SettlementEngine] addExpense transaction failed:', error);
            // Fallback: at least save locally so user doesn't lose data
            store.addExpense(expenseData);
            throw error;
        }
    };

    /**
     * Confirms a settlement payment with a UPI reference ID.
     * Firebase path: atomic transaction updating trips/{tripId}/settlements/{settlementId}
     * Fallback path: direct Zustand store markSettlement()
     */
    const confirmSettlement = async (settlementId: string, referenceId: string) => {
        store.markSettlement(settlementId, 'settled');
        store.setSettlementRef(settlementId, referenceId);

        const { firebaseReady, db } = await getFirebase();

        if (!tripId || tripId === 'mock-trip' || !firebaseReady || !db) {
            return; // Local mode — already done
        }

        const { doc, runTransaction, serverTimestamp } = await import('firebase/firestore');

        try {
            const settlementRef = doc(db, 'trips', tripId, 'settlements', settlementId);

            await runTransaction(db, async (transaction: any) => {
                const settlementDoc = await transaction.get(settlementRef);

                if (!settlementDoc.exists()) {
                    // Create the record if it doesn't exist yet
                    transaction.set(settlementRef, {
                        status: 'confirmed',
                        upiReferenceId: referenceId,
                        confirmedAt: serverTimestamp(),
                        createdAt: serverTimestamp(),
                    });
                    return;
                }

                if (settlementDoc.data().status === 'confirmed') {
                    throw new Error('Settlement is already confirmed.');
                }

                transaction.update(settlementRef, {
                    status: 'confirmed',
                    upiReferenceId: referenceId,
                    confirmedAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
            });
        } catch (error) {
            console.error('[SettlementEngine] confirmSettlement transaction failed:', error);
            // Local state is already updated above — non-fatal
        }
    };

    return { addExpense, confirmSettlement };
}
