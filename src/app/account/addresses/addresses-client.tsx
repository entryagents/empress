"use client";

import { useState } from "react";
import { MapPin, Plus, Trash2, Edit3, CheckCircle2, AlertCircle, Home, Building } from "lucide-react";
import type { CustomerAddress } from "@/types/customer";
import { saveAddressAction, deleteAddressAction } from "../../auth/actions";

interface Props {
  initialAddresses: CustomerAddress[];
}

export function AddressesClient({ initialAddresses }: Props) {
  const [addresses, setAddresses] = useState<CustomerAddress[]>(initialAddresses);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [label, setLabel] = useState("Home");
  const [area, setArea] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [buildingNumber, setBuildingNumber] = useState("");
  const [landmark, setLandmark] = useState("");
  const [instructions, setInstructions] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setLabel("Home");
    setArea("");
    setStreetAddress("");
    setBuildingNumber("");
    setLandmark("");
    setInstructions("");
    setIsDefault(false);
    setShowForm(false);
  };

  const handleEdit = (addr: CustomerAddress) => {
    setEditingId(addr.id);
    setLabel(addr.label);
    setArea(addr.area);
    setStreetAddress(addr.street_address);
    setBuildingNumber(addr.building_number || "");
    setLandmark(addr.landmark || "");
    setInstructions(addr.delivery_instructions || "");
    setIsDefault(addr.is_default);
    setShowForm(true);
  };

  const handleDelete = async (addrId: string) => {
    if (!confirm("Are you sure you want to remove this delivery address?")) return;

    setErrorMsg(null);
    try {
      const res = await deleteAddressAction(addrId);
      if (res.success) {
        setAddresses((prev) => prev.filter((a) => a.id !== addrId));
        setSuccessMsg("Address removed.");
      } else {
        setErrorMsg(res.error || "Failed to remove address.");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSaving(true);

    const formData = new FormData();
    if (editingId) formData.append("id", editingId);
    formData.append("label", label);
    formData.append("state", "Lagos");
    formData.append("city", "Lagos");
    formData.append("area", area);
    formData.append("street_address", streetAddress);
    formData.append("building_number", buildingNumber);
    formData.append("landmark", landmark);
    formData.append("delivery_instructions", instructions);
    formData.append("is_default", isDefault ? "true" : "false");

    try {
      const res = await saveAddressAction(formData);
      if (res.success) {
        setSuccessMsg(res.message || "Address saved successfully.");
        // Optimistic refresh
        const newAddressObj: CustomerAddress = {
          id: editingId || `addr-${Date.now()}`,
          customer_id: "",
          label,
          state: "Lagos",
          city: "Lagos",
          area,
          street_address: streetAddress,
          building_number: buildingNumber || null,
          landmark: landmark || null,
          delivery_instructions: instructions || null,
          is_default: isDefault,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (editingId) {
          setAddresses((prev) =>
            prev.map((a) => (a.id === editingId ? newAddressObj : isDefault ? { ...a, is_default: false } : a))
          );
        } else {
          setAddresses((prev) => [
            newAddressObj,
            ...(isDefault ? prev.map((a) => ({ ...a, is_default: false })) : prev),
          ]);
        }
        resetForm();
      } else {
        setErrorMsg(res.error || "Failed to save address.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[2px] border border-wine-900/10 bg-white p-6 shadow-soft sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-wine-900/10 pb-4">
          <div>
            <h2 className="font-serif text-xl font-medium text-wine-950">
              Saved Delivery Addresses
            </h2>
            <p className="mt-1 text-xs text-wine-800/80">
              Manage your residential and office delivery locations for instant one-tap checkout.
            </p>
          </div>

          {!showForm && (
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="inline-flex items-center gap-1.5 rounded bg-wine-900 px-4 py-2 text-xs font-semibold text-ivory-50 shadow-xs hover:bg-wine-800 transition-colors"
            >
              <Plus className="size-3.5 text-champagne-400" />
              Add Address
            </button>
          )}
        </div>

        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 flex items-center gap-2 rounded border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Address Entry / Edit Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded bg-ivory-50/70 p-5 border border-wine-900/15">
            <div className="flex items-center justify-between border-b border-wine-900/10 pb-2">
              <h3 className="font-serif text-sm font-semibold text-wine-950">
                {editingId ? "Edit Delivery Address" : "New Nigerian Address"}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-wine-600 hover:text-wine-950"
              >
                Cancel
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                  Label *
                </label>
                <input
                  type="text"
                  required
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Home, Office, Studio"
                  className="mt-1.5 w-full rounded border border-wine-900/20 bg-white px-3 py-1.5 text-xs text-wine-950 focus:border-champagne-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                  Area / Neighbourhood *
                </label>
                <input
                  type="text"
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Lekki Phase 1"
                  className="mt-1.5 w-full rounded border border-wine-900/20 bg-white px-3 py-1.5 text-xs text-wine-950 focus:border-champagne-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                  Building / Flat No.
                </label>
                <input
                  type="text"
                  value={buildingNumber}
                  onChange={(e) => setBuildingNumber(e.target.value)}
                  placeholder="e.g. Flat 3A, Block B"
                  className="mt-1.5 w-full rounded border border-wine-900/20 bg-white px-3 py-1.5 text-xs text-wine-950 focus:border-champagne-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                Street Address *
              </label>
              <input
                type="text"
                required
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="e.g. Admiralty Way, off Freedom Way"
                className="mt-1.5 w-full rounded border border-wine-900/20 bg-white px-3 py-1.5 text-xs text-wine-950 focus:border-champagne-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                Prominent Landmark (Essential for Nigerian Dispatch)
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Beside Zenith Bank, opposite Dominos"
                className="mt-1.5 w-full rounded border border-wine-900/20 bg-white px-3 py-1.5 text-xs text-wine-950 focus:border-champagne-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                Gate / Delivery Notes
              </label>
              <input
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Gate security code #402, call when outside"
                className="mt-1.5 w-full rounded border border-wine-900/20 bg-white px-3 py-1.5 text-xs text-wine-950 focus:border-champagne-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="is_default"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="size-3.5 rounded border-wine-900/30 text-wine-900"
              />
              <label htmlFor="is_default" className="text-xs font-medium text-wine-950">
                Set as default delivery address for future orders
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-wine-900/10">
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-wine-700 hover:text-wine-950"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded bg-wine-900 px-4 py-2 text-xs font-semibold text-ivory-50 hover:bg-wine-800 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : editingId ? "Update Address" : "Save Address"}
              </button>
            </div>
          </form>
        )}

        {/* Saved Addresses List */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {addresses.length === 0 ? (
            <div className="sm:col-span-2 py-8 text-center text-xs text-wine-600">
              No saved addresses found. Add an address above to expedite checkout.
            </div>
          ) : (
            addresses.map((addr) => (
              <div
                key={addr.id}
                className={`relative rounded border p-4 flex flex-col justify-between ${
                  addr.is_default
                    ? "border-champagne-500 bg-champagne-500/5 ring-1 ring-champagne-500"
                    : "border-wine-900/10 bg-ivory-50/40"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-semibold text-wine-950 text-sm flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-champagne-600" />
                      {addr.label}
                    </span>
                    {addr.is_default && (
                      <span className="rounded bg-champagne-500 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-wine-950">
                        Default
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-xs text-wine-900 leading-relaxed">
                    {addr.building_number ? `${addr.building_number}, ` : ""}
                    {addr.street_address}
                  </p>
                  <p className="text-[0.7rem] text-wine-700 font-medium">
                    {addr.area}, {addr.city}, {addr.state}
                  </p>
                  {addr.landmark && (
                    <p className="mt-1 text-[0.68rem] text-wine-600 italic">
                      Landmark: {addr.landmark}
                    </p>
                  )}
                  {addr.delivery_instructions && (
                    <p className="text-[0.68rem] text-wine-600">
                      Note: {addr.delivery_instructions}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-end gap-2 border-t border-wine-900/10 pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleEdit(addr)}
                    className="inline-flex items-center gap-1 text-wine-700 hover:text-wine-950"
                  >
                    <Edit3 className="size-3" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(addr.id)}
                    className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-800"
                  >
                    <Trash2 className="size-3" /> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
