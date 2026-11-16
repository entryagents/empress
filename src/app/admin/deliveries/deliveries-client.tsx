"use client";

import React, { useState } from "react";
import {
  Truck,
  UserCheck,
  Plus,
  Radio,
  CheckCircle2,
  Clock,
  Phone,
  Bike,
  Car,
  AlertTriangle,
} from "lucide-react";
import type { DeliveryPersonnel, DeliveryAssignment } from "@/types/delivery";
import type { Order } from "@/types/order";
import {
  createDeliveryPersonServerAction,
  updateDriverStatusServerAction,
  assignOrderToDriverServerAction,
} from "./actions";
import { LiveDeliveryMap } from "@/components/delivery/live-delivery-map";

interface AdminDeliveriesClientProps {
  initialPersonnel: DeliveryPersonnel[];
  activeDeliveries: {
    assignment: DeliveryAssignment;
    order: Order;
    driver: DeliveryPersonnel;
    latestLocation?: {
      latitude: number;
      longitude: number;
      recorded_at: string;
      heading?: number | null;
    };
  }[];
  unassignedOrders: Order[];
}

export function AdminDeliveriesClient({
  initialPersonnel,
  activeDeliveries,
  unassignedOrders,
}: AdminDeliveriesClientProps) {
  const [personnel, setPersonnel] = useState<DeliveryPersonnel[]>(initialPersonnel);
  const [deliveries] = useState(activeDeliveries);
  const [unassigned, setUnassigned] = useState<Order[]>(unassignedOrders);

  // New Driver Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Assignment Modal State
  const [assigningOrder, setAssigningOrder] = useState<Order | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // Active Map View
  const [focusedDelivery, setFocusedDelivery] = useState(deliveries[0] || null);

  const availableCount = personnel.filter((p) => p.status === "available" && p.is_active).length;
  const busyCount = personnel.filter((p) => p.status === "busy").length;

  const handleCreateDriver = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    const formData = new FormData(e.currentTarget);
    const res = await createDeliveryPersonServerAction(formData);

    setCreateLoading(false);
    if (!res.success) {
      setCreateError(res.error || "Failed to create driver.");
    } else if (res.driver) {
      setPersonnel([res.driver, ...personnel]);
      setShowCreateModal(false);
    }
  };

  const handleToggleDriverStatus = async (driver: DeliveryPersonnel) => {
    const nextStatus = driver.status === "available" ? "offline" : "available";
    const res = await updateDriverStatusServerAction(driver.id, nextStatus);
    if (res.success && res.driver) {
      setPersonnel(personnel.map((p) => (p.id === driver.id ? res.driver! : p)));
    }
  };

  const handleAssignOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningOrder || !selectedDriverId) return;

    setAssignLoading(true);
    setAssignError(null);

    const res = await assignOrderToDriverServerAction(
      assigningOrder.order_reference,
      selectedDriverId
    );

    setAssignLoading(false);
    if (!res.success) {
      setAssignError(res.error || "Assignment failed.");
    } else {
      // Remove from unassigned list
      setUnassigned(unassigned.filter((o) => o.id !== assigningOrder.id));
      setAssigningOrder(null);
      setSelectedDriverId("");
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & KPI Strip */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-light text-wine-950 sm:text-3xl">
            Delivery Fleet &amp; Dispatch Hub
          </h1>
          <p className="mt-1 text-xs text-wine-800/80">
            Real-time fleet dispatch, driver location radar, and live order assignment control.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 self-start rounded bg-wine-900 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ivory-50 shadow-sm transition hover:bg-wine-800"
        >
          <Plus className="size-4" />
          Add Courier
        </button>
      </div>

      {/* Fleet KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-wine-900/10 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-wine-700">
            <span>Active Deliveries</span>
            <Truck className="size-4 text-champagne-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-wine-950">{deliveries.length}</div>
        </div>

        <div className="rounded-xl border border-wine-900/10 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-emerald-700">
            <span>Available Couriers</span>
            <UserCheck className="size-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700">{availableCount}</div>
        </div>

        <div className="rounded-xl border border-wine-900/10 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-amber-700">
            <span>In Transit (Busy)</span>
            <Radio className="size-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-700">{busyCount}</div>
        </div>

        <div className="rounded-xl border border-wine-900/10 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-wine-700">
            <span>Awaiting Courier</span>
            <Clock className="size-4 text-wine-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-wine-900">{unassigned.length}</div>
        </div>
      </div>

      {/* Live Geospatial Dispatch Radar Section */}
      <div className="rounded-xl border border-wine-900/10 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-serif text-lg font-medium text-wine-950">
              Live Fleet Location Radar
            </h2>
            <p className="text-xs text-wine-800/70">
              Select an active delivery to center the live GPS coordinates.
            </p>
          </div>

          {deliveries.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {deliveries.map((del) => (
                <button
                  key={del.assignment.id}
                  onClick={() => setFocusedDelivery(del)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    focusedDelivery?.assignment.id === del.assignment.id
                      ? "bg-wine-900 text-ivory-50 shadow-xs"
                      : "bg-ivory-100 text-wine-900 hover:bg-ivory-200"
                  }`}
                >
                  #{del.order.order_reference} ({del.driver.full_name.split(" ")[0]})
                </button>
              ))}
            </div>
          )}
        </div>

        <LiveDeliveryMap
          driverLat={focusedDelivery?.latestLocation?.latitude ?? (focusedDelivery?.driver.current_latitude || 6.4312)}
          driverLng={focusedDelivery?.latestLocation?.longitude ?? (focusedDelivery?.driver.current_longitude || 3.4219)}
          destinationAddress={
            focusedDelivery
              ? `${focusedDelivery.order.delivery_street_address || ""}, ${focusedDelivery.order.delivery_area || ""}`
              : undefined
          }
          lastUpdated={focusedDelivery?.latestLocation?.recorded_at || focusedDelivery?.driver.last_location_updated_at}
          className="h-80"
        />
      </div>

      {/* Split Section: Unassigned Orders & Courier Fleet Roster */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Unassigned Orders Awaiting Dispatch */}
        <div className="rounded-xl border border-wine-900/10 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg font-medium text-wine-950">
                Orders Awaiting Dispatch ({unassigned.length})
              </h2>
              <p className="text-xs text-wine-800/70">
                Nigerian delivery orders ready for driver assignment.
              </p>
            </div>
          </div>

          {unassigned.length === 0 ? (
            <div className="py-12 text-center text-xs text-wine-700/60">
              All delivery orders currently have assigned couriers.
            </div>
          ) : (
            <div className="space-y-3">
              {unassigned.map((ord) => (
                <div
                  key={ord.id}
                  className="flex items-center justify-between rounded-lg border border-wine-900/10 bg-ivory-50/50 p-4 transition hover:border-wine-900/25"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-wine-950">
                        {ord.order_reference}
                      </span>
                      <span className="rounded bg-champagne-400/20 px-2 py-0.5 text-[0.65rem] font-semibold uppercase text-wine-900">
                        {ord.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-wine-900">
                      {ord.customer_name} &bull; {ord.delivery_area}, {ord.delivery_city}
                    </p>
                    <p className="text-[0.7rem] text-wine-700/70">{ord.delivery_street_address}</p>
                  </div>

                  <button
                    onClick={() => {
                      setAssigningOrder(ord);
                      setSelectedDriverId("");
                      setAssignError(null);
                    }}
                    className="rounded bg-wine-900 px-3 py-1.5 text-xs font-semibold text-ivory-50 shadow-xs hover:bg-wine-800"
                  >
                    Assign
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fleet Roster */}
        <div className="rounded-xl border border-wine-900/10 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg font-medium text-wine-950">
                Courier Fleet ({personnel.length})
              </h2>
              <p className="text-xs text-wine-800/70">
                Manage status, vehicle types, and real-time availability.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {personnel.map((driver) => (
              <div
                key={driver.id}
                className="flex items-center justify-between rounded-lg border border-wine-900/10 bg-ivory-50/50 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-champagne-100 text-wine-950">
                    {driver.vehicle_type === "motorcycle" ? (
                      <Bike className="size-4" />
                    ) : (
                      <Car className="size-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-wine-950">{driver.full_name}</p>
                    <div className="flex items-center gap-2 text-[0.7rem] text-wine-700/80">
                      <Phone className="size-3" />
                      <span>{driver.phone}</span>
                      {driver.vehicle_plate_number && (
                        <span>&bull; {driver.vehicle_plate_number}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase ${
                      driver.status === "available"
                        ? "bg-emerald-100 text-emerald-800"
                        : driver.status === "busy"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {driver.status}
                  </span>

                  <button
                    onClick={() => handleToggleDriverStatus(driver)}
                    className="rounded border border-wine-900/20 px-2.5 py-1 text-[0.7rem] font-medium text-wine-900 hover:bg-wine-100/50"
                  >
                    {driver.status === "available" ? "Go Offline" : "Go Available"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal: Create Courier */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="font-serif text-lg font-semibold text-wine-950">
              Register Delivery Personnel
            </h3>
            <p className="mt-1 text-xs text-wine-800/80">
              Create a dedicated delivery courier profile with vehicle details.
            </p>

            {createError && (
              <div className="mt-3 flex items-center gap-2 rounded bg-red-50 p-3 text-xs text-red-800">
                <AlertTriangle className="size-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateDriver} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-wine-900">Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  required
                  placeholder="e.g. Tunde Bakare"
                  className="mt-1 w-full rounded border border-wine-900/20 p-2 text-xs focus:border-champagne-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-wine-900">Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="courier@empress.ng"
                  className="mt-1 w-full rounded border border-wine-900/20 p-2 text-xs focus:border-champagne-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-wine-900">Phone Number (NG)</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="+2348012345678"
                  className="mt-1 w-full rounded border border-wine-900/20 p-2 text-xs focus:border-champagne-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-wine-900">Vehicle Type</label>
                  <select
                    name="vehicle_type"
                    defaultValue="motorcycle"
                    className="mt-1 w-full rounded border border-wine-900/20 p-2 text-xs focus:border-champagne-500 focus:outline-hidden"
                  >
                    <option value="motorcycle">Motorcycle</option>
                    <option value="car">Car</option>
                    <option value="van">Van</option>
                    <option value="bicycle">Bicycle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-wine-900">Plate Number</label>
                  <input
                    type="text"
                    name="vehicle_plate_number"
                    placeholder="LAG-123-XY"
                    className="mt-1 w-full rounded border border-wine-900/20 p-2 text-xs focus:border-champagne-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded border border-wine-900/20 px-4 py-2 text-xs font-medium text-wine-900 hover:bg-ivory-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="rounded bg-wine-900 px-4 py-2 text-xs font-semibold text-ivory-50 hover:bg-wine-800 disabled:opacity-50"
                >
                  {createLoading ? "Creating..." : "Save Courier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Order */}
      {assigningOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="font-serif text-lg font-semibold text-wine-950">
              Assign Order #{assigningOrder.order_reference}
            </h3>
            <p className="mt-1 text-xs text-wine-800/80">
              Destination: {assigningOrder.delivery_area}, {assigningOrder.delivery_city}
            </p>

            {assignError && (
              <div className="mt-3 flex items-center gap-2 rounded bg-red-50 p-3 text-xs text-red-800">
                <AlertTriangle className="size-4 shrink-0" />
                <span>{assignError}</span>
              </div>
            )}

            <form onSubmit={handleAssignOrder} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-wine-900 mb-1">
                  Select Available Courier
                </label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  required
                  className="w-full rounded border border-wine-900/20 p-2 text-xs focus:border-champagne-500 focus:outline-hidden"
                >
                  <option value="">-- Choose Courier --</option>
                  {personnel
                    .filter((p) => p.is_active)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} ({p.vehicle_type} - {p.status})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssigningOrder(null)}
                  className="rounded border border-wine-900/20 px-4 py-2 text-xs font-medium text-wine-900 hover:bg-ivory-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignLoading || !selectedDriverId}
                  className="rounded bg-wine-900 px-4 py-2 text-xs font-semibold text-ivory-50 hover:bg-wine-800 disabled:opacity-50"
                >
                  {assignLoading ? "Assigning..." : "Confirm Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
