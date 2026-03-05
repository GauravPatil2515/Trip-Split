/**
 * UPI Deep-Linking Utility
 * Generates standards-compliant upi:// pay intents for mobile apps.
 */

export interface UPIPaymentParams {
    upiId: string;
    name: string;
    amount: number; // In rupees
    note?: string;
    currency?: string;
}

export function generateUPIIntent(params: UPIPaymentParams): string {
    const { upiId, name, amount, note = "TripLedger Settlement", currency = "INR" } = params;

    // Standard UPI URI format:
    // upi://pay?pa={vpa}&pn={name}&am={amount}&cu={currency}&tn={note}

    // Ensure params are URI encoded
    const encodedName = encodeURIComponent(name);
    const encodedNote = encodeURIComponent(note);
    const formattedAmount = amount.toFixed(2);

    return `upi://pay?pa=${upiId}&pn=${encodedName}&am=${formattedAmount}&cu=${currency}&tn=${encodedNote}`;
}

/**
 * Checks if the current environment is a mobile device to determine 
 * if we should show a deep link button or a QR code.
 */
export function isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}
