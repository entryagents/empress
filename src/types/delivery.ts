export type DeliveryPersonStatus = "available" | "busy" | "offline" | "inactive";

export type DeliveryVehicleType = "motorcycle" | "bicycle" | "car" | "van";

export interface DeliveryPersonnel {
  id: string; // references auth.users (or internal driver ID)
  full_name: string;
  email: string;
  phone: string;
  vehicle_type: DeliveryVehicleType;
  vehicle_plate_number?: string | null;
  status: DeliveryPersonStatus;
  is_active: boolean;
  current_latitude?: number | null;
  current_longitude?: number | null;
  last_location_updated_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type DeliveryAssignmentStatus =
  | "assigned"
  | "accepted"
  | "rejected"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "failed"
  | "cancelled";

export interface DeliveryAssignment {
  id: string;
  order_id: string;
  order_reference: string;
  driver_id: string;
  status: DeliveryAssignmentStatus;
  assigned_by?: string | null;
  assigned_at: string;
  accepted_at?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
  picked_up_at?: string | null;
  delivered_at?: string | null;
  failed_at?: string | null;
  failure_reason?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  driver?: DeliveryPersonnel;
}

export interface DeliveryLocationUpdate {
  id: string;
  order_id: string;
  order_reference: string;
  driver_id: string;
  latitude: number;
  longitude: number;
  heading?: number | null;
  speed_mps?: number | null;
  accuracy_meters?: number | null;
  is_simulated?: boolean;
  recorded_at: string;
  created_at: string;
}

export interface PublicDeliveryTrackingInfo {
  order_reference: string;
  order_status: string;
  fulfillment_type: "delivery" | "pickup";
  recipient_name: string;
  delivery_address: {
    state?: string | null;
    city?: string | null;
    area?: string | null;
    street_address?: string | null;
    building_number?: string | null;
    landmark?: string | null;
    instructions?: string | null;
  };
  driver?: {
    first_name: string;
    vehicle_type?: DeliveryVehicleType;
    phone_masked?: string;
  } | null;
  location?: {
    latitude: number;
    longitude: number;
    heading?: number | null;
    accuracy_meters?: number | null;
    recorded_at: string;
    is_stale: boolean;
  } | null;
  estimated_arrival_minutes?: number | null;
  tracking_active: boolean;
  status_timeline: {
    status: string;
    label: string;
    timestamp?: string;
    completed: boolean;
    current: boolean;
  }[];
}
