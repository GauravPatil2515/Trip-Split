export type SettlementStatus =
    | 'idle'
    | 'pending'
    | 'payment_initiated'
    | 'reference_added'
    | 'confirmed'
    | 'disputed';

export interface SettlementRecord {
    id: string;
    tripId: string;
    fromId: string;
    toId: string;
    amount: number; // in paise
    status: SettlementStatus;
    upiReferenceId?: string;
    createdAt: number;
    updatedAt: number;
    confirmedAt?: number;
}

/**
 * State machine transition definitions for settlements.
 * All operations must ultimately be synced via Firebase atomic transactions.
 */
export const SETTLEMENT_TRANSITIONS: Record<SettlementStatus, SettlementStatus[]> = {
    idle: ['payment_initiated'],
    pending: ['payment_initiated'],
    payment_initiated: ['reference_added', 'idle'],
    reference_added: ['confirmed', 'disputed'],
    disputed: ['reference_added', 'idle'],
    confirmed: [] // Terminal state
};

export function canTransitionSettlement(current: SettlementStatus, next: SettlementStatus): boolean {
    return SETTLEMENT_TRANSITIONS[current]?.includes(next) ?? false;
}
