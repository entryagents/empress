"use client";

import React, { useState } from "react";
import {
  Building2,
  MapPin,
  Clock,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Truck,
  ShoppingBag,
  Sliders,
  Image as ImageIcon,
} from "lucide-react";
import type { BusinessSettings, HomepageCMSContent } from "@/types/settings";
import type { DeliveryZone } from "@/types/order";
import {
  updateBusinessSettingsAction,
  saveDeliveryZoneAction,
  deleteDeliveryZoneAction,
  updateHomepageCMSAction,
} from "./actions";

interface SettingsClientProps {
  initialSettings: BusinessSettings;
  initialZones: DeliveryZone[];
  initialCMS: HomepageCMSContent;
}

export function SettingsClient({
  initialSettings,
  initialZones,
  initialCMS,
}: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<"settings" | "zones" | "pickup" | "cms">("settings");

  // Settings State
  const [settings, setSettings] = useState<BusinessSettings>(initialSettings);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null);

  // Zones State
  const [zones, setZones] = useState<DeliveryZone[]>(initialZones);
  const [editingZone, setEditingZone] = useState<Partial<DeliveryZone> | null>(null);
  const [zoneSaving, setZoneSaving] = useState(false);

  // CMS State
  const [cms, setCms] = useState<HomepageCMSContent>(initialCMS);
  const [cmsSaving, setCmsSaving] = useState(false);
  const [cmsFeedback, setCmsFeedback] = useState<string | null>(null);

  // Submit Business Settings
  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsFeedback(null);

    const formData = new FormData(e.currentTarget);
    const res = await updateBusinessSettingsAction(formData);

    setSettingsSaving(false);
    if (res.success && res.settings) {
      setSettings(res.settings);
      setSettingsFeedback("Business settings saved successfully.");
      setTimeout(() => setSettingsFeedback(null), 4000);
    } else {
      setSettingsFeedback(res.error || "Failed to update settings.");
    }
  };

  // Save Zone
  const handleSaveZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingZone || !editingZone.name || !editingZone.city) return;

    setZoneSaving(true);
    const res = await saveDeliveryZoneAction({
      id: editingZone.id,
      name: editingZone.name,
      city: editingZone.city,
      areas: editingZone.areas || [],
      fee_kobo: editingZone.fee_kobo ?? 150000,
      estimated_minutes_min: editingZone.estimated_minutes_min ?? 30,
      estimated_minutes_max: editingZone.estimated_minutes_max ?? 50,
      is_active: editingZone.is_active ?? true,
      display_order: editingZone.display_order ?? zones.length + 1,
    });

    setZoneSaving(false);
    if (res.success && res.zone) {
      const idx = zones.findIndex((z) => z.id === res.zone!.id);
      if (idx >= 0) {
        setZones(zones.map((z) => (z.id === res.zone!.id ? res.zone! : z)));
      } else {
        setZones([...zones, res.zone]);
      }
      setEditingZone(null);
    }
  };

  // Delete Zone
  const handleDeleteZone = async (zoneId: string) => {
    if (!confirm("Are you sure you want to delete this delivery zone?")) return;
    const res = await deleteDeliveryZoneAction(zoneId);
    if (res.success) {
      setZones(zones.filter((z) => z.id !== zoneId));
    }
  };

  // Save CMS
  const handleSaveCMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setCmsSaving(true);
    setCmsFeedback(null);

    const res = await updateHomepageCMSAction(cms);
    setCmsSaving(false);
    if (res.success && res.cms) {
      setCms(res.cms);
      setCmsFeedback("Homepage CMS content updated live.");
      setTimeout(() => setCmsFeedback(null), 4000);
    } else {
      setCmsFeedback(res.error || "Failed to save CMS.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Title & Navigation Tabs */}
      <div>
        <h1 className="font-serif text-2xl font-light text-wine-950 sm:text-3xl">
          Enterprise Operations &amp; CMS
        </h1>
        <p className="mt-1 text-xs text-wine-800/80">
          Delta State delivery zones, business availability in Lagos WAT, and live homepage branding.
        </p>

        {/* Navigation Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 border-b border-wine-900/10 pb-3">
          <button
            onClick={() => setActiveTab("settings")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold uppercase tracking-wider transition ${
              activeTab === "settings"
                ? "bg-wine-900 text-ivory-50 shadow-xs"
                : "bg-white text-wine-900 hover:bg-ivory-100 border border-wine-900/10"
            }`}
          >
            <Building2 className="size-3.5" />
            Business Profile &amp; Hours
          </button>

          <button
            onClick={() => setActiveTab("zones")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold uppercase tracking-wider transition ${
              activeTab === "zones"
                ? "bg-wine-900 text-ivory-50 shadow-xs"
                : "bg-white text-wine-900 hover:bg-ivory-100 border border-wine-900/10"
            }`}
          >
            <Truck className="size-3.5" />
            Delta State Delivery Zones ({zones.length})
          </button>

          <button
            onClick={() => setActiveTab("pickup")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold uppercase tracking-wider transition ${
              activeTab === "pickup"
                ? "bg-wine-900 text-ivory-50 shadow-xs"
                : "bg-white text-wine-900 hover:bg-ivory-100 border border-wine-900/10"
            }`}
          >
            <ShoppingBag className="size-3.5" />
            Pickup &amp; Prep Settings
          </button>

          <button
            onClick={() => setActiveTab("cms")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold uppercase tracking-wider transition ${
              activeTab === "cms"
                ? "bg-wine-900 text-ivory-50 shadow-xs"
                : "bg-white text-wine-900 hover:bg-ivory-100 border border-wine-900/10"
            }`}
          >
            Homepage CMS
          </button>
        </div>
      </div>

      {/* TAB 1: BUSINESS PROFILE & HOURS */}
      {activeTab === "settings" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {settingsFeedback && (
            <div
              className={`flex items-center gap-2 rounded-xl p-4 text-xs font-medium ${
                settingsFeedback.includes("success")
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{settingsFeedback}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Business Contact & Identity */}
            <div className="rounded-xl border border-wine-900/10 bg-white p-6 shadow-xs space-y-4">
              <h2 className="font-serif text-lg font-medium text-wine-950 border-b border-wine-900/10 pb-2">
                Business Identity &amp; Contact
              </h2>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                  Business Name
                </label>
                <input
                  type="text"
                  name="business_name"
                  defaultValue={settings.business_name}
                  required
                  className="mt-1 w-full rounded border border-wine-900/20 p-2 text-xs text-wine-950 focus:border-champagne-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                    Phone (Voice)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    defaultValue={settings.phone}
                    required
                    className="mt-1 w-full rounded border border-wine-900/20 p-2 text-xs text-wine-950 focus:border-champagne-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                    WhatsApp Contact
                  </label>
                  <input
                    type="tel"
                    name="whatsapp_number"
                    defaultValue={settings.whatsapp_number || ""}
                    className="mt-1 w-full rounded border border-wine-900/20 p-2 text-xs text-wine-950 focus:border-champagne-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                  Official Email
                </label>
                <input
                  type="email"
                  name="email"
                  defaultValue={settings.email}
                  required
                  className="mt-1 w-full rounded border border-wine-900/20 p-2 text-xs text-wine-950 focus:border-champagne-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                  Business Address (Delta State)
                </label>
                <input
                  type="text"
                  name="address"
                  defaultValue={settings.address}
                  required
                  className="mt-1 w-full rounded border border-wine-900/20 p-2 text-xs text-wine-950 focus:border-champagne-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value="Nigeria"
                    readOnly
                    className="mt-1 w-full rounded border border-wine-900/10 bg-ivory-100/50 p-2 text-xs text-wine-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value="Delta State"
                    readOnly
                    className="mt-1 w-full rounded border border-wine-900/10 bg-ivory-100/50 p-2 text-xs font-bold text-wine-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                    City / Town
                  </label>
                  <input
                    type="text"
                    name="city"
                    defaultValue={settings.city}
                    required
                    className="mt-1 w-full rounded border border-wine-900/20 p-2 text-xs text-wine-950 focus:border-champagne-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Operating Hours & Availability */}
            <div className="rounded-xl border border-wine-900/10 bg-white p-6 shadow-xs space-y-4">
              <h2 className="font-serif text-lg font-medium text-wine-950 border-b border-wine-900/10 pb-2">
                Operating Schedule &amp; Closures (Lagos WAT)
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                    Opening Time (24h)
                  </label>
                  <input
                    type="time"
                    name="opening_time"
                    defaultValue={settings.opening_time}
                    required
                    className="mt-1 w-full rounded border border-wine-900/20 p-2 text-xs text-wine-950 focus:border-champagne-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                    Closing Time (24h)
                  </label>
                  <input
                    type="time"
                    name="closing_time"
                    defaultValue={settings.closing_time}
                    required
                    className="mt-1 w-full rounded border border-wine-900/20 p-2 text-xs text-wine-950 focus:border-champagne-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900 mb-2">
                  Operating Days
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  {[
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                  ].map((day) => (
                    <label
                      key={day}
                      className="flex items-center gap-1.5 rounded border border-wine-900/10 p-2 hover:bg-ivory-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        name="operating_days"
                        value={day}
                        defaultChecked={settings.operating_days.includes(day)}
                        className="rounded border-wine-900/30 text-champagne-600 focus:ring-champagne-500"
                      />
                      <span className="text-wine-900 font-medium">{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Temporary Closure Control */}
              <div className="rounded-lg border border-wine-900/15 bg-ivory-50/70 p-4 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-bold text-wine-950">
                    Temporary Closure / Kitchen Maintenance
                  </span>
                  <input
                    type="checkbox"
                    name="is_temporarily_closed"
                    value="true"
                    defaultChecked={settings.is_temporarily_closed}
                    className="size-4 rounded border-wine-900/30 text-red-600 focus:ring-red-500"
                  />
                </label>

                <div>
                  <label className="block text-[0.7rem] uppercase tracking-wider text-wine-700">
                    Customer Notice (Shown on checkout when closed)
                  </label>
                  <input
                    type="text"
                    name="temporary_closure_reason"
                    defaultValue={settings.temporary_closure_reason || ""}
                    placeholder="e.g. Kitchen deep clean today; reopening tomorrow at 10 AM."
                    className="mt-1 w-full rounded border border-wine-900/20 bg-white p-2 text-xs text-wine-950 focus:border-champagne-500 focus:outline-hidden"
                  />
                </div>

                <label className="flex items-center gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    name="allow_ordering_override"
                    value="true"
                    defaultChecked={settings.allow_ordering_override}
                    className="size-3.5 rounded border-wine-900/30 text-champagne-600"
                  />
                  <span className="text-[0.7rem] text-wine-900 font-medium">
                    Admin emergency override: Allow orders even when technically outside operating hours
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={settingsSaving}
              className="inline-flex items-center gap-2 rounded bg-wine-900 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-ivory-50 shadow-md hover:bg-wine-800 disabled:opacity-50"
            >
              <Save className="size-4" />
              {settingsSaving ? "Saving..." : "Save Business Settings"}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: DELTA STATE DELIVERY ZONES */}
      {activeTab === "zones" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg font-medium text-wine-950">
                Delta State Service Zones
              </h2>
              <p className="text-xs text-wine-800/80">
                Actual delivery zones configured for Asaba, Warri, and surrounding Delta State cities.
              </p>
            </div>

            <button
              onClick={() =>
                setEditingZone({
                  name: "",
                  city: "Asaba",
                  areas: [],
                  fee_kobo: 150000,
                  estimated_minutes_min: 30,
                  estimated_minutes_max: 50,
                  is_active: true,
                  display_order: zones.length + 1,
                })
              }
              className="inline-flex items-center gap-1.5 rounded bg-wine-900 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ivory-50 shadow-xs hover:bg-wine-800"
            >
              <Plus className="size-4" />
              New Delivery Zone
            </button>
          </div>

          {/* Zones Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {zones.map((zone) => (
              <div
                key={zone.id}
                className="flex flex-col justify-between rounded-xl border border-wine-900/10 bg-white p-5 shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-base font-bold text-wine-950">
                      {zone.name}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase ${
                        zone.is_active
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {zone.is_active ? "Active" : "Disabled"}
                    </span>
                  </div>

                  <p className="mt-1 text-xs font-semibold text-champagne-700">
                    {zone.city}, {zone.state}
                  </p>

                  <div className="mt-3">
                    <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-wine-700">
                      Delivery Fee
                    </span>
                    <p className="text-sm font-bold text-wine-950 font-mono">
                      ₦{(zone.fee_kobo / 100).toLocaleString()}
                    </p>
                  </div>

                  <div className="mt-2 text-[0.7rem] text-wine-800">
                    Est. Transit: {zone.estimated_minutes_min}–{zone.estimated_minutes_max} Mins
                  </div>

                  {/* Areas Badge Cloud */}
                  <div className="mt-3">
                    <span className="text-[0.65rem] font-semibold uppercase text-wine-700">
                      Covered Areas ({zone.areas.length})
                    </span>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {zone.areas.map((area, i) => (
                        <span
                          key={i}
                          className="rounded bg-ivory-100 px-1.5 py-0.5 text-[0.65rem] font-medium text-wine-900 border border-wine-900/10"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2 border-t border-wine-900/10 pt-3">
                  <button
                    onClick={() => handleDeleteZone(zone.id)}
                    className="p-1 text-wine-600 hover:text-red-700"
                    title="Delete Zone"
                  >
                    <Trash2 className="size-4" />
                  </button>
                  <button
                    onClick={() => setEditingZone(zone)}
                    className="rounded border border-wine-900/20 px-3 py-1 text-xs font-semibold text-wine-900 hover:bg-ivory-100"
                  >
                    Edit Zone
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Modal: Edit or Create Zone */}
          {editingZone && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
              <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
                <h3 className="font-serif text-lg font-semibold text-wine-950">
                  {editingZone.id ? "Edit Delivery Zone" : "New Delta State Delivery Zone"}
                </h3>

                <form onSubmit={handleSaveZone} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-wine-900">Zone Name</label>
                    <input
                      type="text"
                      value={editingZone.name || ""}
                      onChange={(e) => setEditingZone({ ...editingZone, name: e.target.value })}
                      required
                      placeholder="e.g. Asaba Core & GRA"
                      className="mt-1 w-full rounded border border-wine-900/20 p-2 text-xs focus:border-champagne-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-wine-900">City / Town</label>
                      <input
                        type="text"
                        value={editingZone.city || "Asaba"}
                        onChange={(e) => setEditingZone({ ...editingZone, city: e.target.value })}
                        required
                        placeholder="Asaba / Warri / Sapele"
                        className="mt-1 w-full rounded border border-wine-900/20 p-2 text-xs focus:border-champagne-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-wine-900">
                        Delivery Fee (NGN ₦)
                      </label>
                      <input
                        type="number"
                        value={editingZone.fee_kobo ? editingZone.fee_kobo / 100 : 0}
                        onChange={(e) =>
                          setEditingZone({
                            ...editingZone,
                            fee_kobo: Math.round(Number(e.target.value) * 100),
                          })
                        }
                        required
                        min={0}
                        step={100}
                        className="mt-1 w-full rounded border border-wine-900/20 p-2 text-xs font-mono focus:border-champagne-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-wine-900">
                      Covered Areas &amp; Landmarks (Comma-separated)
                    </label>
                    <textarea
                      value={(editingZone.areas || []).join(", ")}
                      onChange={(e) =>
                        setEditingZone({
                          ...editingZone,
                          areas: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                        })
                      }
                      rows={3}
                      placeholder="e.g. GRA Phase 1, Nnebisi Road, Okpanam Road, Summit Road"
                      className="mt-1 w-full rounded border border-wine-900/20 p-2 text-xs focus:border-champagne-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-wine-900">
                        Min Delivery Time (Mins)
                      </label>
                      <input
                        type="number"
                        value={editingZone.estimated_minutes_min || 25}
                        onChange={(e) =>
                          setEditingZone({
                            ...editingZone,
                            estimated_minutes_min: parseInt(e.target.value, 10),
                          })
                        }
                        className="mt-1 w-full rounded border border-wine-900/20 p-2 text-xs focus:border-champagne-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-wine-900">
                        Max Delivery Time (Mins)
                      </label>
                      <input
                        type="number"
                        value={editingZone.estimated_minutes_max || 50}
                        onChange={(e) =>
                          setEditingZone({
                            ...editingZone,
                            estimated_minutes_max: parseInt(e.target.value, 10),
                          })
                        }
                        className="mt-1 w-full rounded border border-wine-900/20 p-2 text-xs focus:border-champagne-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-wine-900/10 pt-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingZone.is_active ?? true}
                        onChange={(e) =>
                          setEditingZone({ ...editingZone, is_active: e.target.checked })
                        }
                        className="size-4 rounded text-champagne-600"
                      />
                      <span className="text-xs font-medium text-wine-950">Active Service Zone</span>
                    </label>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingZone(null)}
                        className="rounded border border-wine-900/20 px-4 py-2 text-xs font-medium text-wine-900"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={zoneSaving}
                        className="rounded bg-wine-900 px-4 py-2 text-xs font-semibold text-ivory-50 hover:bg-wine-800 disabled:opacity-50"
                      >
                        {zoneSaving ? "Saving..." : "Save Zone"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PICKUP & PREPARATION SETTINGS */}
      {activeTab === "pickup" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="rounded-xl border border-wine-900/10 bg-white p-6 shadow-xs space-y-4 max-w-2xl">
            <h2 className="font-serif text-lg font-medium text-wine-950 border-b border-wine-900/10 pb-2">
              Customer Pickup &amp; Kitchen Preparation
            </h2>

            <div className="flex items-center justify-between rounded-lg border border-wine-900/10 p-4 bg-ivory-50/50">
              <div>
                <p className="text-xs font-bold text-wine-950">Enable Customer Pickup</p>
                <p className="text-[0.7rem] text-wine-800/80">
                  Allow customers to collect orders at the Delta State studio with zero delivery fees.
                </p>
              </div>
              <input
                type="checkbox"
                name="pickup_enabled"
                value="true"
                defaultChecked={settings.pickup_enabled}
                className="size-4 rounded border-wine-900/30 text-champagne-600 focus:ring-champagne-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                Pickup Collection Address
              </label>
              <input
                type="text"
                name="pickup_address"
                defaultValue={settings.pickup_address || ""}
                placeholder="Empress Delicacies Studio, Asaba, Delta State"
                className="mt-1 w-full rounded border border-wine-900/20 p-2 text-xs text-wine-950 focus:border-champagne-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                Pickup Instructions for Customer
              </label>
              <textarea
                name="pickup_instructions"
                defaultValue={settings.pickup_instructions || ""}
                rows={3}
                placeholder="Park at curbside bay; give order reference to the concierge."
                className="mt-1 w-full rounded border border-wine-900/20 p-2 text-xs text-wine-950 focus:border-champagne-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                Estimated Preparation Time (Minutes)
              </label>
              <input
                type="number"
                name="estimated_preparation_minutes"
                defaultValue={settings.estimated_preparation_minutes}
                required
                min={10}
                max={180}
                className="mt-1 w-full rounded border border-wine-900/20 p-2 text-xs text-wine-950 focus:border-champagne-500 focus:outline-hidden"
              />
            </div>

            {/* Hidden fields required to preserve business values */}
            <input type="hidden" name="business_name" value={settings.business_name} />
            <input type="hidden" name="phone" value={settings.phone} />
            <input type="hidden" name="email" value={settings.email} />
            <input type="hidden" name="address" value={settings.address} />
            <input type="hidden" name="city" value={settings.city} />
            <input type="hidden" name="opening_time" value={settings.opening_time} />
            <input type="hidden" name="closing_time" value={settings.closing_time} />
            <input type="hidden" name="delivery_enabled" value={String(settings.delivery_enabled)} />

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={settingsSaving}
                className="rounded bg-wine-900 px-5 py-2 text-xs font-semibold text-ivory-50 hover:bg-wine-800 disabled:opacity-50"
              >
                {settingsSaving ? "Saving..." : "Save Pickup Configuration"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 4: HOMEPAGE CMS */}
      {activeTab === "cms" && (
        <form onSubmit={handleSaveCMS} className="space-y-6">
          {cmsFeedback && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-medium text-emerald-800">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{cmsFeedback}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Hero Section CMS */}
            <div className="rounded-xl border border-wine-900/10 bg-white p-6 shadow-xs space-y-4">
              <h2 className="font-serif text-lg font-medium text-wine-950 border-b border-wine-900/10 pb-2">
                Hero Section
              </h2>

              <div>
                <label className="block text-xs font-semibold text-wine-900">Hero Eyebrow</label>
                <input
                  type="text"
                  value={cms.hero_eyebrow}
                  onChange={(e) => setCms({ ...cms, hero_eyebrow: e.target.value })}
                  className="mt-1 w-full rounded border border-wine-900/20 p-2 text-xs focus:border-champagne-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-wine-900">
                    Title Line 1
                  </label>
                  <input
                    type="text"
                    value={cms.hero_title_line1}
                    onChange={(e) => setCms({ ...cms, hero_title_line1: e.target.value })}
                    className="mt-1 w-full rounded border border-wine-900/20 p-2 text-xs focus:border-champagne-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-wine-900">
                    Title Line 2
                  </label>
                  <input
                    type="text"
                    value={cms.hero_title_line2}
                    onChange={(e) => setCms({ ...cms, hero_title_line2: e.target.value })}
                    className="mt-1 w-full rounded border border-wine-900/20 p-2 text-xs focus:border-champagne-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-wine-900">Hero Description</label>
                <textarea
                  value={cms.hero_description}
                  onChange={(e) => setCms({ ...cms, hero_description: e.target.value })}
                  rows={3}
                  className="mt-1 w-full rounded border border-wine-900/20 p-2 text-xs focus:border-champagne-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-wine-900">CTA Button Text</label>
                  <input
                    type="text"
                    value={cms.hero_cta_text}
                    onChange={(e) => setCms({ ...cms, hero_cta_text: e.target.value })}
                    className="mt-1 w-full rounded border border-wine-900/20 p-2 text-xs focus:border-champagne-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-wine-900">CTA Destination URL</label>
                  <input
                    type="text"
                    value={cms.hero_cta_destination}
                    onChange={(e) => setCms({ ...cms, hero_cta_destination: e.target.value })}
                    className="mt-1 w-full rounded border border-wine-900/20 p-2 text-xs focus:border-champagne-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Brand Story CMS */}
            <div className="rounded-xl border border-wine-900/10 bg-white p-6 shadow-xs space-y-4">
              <h2 className="font-serif text-lg font-medium text-wine-950 border-b border-wine-900/10 pb-2">
                Brand Story &amp; Footer
              </h2>

              <div>
                <label className="block text-xs font-semibold text-wine-900">Story Heading</label>
                <input
                  type="text"
                  value={cms.story_heading}
                  onChange={(e) => setCms({ ...cms, story_heading: e.target.value })}
                  className="mt-1 w-full rounded border border-wine-900/20 p-2 text-xs focus:border-champagne-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-wine-900">
                  Featured Quote
                </label>
                <input
                  type="text"
                  value={cms.story_quote}
                  onChange={(e) => setCms({ ...cms, story_quote: e.target.value })}
                  className="mt-1 w-full rounded border border-wine-900/20 p-2 text-xs focus:border-champagne-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-wine-900">Footer Tagline</label>
                <input
                  type="text"
                  value={cms.footer_tagline}
                  onChange={(e) => setCms({ ...cms, footer_tagline: e.target.value })}
                  className="mt-1 w-full rounded border border-wine-900/20 p-2 text-xs focus:border-champagne-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-wine-900">
                  Footer Description
                </label>
                <textarea
                  value={cms.footer_description}
                  onChange={(e) => setCms({ ...cms, footer_description: e.target.value })}
                  rows={2}
                  className="mt-1 w-full rounded border border-wine-900/20 p-2 text-xs focus:border-champagne-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={cmsSaving}
              className="inline-flex items-center gap-2 rounded bg-wine-900 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-ivory-50 shadow-md hover:bg-wine-800 disabled:opacity-50"
            >
              <Save className="size-4" />
              {cmsSaving ? "Saving..." : "Publish Homepage Content"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
