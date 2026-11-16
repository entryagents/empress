"use client";

import React, { useMemo } from "react";
import { Navigation, MapPin, AlertCircle, Compass } from "lucide-react";

interface LiveDeliveryMapProps {
  driverLat?: number | null;
  driverLng?: number | null;
  destinationAddress?: string;
  isStale?: boolean;
  lastUpdated?: string | null;
  interactive?: boolean;
  className?: string;
}

export function LiveDeliveryMap({
  driverLat,
  driverLng,
  destinationAddress,
  isStale = false,
  lastUpdated,
  className = "",
}: LiveDeliveryMapProps) {
  const hasGps = typeof driverLat === "number" && typeof driverLng === "number";

  // Delta State / Edo coordinates fallback (Warri default center: 5.5173, 5.7503)
  const lat = hasGps ? driverLat : 5.5173;
  const lng = hasGps ? driverLng : 5.7503;

  // OpenStreetMap embed iframe URL (Completely free, no API keys, zero rate-limiting)
  const osmEmbedUrl = useMemo(() => {
    const delta = 0.015;
    const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
      bbox
    )}&layer=mapnik&marker=${lat},${lng}`;
  }, [lat, lng]);

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-wine-900/15 bg-wine-950 text-ivory-50 shadow-md ${className}`}
      style={{ minHeight: "340px" }}
    >
      {/* Free Interactive OpenStreetMap Tile Canvas */}
      <iframe
        title="Delivery GPS Tracking Map"
        src={osmEmbedUrl}
        className="absolute inset-0 h-full w-full border-0 filter contrast-105 brightness-95 opacity-90"
        loading="lazy"
      />

      {/* Floating Status & HUD Overlay */}
      <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-10">
        <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-wine-900/20 bg-wine-950/85 px-3 py-1.5 backdrop-blur-md shadow-md text-xs">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-champagne-300">
            {hasGps ? "Live OpenStreetMap Radar" : "Empress Logistics Dispatch"}
          </span>
        </div>

        {destinationAddress && (
          <div className="pointer-events-auto flex items-center gap-1.5 rounded-lg border border-wine-900/20 bg-wine-950/85 px-3 py-1.5 backdrop-blur-md shadow-md text-[0.7rem] text-ivory-100 max-w-xs truncate">
            <MapPin className="size-3 text-champagne-400 shrink-0" />
            <span className="truncate">{destinationAddress}</span>
          </div>
        )}
      </div>

      {/* Bottom telemetry overlay */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <div className="pointer-events-auto rounded bg-wine-950/90 border border-wine-900/20 px-2.5 py-1 text-[0.65rem] font-mono text-champagne-300/90 backdrop-blur-xs">
          {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
        </div>

        {isStale && (
          <div className="pointer-events-auto flex items-center gap-1.5 rounded bg-amber-950/90 border border-amber-600/30 px-2.5 py-1 text-[0.65rem] text-amber-200">
            <AlertCircle className="size-3 text-amber-400" />
            <span>Telemetry buffer delayed</span>
          </div>
        )}
      </div>
    </div>
  );
}
