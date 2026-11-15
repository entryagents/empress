"use cache";

/** Cached so the year is computed at build/revalidate time, not per request. */
export async function CopyrightYear() {
  return <>{new Date().getFullYear()}</>;
}
