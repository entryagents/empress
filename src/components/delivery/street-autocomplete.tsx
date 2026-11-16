"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Loader2, Check } from "lucide-react";

interface StreetSuggestion {
  displayName: string;
  road?: string;
  suburb?: string;
  city?: string;
  state?: string;
}

interface StreetAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  selectedCity?: string;
  placeholder?: string;
  className?: string;
  onSelectSuggestion?: (suggestion: StreetSuggestion) => void;
}

// Popular streets and neighborhoods across Delta State & Edo for instant fallback
const CURATED_DELTA_STREETS: Record<string, string[]> = {
  Warri: [
    "Airport Road, Effurun / Warri",
    "Enerhen Road, Effurun",
    "Deco Road, Warri",
    "Okumagba Avenue, Warri",
    "PTS Road, Effurun",
    "Refinery Road, Ekpan / Warri",
    "NPA Expressway, Warri",
    "Pessu Road, Warri Market",
    "Ogunu Road, Shell Gate, Warri",
    "Jakpa Road, Effurun",
  ],
  Asaba: [
    "Nnebisi Road, Asaba",
    "Okpanam Road, Asaba",
    "DBS Road, Asaba",
    "Anwai Road, Asaba",
    "Dennis Osadebay Way, Asaba",
    "Summit Road, Asaba",
    "Ibusa Road, Asaba",
    "Cable Point, Asaba",
  ],
  Ughelli: [
    "Market Road, Ughelli",
    "Isoko Road, Ughelli",
    "Otovwodo Junction, Ughelli",
    "Post Office Road, Ughelli",
    "Afiesere Road, Ughelli",
    "Ekuigbo Road, Ughelli",
  ],
  Benin: [
    "Airport Road, GRA, Benin City",
    "Sapele Road, Benin City",
    "Akpakpava Road, Benin City",
    "Ring Road, City Centre, Benin City",
    "Ekenwan Road, Benin City",
    "Uselu-Lagos Road, Benin City",
    "Mission Road, Benin City",
  ],
  Abraka: [
    "Delsu Main Gate Road, Abraka",
    "Campus 2 Road, Abraka",
    "Campus 3 Road, Abraka",
    "Old Sapele-Agbor Road, Abraka",
    "Police Station Road, Abraka",
    "River Ethiope Beach Road, Abraka",
  ],
};

export function StreetAutocomplete({
  value,
  onChange,
  selectedCity = "Warri",
  placeholder = "Start typing street name or neighborhood...",
  className = "",
  onSelectSuggestion,
}: StreetAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch or filter suggestions as user types
  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const cityKey = Object.keys(CURATED_DELTA_STREETS).find(
      (c) => c.toLowerCase() === selectedCity.toLowerCase()
    ) || "Warri";

    const localMatches = (CURATED_DELTA_STREETS[cityKey] || []).filter((s) =>
      s.toLowerCase().includes(query.toLowerCase())
    );

    // Debounced free geocoding query to OpenStreetMap Nominatim
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          `${query}, ${selectedCity}, Nigeria`
        )}&format=json&addressdetails=1&limit=5`;
        
        const res = await fetch(url, {
          headers: {
            "Accept-Language": "en",
          },
        });

        if (res.ok) {
          const data = await res.json();
          const nominatimNames = data.map((item: any) => item.display_name.split(",").slice(0, 3).join(",").trim());
          const merged = Array.from(new Set([...localMatches, ...nominatimNames])).slice(0, 6);
          setSuggestions(merged);
          setIsOpen(merged.length > 0);
        } else {
          setSuggestions(localMatches);
          setIsOpen(localMatches.length > 0);
        }
      } catch {
        setSuggestions(localMatches);
        setIsOpen(localMatches.length > 0);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [value, selectedCity]);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          required
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className={`w-full rounded border border-wine-900/20 bg-ivory-50/50 pl-3.5 pr-8 py-2 text-sm text-wine-950 placeholder:text-wine-400 focus:border-champagne-500 focus:outline-none ${className}`}
        />
        {isLoading && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <Loader2 className="size-3.5 animate-spin text-champagne-600" />
          </div>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-lg border border-wine-900/15 bg-white py-1 shadow-lg text-xs">
          {suggestions.map((item, idx) => (
            <li
              key={idx}
              onClick={() => {
                onChange(item);
                if (onSelectSuggestion) {
                  onSelectSuggestion({ displayName: item });
                }
                setIsOpen(false);
              }}
              className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-wine-50 cursor-pointer text-wine-900 border-b border-wine-900/5 last:border-0"
            >
              <MapPin className="size-3.5 text-champagne-600 shrink-0" />
              <span className="truncate">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
