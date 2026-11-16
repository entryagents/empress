import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";
  const city = searchParams.get("city")?.trim() || "Warri";

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const encodedQuery = encodeURIComponent(`${q}, ${city}, Nigeria`);
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&addressdetails=1&countrycodes=ng&limit=8`;

    const res = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "EmpressDelicaciesFoodDelivery/1.0 (contact@empressdelicacies.ng)",
        "Accept-Language": "en",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ results: [] });
    }

    const data = await res.json();
    const results = (data || []).map((item: any) => {
      const addr = item.address || {};
      const road = addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood || "";
      const suburb = addr.suburb || addr.quarter || addr.neighbourhood || "";
      const cityName = addr.city || addr.town || addr.village || addr.county || city;
      const state = addr.state || "Delta State";

      // Form clear, legible Nigerian street name
      const cleanParts = item.display_name.split(",").map((s: string) => s.trim());
      const shortDisplay = cleanParts.slice(0, 3).join(", ");

      return {
        displayName: shortDisplay,
        road,
        suburb,
        city: cityName,
        state,
        lat: item.lat,
        lon: item.lon,
      };
    });

    return NextResponse.json({ results });
  } catch (err) {
    console.warn("Live OSM street search error:", err);
    return NextResponse.json({ results: [] });
  }
}
