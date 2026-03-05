"use client";

import { QRCodeSVG } from "qrcode.react";

interface TripQRCodeProps {
    tripId: string;
    size?: number;
}

export function TripQRCode({ tripId, size = 180 }: TripQRCodeProps) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/t/${tripId}`;

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="bg-white p-3 rounded-2xl shadow-soft border border-border/40">
                <QRCodeSVG
                    value={url}
                    size={size}
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#0f172a"
                    style={{ borderRadius: "8px" }}
                />
            </div>
            <p className="text-[11px] text-muted-foreground font-medium text-center max-w-[200px]">
                Ask others to scan this QR to join your trip
            </p>
        </div>
    );
}
