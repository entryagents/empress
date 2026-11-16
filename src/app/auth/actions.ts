"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  updateCustomerProfile,
  saveCustomerAddress,
  deleteCustomerAddress,
  claimGuestOrderForAccount,
} from "@/lib/customer/service";

/**
 * -------------------------------------------------------------
 * AUTH ACTIONS
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

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      success: false,
      error: "Authentication service is not configured with live credentials. Please check back shortly.",
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || null,
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/account");
    return {
      success: true,
      message: data.session
        ? "Account created successfully."
        : "Account created! Please check your email to verify your registration before signing in.",
      hasSession: Boolean(data.session),
    };
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

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      success: false,
      error: "Authentication service is not configured with live credentials.",
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/account");
    revalidatePath("/order");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Login failed." };
  }
}

export async function customerSignOutAction() {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
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

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      success: false,
      error: "Authentication service is not configured.",
    };
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://empress-rosy.vercel.app"}/auth/update-password`,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      message: "If an account with that email exists, we have sent a secure password reset link.",
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to send reset email." };
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

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: "Authentication required." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Please sign in to update your profile." };
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
  const state = (formData.get("state") as string) || "Lagos";
  const city = (formData.get("city") as string) || "Lagos";
  const area = formData.get("area") as string;
  const street_address = formData.get("street_address") as string;
  const building_number = (formData.get("building_number") as string) || null;
  const landmark = (formData.get("landmark") as string) || null;
  const delivery_instructions = (formData.get("delivery_instructions") as string) || null;
  const is_default = formData.get("is_default") === "on" || formData.get("is_default") === "true";

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: "Authentication required." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Please sign in to manage your addresses." };
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
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: "Authentication required." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Please sign in to manage addresses." };
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

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { success: false, error: "Authentication required." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
