/**
 * Strict Money Engine
 * All financial values are stored and calculated in INT (Paise).
 * No floats. Sums must be deterministic.
 */

export function toPaise(rupees: number): number {
    return Math.round(parseFloat(rupees.toString()) * 100);
}

export function toRupees(paise: number): number {
    return paise / 100;
}

export function formatCurrencyPaise(paise: number): string {
    const amount = toRupees(paise);
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0, // Keeping UI exact-as-is, whole rupees mostly shown
    }).format(amount);
}

/**
 * Ensures strict deterministic monetary splits with no loss of paise.
 */
export function splitAmountPrecisely(totalPaise: number, participants: string[]): Record<string, number> {
    const numParticipants = participants.length;
    if (numParticipants === 0) return {};

    const baseSplit = Math.floor(totalPaise / numParticipants);
    const remainder = totalPaise % numParticipants;

    // Predictable rounding: Sort participants consistently (e.g. by ID)
    // to prevent race condition randomness in assignment.
    const sortedParticipants = [...participants].sort();
    const splits: Record<string, number> = {};

    for (let i = 0; i < sortedParticipants.length; i++) {
        splits[sortedParticipants[i]] = baseSplit + (i < remainder ? 1 : 0);
    }

    return splits;
}
