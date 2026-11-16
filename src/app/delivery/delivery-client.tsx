"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Navigation,
  MapPin,
  Phone,
  AlertCircle,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Radio,
  FileText,
} from "lucide-react";
import type { DeliveryAssignment, DeliveryPersonnel } from "@/types/delivery";
import type { Order } from "@/types/order";
import {
  driverAcceptAssignmentAction,
  driverRejectAssignmentAction,
  driverStartDeliveryAction,
  driverCompleteDeliveryAction,
  driverReportProblemAction,
  submitDriverLocationAction,
} from "@/app/admin/deliveries/actions";

interface DriverDashboardClientProps {
  initialDriver: DeliveryPersonnel;
  initialAssignments: (DeliveryAssignment & { order?: Order })[];
}

export function DriverDashboardClient({
  initialDriver,
  initialAssignments,
}: DriverDashboardClientProps) {
  const [driver] = useState<DeliveryPersonnel>(initialDriver);
  const [assignments, setAssignments] = useState(initialAssignments);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Active tracking state
  const [activeTrackingAssignmentId, setActiveTrackingAssignmentId] = useState<string | null>(() => {
    const inTransit = initialAssignments.find((a) => a.status === "in_transit");
    return inTransit ? inTransit.id : null;
  });

  const [gpsStatus, setGpsStatus] = useState<"idle" | "requesting" | "tracking" | "denied" | "unsupported">("idle");
  const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number; time: string } | null>(null);
  const [problemModal, setProblemModal] = useState<{ assignmentId: string; orderRef: string } | null>(null);
  const [problemReason, setProblemReason] = useState("");
  const watchIdRef = useRef<number | null>(null);

  // Stop GPS watch helper
  const stopGpsWatch = () => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setGpsStatus("idle");
  };

  // Start foreground GPS watch
  const startGpsWatch = (orderReference: string) => {
    if (!navigator.geolocation) {
      setGpsStatus("unsupported");
      return;
    }

    setGpsStatus("requesting");

    const onPos = async (pos: GeolocationPosition) => {
      setGpsStatus("tracking");
      const { latitude, longitude, heading, speed, accuracy } = pos.coords;
      const timeStr = new Date(pos.timestamp).toLocaleTimeString();
      setLastCoords({ lat: latitude, lng: longitude, time: timeStr });

      // Ingest coordinates to server
      await submitDriverLocationAction({
        orderReference,
        driverId: driver.id,
        latitude,
        longitude,
        heading: heading || undefined,
        speedMps: speed || undefined,
        accuracyMeters: accuracy,
        isSimulated: false,
      });
    };

    const onErr = (err: GeolocationPositionError) => {
      console.warn("GPS watch error:", err.message);
      if (err.code === err.PERMISSION_DENIED) {
        setGpsStatus("denied");
      }
    };

    watchIdRef.current = navigator.geolocation.watchPosition(onPos, onErr, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 15000,
    });
  };

  // Automatically terminate GPS if no assignment is in transit
  useEffect(() => {
    const hasTransit = assignments.some((a) => a.status === "in_transit");
    if (!hasTransit && watchIdRef.current !== null) {
      stopGpsWatch();
      setActiveTrackingAssignmentId(null);
    }

    return () => {
      stopGpsWatch();
    };
  }, [assignments]);

  // Handle Driver Action Workflows
  const handleAccept = async (assignmentId: string) => {
    setActionLoadingId(assignmentId);
    const res = await driverAcceptAssignmentAction(assignmentId, driver.id);
    setActionLoadingId(null);
    if (res.success) {
      setAssignments(
        assignments.map((a) => (a.id === assignmentId ? { ...a, status: "accepted" } : a))
      );
    }
  };

  const handleReject = async (assignmentId: string) => {
    const reason = prompt("Please provide a reason for rejecting this assignment:");
    if (!reason || reason.trim().length < 5) {
      alert("A valid rejection reason (minimum 5 characters) is required.");
      return;
    }
    setActionLoadingId(assignmentId);
    const res = await driverRejectAssignmentAction(assignmentId, driver.id, reason);
    setActionLoadingId(null);
    if (res.success) {
      setAssignments(assignments.filter((a) => a.id !== assignmentId));
    }
  };

  const handleStartDelivery = async (assignment: DeliveryAssignment) => {
    setActionLoadingId(assignment.id);
    const res = await driverStartDeliveryAction(assignment.id, driver.id);
    setActionLoadingId(null);
    if (res.success) {
      setAssignments(
        assignments.map((a) => (a.id === assignment.id ? { ...a, status: "in_transit" } : a))
      );
      setActiveTrackingAssignmentId(assignment.id);
      startGpsWatch(assignment.order_reference);
    } else {
      alert(res.error || "Could not start delivery trip.");
    }
  };

  const handleCompleteDelivery = async (assignmentId: string) => {
    setActionLoadingId(assignmentId);
    const res = await driverCompleteDeliveryAction(assignmentId, driver.id);
    setActionLoadingId(null);
    if (res.success) {
      stopGpsWatch();
      setActiveTrackingAssignmentId(null);
      setAssignments(
        assignments.map((a) => (a.id === assignmentId ? { ...a, status: "delivered" } : a))
      );
    }
  };

  const handleReportProblem = async () => {
    if (!problemModal || problemReason.trim().length < 5) return;
    setActionLoadingId(problemModal.assignmentId);
    const res = await driverReportProblemAction(problemModal.assignmentId, driver.id, problemReason);
    setActionLoadingId(null);
    if (res.success) {
      stopGpsWatch();
      setActiveTrackingAssignmentId(null);
      setAssignments(
        assignments.map((a) =>
          a.id === problemModal.assignmentId
            ? { ...a, status: "failed", failure_reason: problemReason }
            : a
        )
      );
      setProblemModal(null);
      setProblemReason("");
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-20">
      {/* Driver Status Card */}
      <div className="rounded-xl border border-wine-900/10 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-champagne-600">
              Courier Console
            </span>
            <h1 className="font-serif text-xl font-bold text-wine-950">{driver.full_name}</h1>
            <p className="text-xs text-wine-800/80">
              {driver.vehicle_type.toUpperCase()} {driver.vehicle_plate_number ? `(${driver.vehicle_plate_number})` : ""}
            </p>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            Online
          </div>
        </div>

        {/* Foreground GPS Telemetry Bar */}
        <div className="mt-4 rounded-lg bg-wine-950 p-3 text-ivory-50">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Radio
                className={`size-4 ${
                  gpsStatus === "tracking"
                    ? "text-emerald-400 animate-pulse"
                    : gpsStatus === "denied"
                    ? "text-red-400"
                    : "text-ivory-400"
                }`}
              />
              <span className="font-medium">
                {gpsStatus === "tracking"
                  ? "Live Foreground GPS Active"
                  : gpsStatus === "requesting"
                  ? "Requesting GPS Permission..."
                  : gpsStatus === "denied"
                  ? "Location Permission Denied"
                  : "GPS Idle (Only active during delivery)"}
              </span>
            </div>

            {lastCoords && (
              <span className="font-mono text-[0.7rem] text-champagne-300">
                {lastCoords.lat.toFixed(4)}, {lastCoords.lng.toFixed(4)}
              </span>
            )}
          </div>

          <p className="mt-1 text-[0.65rem] text-ivory-400">
            Note: Foreground browser tracking requires keeping this browser tab open during transit.
          </p>
        </div>
      </div>

      {/* Assignments Feed */}
      <div className="space-y-4">
        <h2 className="font-serif text-lg font-semibold text-wine-950">
          Assigned Deliveries ({assignments.length})
        </h2>

        {assignments.length === 0 ? (
          <div className="rounded-xl border border-wine-900/10 bg-white p-8 text-center text-xs text-wine-800/70">
            No deliveries currently assigned to you. Stand by for kitchen dispatch.
          </div>
        ) : (
          assignments.map((item) => {
            const ord = item.order;
            const isTransit = item.status === "in_transit";
            const isAssigned = item.status === "assigned";
            const isAccepted = item.status === "accepted";

            return (
              <div
                key={item.id}
                className={`overflow-hidden rounded-xl border bg-white shadow-xs transition ${
                  isTransit
                    ? "border-champagne-500 ring-2 ring-champagne-400/20"
                    : "border-wine-900/10"
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-wine-900/10 bg-ivory-50/60 px-4 py-3">
                  <div>
                    <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-wine-700">
                      Order Reference
                    </span>
                    <p className="font-mono text-sm font-bold text-wine-950">
                      #{item.order_reference}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider ${
                      isTransit
                        ? "bg-amber-100 text-amber-900 animate-pulse"
                        : isAccepted
                        ? "bg-blue-100 text-blue-900"
                        : isAssigned
                        ? "bg-champagne-200 text-wine-950"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {item.status.replace("_", " ")}
                  </span>
                </div>

                {/* Body: Destination & Contact */}
                <div className="p-4 space-y-3">
                  {ord && (
                    <>
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-wine-950">
                          <MapPin className="size-3.5 text-champagne-600" />
                          <span>Delivery Destination</span>
                        </div>
                        <p className="mt-1 text-xs text-wine-900 pl-5">
                          {ord.delivery_building_number ? `${ord.delivery_building_number}, ` : ""}
                          {ord.delivery_street_address}
                        </p>
                        <p className="text-[0.7rem] text-wine-700/80 pl-5">
                          {ord.delivery_area}, {ord.delivery_city}, {ord.delivery_state}
                        </p>
                        {ord.delivery_landmark && (
                          <p className="text-[0.7rem] italic text-champagne-700 pl-5">
                            Landmark: &ldquo;{ord.delivery_landmark}&rdquo;
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-wine-900/10 pt-3">
                        <div>
                          <p className="text-xs font-semibold text-wine-950">
                            Recipient: {ord.customer_name}
                          </p>
                          <a
                            href={`tel:${ord.customer_phone}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-wine-800 hover:text-champagne-600"
                          >
                            <Phone className="size-3" />
                            <span>{ord.customer_phone}</span>
                          </a>
                        </div>

                        {ord.delivery_instructions && (
                          <div className="text-right max-w-xs">
                            <span className="text-[0.65rem] font-semibold uppercase text-wine-700">
                              Instruction
                            </span>
                            <p className="text-[0.7rem] text-wine-900 truncate">
                              {ord.delivery_instructions}
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Actions Bar */}
                  <div className="border-t border-wine-900/10 pt-3 flex flex-wrap gap-2 justify-end">
                    {isAssigned && (
                      <>
                        <button
                          onClick={() => handleReject(item.id)}
                          disabled={actionLoadingId === item.id}
                          className="rounded border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleAccept(item.id)}
                          disabled={actionLoadingId === item.id}
                          className="rounded bg-wine-900 px-4 py-1.5 text-xs font-semibold text-ivory-50 shadow-xs hover:bg-wine-800"
                        >
                          Accept Assignment
                        </button>
                      </>
                    )}

                    {isAccepted && (
                      <button
                        onClick={() => handleStartDelivery(item)}
                        disabled={actionLoadingId === item.id}
                        className="inline-flex items-center gap-1.5 rounded bg-emerald-700 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ivory-50 shadow-md hover:bg-emerald-600"
                      >
                        <Play className="size-3.5 fill-current" />
                        Start Delivery Trip
                      </button>
                    )}

                    {isTransit && (
                      <div className="flex w-full items-center justify-between gap-2">
                        <button
                          onClick={() =>
                            setProblemModal({
                              assignmentId: item.id,
                              orderRef: item.order_reference,
                            })
                          }
                          className="inline-flex items-center gap-1 rounded border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-50"
                        >
                          <AlertCircle className="size-3.5" />
                          Report Issue
                        </button>

                        <button
                          onClick={() => handleCompleteDelivery(item.id)}
                          disabled={actionLoadingId === item.id}
                          className="inline-flex items-center gap-1.5 rounded bg-wine-900 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ivory-50 shadow-md hover:bg-wine-800"
                        >
                          <CheckCircle className="size-3.5" />
                          Mark Delivered
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Problem Modal */}
      {problemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl">
            <h3 className="font-serif text-base font-semibold text-wine-950">
              Report Delivery Issue (#{problemModal.orderRef})
            </h3>
            <p className="mt-1 text-xs text-wine-800/80">
              Provide detail regarding recipient unreachable, vehicle breakdown, or traffic block.
            </p>

            <textarea
              value={problemReason}
              onChange={(e) => setProblemReason(e.target.value)}
              placeholder="e.g. Recipient phone switched off at gate; waiting 10 minutes..."
              rows={3}
              className="mt-3 w-full rounded border border-wine-900/20 p-2 text-xs focus:border-champagne-500 focus:outline-hidden"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setProblemModal(null)}
                className="rounded border border-wine-900/20 px-3 py-1.5 text-xs font-medium text-wine-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReportProblem}
                disabled={problemReason.trim().length < 5 || actionLoadingId === problemModal.assignmentId}
                className="rounded bg-red-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-800 disabled:opacity-50"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
