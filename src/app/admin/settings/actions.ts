"use server";

import { revalidatePath } from "next/cache";
import { getCurrentCustomer } from "@/lib/customer/service";
import {
  updateBusinessSettings,
  saveDeliveryZone,
  deleteDeliveryZone,
  updateHomepageCMS,
} from "@/lib/settings/service";
import type { BusinessSettings, HomepageCMSContent } from "@/types/settings";
import type { DeliveryZone } from "@/types/order";

/**
 * ----------------------------------------------------------------------------
 * BUSINESS SETTINGS ACTIONS
 * ----------------------------------------------------------------------------
 */

export async function updateBusinessSettingsAction(formData: FormData) {
  const { profile } = await getCurrentCustomer();
  if (profile && profile.role !== "admin" && profile.role !== "staff") {
    return { success: false, error: "Unauthorized: Administrator privileges required." };
  }

  const businessName = String(formData.get("business_name") || "");
  const phone = String(formData.get("phone") || "");
  const whatsappNumber = String(formData.get("whatsapp_number") || "");
  const email = String(formData.get("email") || "");
  const address = String(formData.get("address") || "");
  const city = String(formData.get("city") || "Asaba");
  const openingTime = String(formData.get("opening_time") || "10:00");
  const closingTime = String(formData.get("closing_time") || "22:00");
  const isTemporarilyClosed = formData.get("is_temporarily_closed") === "true";
  const temporaryClosureReason = String(formData.get("temporary_closure_reason") || "");
  const allowOrderingOverride = formData.get("allow_ordering_override") === "true";
  const deliveryEnabled = formData.get("delivery_enabled") === "true";
  const pickupEnabled = formData.get("pickup_enabled") === "true";
  const pickupAddress = String(formData.get("pickup_address") || "");
  const pickupInstructions = String(formData.get("pickup_instructions") || "");
  const prepMinutes = parseInt(String(formData.get("estimated_preparation_minutes") || "35"), 10);

  // Operating days parsing
  const operatingDaysRaw = formData.getAll("operating_days").map(String);

  try {
    const updated = await updateBusinessSettings({
      business_name: businessName,
      phone,
      whatsapp_number: whatsappNumber || null,
      email,
      address,
      country: "Nigeria",
      state: "Delta State",
      city,
      opening_time: openingTime,
      closing_time: closingTime,
      operating_days: operatingDaysRaw.length > 0 ? operatingDaysRaw : undefined,
      is_temporarily_closed: isTemporarilyClosed,
      temporary_closure_reason: temporaryClosureReason || null,
      allow_ordering_override: allowOrderingOverride,
      delivery_enabled: deliveryEnabled,
      pickup_enabled: pickupEnabled,
      pickup_address: pickupAddress || null,
      pickup_instructions: pickupInstructions || null,
      estimated_preparation_minutes: prepMinutes,
    });

    revalidatePath("/admin/settings");
    revalidatePath("/order");
    revalidatePath("/");
    return { success: true, settings: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update business settings.";
    return { success: false, error: message };
  }
}

/**
 * ----------------------------------------------------------------------------
 * DELTA STATE DELIVERY ZONE ACTIONS
 * ----------------------------------------------------------------------------
 */

export async function saveDeliveryZoneAction(zoneData: {
  id?: string;
  name: string;
  city: string;
  areas: string[];
  fee_kobo: number;
  estimated_minutes_min: number;
  estimated_minutes_max: number;
  is_active: boolean;
  display_order: number;
}) {
  const { profile } = await getCurrentCustomer();
  if (profile && profile.role !== "admin" && profile.role !== "staff") {
    return { success: false, error: "Unauthorized: Administrator privileges required." };
  }

  if (!zoneData.name.trim() || !zoneData.city.trim()) {
    return { success: false, error: "Zone name and city are required." };
  }

  try {
    const saved = await saveDeliveryZone({
      ...zoneData,
      state: "Delta State",
    });

    revalidatePath("/admin/settings");
    revalidatePath("/order");
    return { success: true, zone: saved };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save delivery zone.";
    return { success: false, error: message };
  }
}

export async function deleteDeliveryZoneAction(zoneId: string) {
  const { profile } = await getCurrentCustomer();
  if (profile && profile.role !== "admin" && profile.role !== "staff") {
    return { success: false, error: "Unauthorized: Administrator privileges required." };
  }

  try {
    await deleteDeliveryZone(zoneId);
    revalidatePath("/admin/settings");
    revalidatePath("/order");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete delivery zone.";
    return { success: false, error: message };
  }
}

/**
 * ----------------------------------------------------------------------------
 * HOMEPAGE CMS ACTIONS
 * ----------------------------------------------------------------------------
 */

export async function updateHomepageCMSAction(cmsData: Partial<HomepageCMSContent>) {
  const { profile } = await getCurrentCustomer();
  if (profile && profile.role !== "admin" && profile.role !== "staff") {
    return { success: false, error: "Unauthorized: Administrator privileges required." };
  }

  try {
    const updated = await updateHomepageCMS(cmsData);
    revalidatePath("/admin/settings");
    revalidatePath("/");
    return { success: true, cms: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update homepage CMS.";
    return { success: false, error: message };
  }
}
