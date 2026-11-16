"use client";

import React, { useMemo } from "react";
import { Navigation, MapPin, AlertCircle } from "lucide-react";

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

  // Check if Mapbox / Google Maps API keys are present in env
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Render defensive coordinates visualizer or Mapbox static preview if token available
  const staticMapUrl = useMemo(() => {
    if (!hasGps) return null;
    if (mapboxToken) {
      return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-s-car+d4b377(${driverLng},${driverLat})/${driverLng},${driverLat},14,0/600x380@2x?access_token=${mapboxToken}`;
    }
    if (googleMapsKey) {
      return `https://maps.googleapis.com/maps/api/staticmap?center=${driverLat},${driverLng}&zoom=14&size=600x380&maptype=roadmap&markers=color:gold%7Clabel:D%7C${driverLat},${driverLng}&key=${googleMapsKey}`;
    }
    return null;
  }, [hasGps, driverLat, driverLng, mapboxToken, googleMapsKey]);

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-wine-900/15 bg-wine-950 text-ivory-50 shadow-md ${className}`}
      style={{ minHeight: "320px" }}
    >
      {/* Visual Map Canvas / Fallback Interactive Radar */}
      {staticMapUrl ? (
        <img
          src={staticMapUrl}
          alt="Live Delivery Map"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-radial from-wine-900/80 via-wine-950 to-[#120309]">
          {/* Subtle Grid Lines to represent geospatial canvas */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(212,179,119,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(212,179,119,0.2) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          {hasGps ? (
            <div className="relative z-10 flex flex-col items-center text-center">
              {/* Pulsing GPS Radar Node */}
              <div className="relative flex items-center justify-center mb-4">
                <div className="absolute size-20 rounded-full bg-champagne-400/20 animate-ping" />
                <div className="absolute size-14 rounded-full bg-champagne-400/30" />
                <div className="relative flex size-10 items-center justify-center rounded-full bg-champagne-500 text-wine-950 shadow-lg">
                  <Navigation className="size-5 transform rotate-45" />
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-champagne-400/15 border border-champagne-400/30 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-widest text-champagne-300">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                Courier In Transit
              </span>

              <p className="mt-3 text-xs font-mono text-ivory-300">
                Lat {driverLat?.toFixed(4)}°, Lng {driverLng?.toFixed(4)}°
              </p>
              {destinationAddress && (
                <p className="mt-1 text-xs text-ivory-400 max-w-xs truncate">
                  En route to: {destinationAddress}
                </p>
              )}
            </div>
          ) : (
            <div className="relative z-10 flex flex-col items-center text-center max-w-xs">
              <div className="flex size-12 items-center justify-center rounded-full bg-wine-900 border border-champagne-500/20 text-champagne-400 mb-3">
                <MapPin className="size-6 opacity-75" />
              </div>
              <p className="text-sm font-medium text-ivory-200">
                Awaiting Courier GPS Fix
              </p>
              <p className="mt-1 text-xs text-ivory-400">
                Coordinates will appear on the live radar as soon as the dispatch rider begins the trip.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Overlaid Status Indicators */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
        {isStale && (
          <div className="pointer-events-auto flex items-center gap-1.5 rounded-md bg-amber-950/90 border border-amber-600/40 px-2.5 py-1 text-[0.7rem] font-medium text-amber-200 shadow-md">
            <AlertCircle className="size-3.5 text-amber-400" />
            <span>Signal paused / Courier may be in transit</span>
          </div>
        )}

        {lastUpdated && (
          <div className="pointer-events-auto ml-auto rounded-md bg-wine-950/80 border border-wine-800/40 px-2.5 py-1 text-[0.7rem] font-mono text-ivory-300 shadow-md">
            Updated: {new Date(lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
        )}
      </div>
    </div>
  );
}
