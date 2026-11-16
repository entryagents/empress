import { neon } from "@neondatabase/serverless";

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
  return url;
}

export function getDb() {
  const connString = getDatabaseUrl();
  if (!connString) {
    return null;
  }
  return neon(connString);
}

export const isDbConfigured = Boolean(getDatabaseUrl());
