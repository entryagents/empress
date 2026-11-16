import type { Order } from "./order";

export type UserRole = "customer" | "staff" | "admin";

export interface CustomerProfile {
  id: string; // matches auth.users UUID
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  label: string; // e.g. Home, Office, Beach House
  state: string;
  city: string;
  area: string;
  street_address: string;
  building_number?: string | null;
  landmark?: string | null;
  delivery_instructions?: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthSessionUser {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  role?: UserRole;
}
