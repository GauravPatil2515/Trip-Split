/**
 * Strict Money Engine
 * All financial values are stored and calculated in INT (Paise).
 * No floats. Sums must be deterministic.
 */

export function toPaise(rupees: number): number {
    return Math.round(rupees * 100);
}

export function toRupees(paise: number): number {
    return paise / 100;
}

/**
 * Ensures strict deterministic monetary splits with no loss of paise.
 * Standard Equal Split.
 */
export function splitAmountPrecisely(totalPaise: number, participants: string[]): Record<string, number> {
    const numParticipants = participants.length;
    if (numParticipants === 0) return {};

    const baseSplit = Math.floor(totalPaise / numParticipants);
    const remainder = totalPaise % numParticipants;

    // Use IDs for stable sorting
    const sortedParticipants = [...participants].sort();
    const splits: Record<string, number> = {};

    for (let i = 0; i < sortedParticipants.length; i++) {
        splits[sortedParticipants[i]] = baseSplit + (i < remainder ? 1 : 0);
    }

    return splits;
}

/**
 * Split by exact percentages (e.g. 60.5%).
 * Handles rounding remainders by assigning to the participant with the largest fractional part
 * or the first alphabetically if tied.
 */
export function splitByPercentage(totalPaise: number, percentages: Record<string, number>): Record<string, number> {
    const userIds = Object.keys(percentages);
    if (userIds.length === 0) return {};

    const splits: Record<string, number> = {};
    let totalAssigned = 0;

    // First pass: assign base floor amounts
    userIds.forEach(id => {
        const amount = Math.floor((totalPaise * percentages[id]) / 100);
        splits[id] = amount;
        totalAssigned += amount;
    });

    // Handle remainder (paise loss from flooring)
    const remainder = totalPaise - totalAssigned;
    if (remainder > 0) {
        // Assign remainder 1-by-1 to users who have the largest "unpaid" fraction
        const sorted = userIds.sort((a, b) => {
            const fractionA = (totalPaise * percentages[a] / 100) % 1;
            const fractionB = (totalPaise * percentages[b] / 100) % 1;
            if (fractionA !== fractionB) return fractionB - fractionA;
            return a.localeCompare(b);
        });

        for (let i = 0; i < remainder; i++) {
            splits[sorted[i]] += 1;
        }
    }

    return splits;
}

/**
 * Split by shares (e.g. 2 parts for Alice, 1 for Bob).
 */
export function splitByShares(totalPaise: number, shares: Record<string, number>): Record<string, number> {
    const userIds = Object.keys(shares);
    if (userIds.length === 0) return {};

    const totalShares = Object.values(shares).reduce((a, b) => a + b, 0);
    if (totalShares === 0) return {};

    const splits: Record<string, number> = {};
    let totalAssigned = 0;

    userIds.forEach(id => {
        const amount = Math.floor((totalPaise * shares[id]) / totalShares);
        splits[id] = amount;
        totalAssigned += amount;
    });

    const remainder = totalPaise - totalAssigned;
    if (remainder > 0) {
        const sorted = userIds.sort((a, b) => {
            const fractionA = (totalPaise * shares[a] / totalShares) % 1;
            const fractionB = (totalPaise * shares[b] / totalShares) % 1;
            if (fractionA !== fractionB) return fractionB - fractionA;
            return a.localeCompare(b);
        });

        for (let i = 0; i < remainder; i++) {
            splits[sorted[i]] += 1;
        }
    }

    return splits;
}

export function formatCurrencyPaise(paise: number, currency: string = "INR"): string {
    const amount = toRupees(paise);
    try {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(amount);
    } catch {
        return `${currency} ${amount.toFixed(2)}`;
    }
}
