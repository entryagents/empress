import { getDb } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { CustomerProfile } from "@/types/customer";

export async function getSessionUser() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session || !session.user) {
      return null;
    }
    return session.user;
  } catch {
    return null;
  }
}

export async function getCurrentCustomer(): Promise<{
  user: { id: string; email: string } | null;
  profile: CustomerProfile | null;
}> {
  const user = await getSessionUser();
  if (!user) {
    return { user: null, profile: null };
  }

  const sql = getDb();
  if (sql) {
    try {
      const rows = await sql`
        SELECT * FROM customer_profiles WHERE id = ${user.id} LIMIT 1;
      `;
      if (rows && rows.length > 0) {
        return {
          user: { id: user.id, email: user.email },
          profile: rows[0] as CustomerProfile,
        };
      }
    } catch (e) {
      console.warn("Could not fetch customer_profile from Neon:", e);
    }
  }

  // Fallback to Better Auth user fields
  const fallbackProfile: CustomerProfile = {
    id: user.id,
    email: user.email,
    full_name: user.name || (user as any).username || "Valued Customer",
    phone: (user as any).phone || null,
    role: ((user as any).role as any) || "customer",
    created_at: (user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString()),
    updated_at: (user.updatedAt ? new Date(user.updatedAt).toISOString() : new Date().toISOString()),
  };

  return {
    user: { id: user.id, email: user.email },
    profile: fallbackProfile,
  };
}
