"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import {
  updateCustomerProfile,
  saveCustomerAddress,
  deleteCustomerAddress,
  claimGuestOrderForAccount,
} from "@/lib/customer/service";
import { headers } from "next/headers";

/**
 * -------------------------------------------------------------
 * AUTH ACTIONS (BETTER AUTH + NEON)
 * -------------------------------------------------------------
 */
export async function customerSignUpAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const fullName = (formData.get("full_name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();

  if (!email || !password || !fullName) {
    return { success: false, error: "Please fill in all required fields." };
  }

  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters long." };
  }

  try {
    const res = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: fullName,
      },
    });

    if (res && res.user) {
      // Save full_name and phone to customer_profiles
      const sql = getDb();
      if (sql) {
        await sql`
          INSERT INTO customer_profiles (id, email, full_name, phone, role)
          VALUES (${res.user.id}, ${email}, ${fullName}, ${phone || null}, 'customer')
          ON CONFLICT (id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            phone = EXCLUDED.phone;
        `;
      }

      revalidatePath("/account");
      return {
        success: true,
        message: "Account created successfully.",
        hasSession: true,
      };
    }

    return { success: false, error: "Failed to create account." };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create account." };
  }
}

export async function customerLoginAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Please enter your email and password." };
  }

  try {
    const res = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });

    if (res && res.user) {
      revalidatePath("/account");
      revalidatePath("/order");
      return { success: true };
    }

    return { success: false, error: "Invalid email or password." };
  } catch (err: any) {
    return { success: false, error: err.message || "Login failed." };
  }
}

export async function customerSignOutAction() {
  try {
    await auth.api.signOut({
      headers: await headers(),
    });
  } catch {
    // Ignore error
  }
  revalidatePath("/");
  revalidatePath("/account");
  redirect("/");
}

export async function customerResetPasswordAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email) {
    return { success: false, error: "Please enter your email address." };
  }

  try {
    await auth.api.requestPasswordReset({
      body: {
        email,
        redirectTo: `${process.env.BETTER_AUTH_URL || "https://empress-rosy.vercel.app"}/auth/update-password`,
      },
    });

    return {
      success: true,
      message: "If an account with that email exists, we have sent instructions to reset your password.",
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to process password reset request." };
  }
}

/**
 * -------------------------------------------------------------
 * PROFILE ACTIONS
 * -------------------------------------------------------------
 */
export async function updateProfileAction(formData: FormData) {
  const fullName = formData.get("full_name") as string;
  const phone = formData.get("phone") as string;

  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  try {
    await updateCustomerProfile(user.id, { full_name: fullName, phone });
    revalidatePath("/account");
    return { success: true, message: "Profile updated successfully." };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * -------------------------------------------------------------
 * SAVED ADDRESS ACTIONS
 * -------------------------------------------------------------
 */
export async function saveAddressAction(formData: FormData) {
  const id = formData.get("id") as string | null;
  const label = (formData.get("label") as string) || "Home";
  const state = (formData.get("state") as string) || "Delta State";
  const city = (formData.get("city") as string) || "Warri";
  const area = formData.get("area") as string;
  const street_address = formData.get("street_address") as string;
  const building_number = (formData.get("building_number") as string) || null;
  const landmark = (formData.get("landmark") as string) || null;
  const delivery_instructions = (formData.get("delivery_instructions") as string) || null;
  const is_default = formData.get("is_default") === "on" || formData.get("is_default") === "true";

  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  try {
    await saveCustomerAddress(user.id, {
      id: id || undefined,
      label,
      state,
      city,
      area,
      street_address,
      building_number,
      landmark,
      delivery_instructions,
      is_default,
    });

    revalidatePath("/account/addresses");
    return { success: true, message: "Address saved." };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteAddressAction(addressId: string) {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  try {
    await deleteCustomerAddress(user.id, addressId);
    revalidatePath("/account/addresses");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * -------------------------------------------------------------
 * CLAIM GUEST ORDER ACTION
 * -------------------------------------------------------------
 */
export async function claimOrderAction(formData: FormData) {
  const orderRef = (formData.get("order_reference") as string)?.trim().toUpperCase();
  const tokenOrPhone = (formData.get("verification_token_or_phone") as string)?.trim();

  const user = await getSessionUser();
  if (!user || !user.email) {
    return { success: false, error: "Please sign in to claim previous orders." };
  }

  try {
    const res = await claimGuestOrderForAccount(user.id, user.email, orderRef, tokenOrPhone);
    revalidatePath("/account/orders");
    return res;
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

/**
 * -------------------------------------------------------------
 * GOOGLE ONBOARDING ACTION
 * -------------------------------------------------------------
 */
export async function completeGoogleOnboardingAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "Please sign in with Google first." };
  }

  const fullName = (formData.get("full_name") as string)?.trim();
  const username = (formData.get("username") as string)?.trim().toLowerCase();
  const phone = (formData.get("phone") as string)?.trim();

  if (!fullName || !username || !phone) {
    return { success: false, error: "All fields (Full Name, Username, Phone Number) are required." };
  }

  // Validate Nigerian phone format
  const phoneClean = phone.replace(/\s+/g, "");
  if (!/^(?:\+234|0)[789][01]\d{8}$/.test(phoneClean)) {
    return { success: false, error: "Please enter a valid Nigerian phone number (e.g. 08031234567 or +2348031234567)." };
  }

  const sql = getDb();
  if (sql) {
    try {
      // Check username uniqueness
      const existing = await sql`
        SELECT id FROM "user" WHERE username = ${username} AND id != ${user.id} LIMIT 1;
      `;
      if (existing && existing.length > 0) {
        return { success: false, error: "This username is already taken. Please choose another." };
      }

      await sql`
        UPDATE "user"
        SET name = ${fullName}, username = ${username}, phone = ${phoneClean}, "onboardingCompleted" = TRUE, "updatedAt" = NOW()
        WHERE id = ${user.id};
      `;

      await sql`
        INSERT INTO customer_profiles (id, email, full_name, phone, role)
        VALUES (${user.id}, ${user.email}, ${fullName}, ${phoneClean}, 'customer')
        ON CONFLICT (id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          phone = EXCLUDED.phone;
      `;
    } catch (e: any) {
      return { success: false, error: e.message || "Failed to complete onboarding." };
    }
  }

  revalidatePath("/account");
  return { success: true };
}
