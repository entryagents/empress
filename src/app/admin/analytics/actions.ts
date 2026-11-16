"use server";

import { getCurrentCustomer } from "@/lib/customer/service";
import { generateAnalyticsReport, exportAnalyticsCsv } from "@/lib/analytics/service";
import type { AnalyticsFilterParams, FullAnalyticsReport } from "@/types/analytics";

export async function fetchAnalyticsDataAction(
  params: AnalyticsFilterParams
): Promise<{ success: boolean; data?: FullAnalyticsReport; error?: string }> {
  const { profile } = await getCurrentCustomer();
  if (profile && profile.role !== "admin" && profile.role !== "staff") {
    return { success: false, error: "Unauthorized: Administrator privileges required." };
  }

  try {
    const report = await generateAnalyticsReport(params);
    return { success: true, data: report };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate analytics report.";
    return { success: false, error: message };
  }
}

export async function exportAnalyticsCsvAction(
  reportType: "orders" | "revenue" | "products" | "deliveries",
  params: AnalyticsFilterParams
): Promise<{ success: boolean; filename?: string; csvContent?: string; error?: string }> {
  const { profile } = await getCurrentCustomer();
  if (profile && profile.role !== "admin" && profile.role !== "staff") {
    return { success: false, error: "Unauthorized: Administrator privileges required." };
  }

  try {
    const result = await exportAnalyticsCsv(reportType, params);
    return { success: true, ...result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to export CSV report.";
    return { success: false, error: message };
  }
}
