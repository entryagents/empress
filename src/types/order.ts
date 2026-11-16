import type { Product, ProductVariant, ProductAddon } from "./catalogue";

export type FulfillmentType = "delivery" | "pickup";

export type OrderStatus =
  | "received"           // Placed by customer (awaiting payment or review)
  | "awaiting_payment"   // Explicit awaiting payment
  | "confirmed"          // Payment confirmed or accepted by kitchen
  | "preparing"          // Food in kitchen / culinary preparation
  | "ready"              // Ready for pickup or dispatch
  | "ready_for_pickup"   // Ready for customer pickup
  | "ready_for_dispatch" // Packaged for rider
  | "out_for_delivery"   // In transit with delivery driver
  | "dispatched"         // Dispatched
  | "delivered"          // Safely delivered to recipient
  | "collected"          // Collected by customer
  | "cancelled";         // Cancelled

export type PaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "failed"
  | "expired"
  | "underpaid"
  | "refund_pending"
  | "refunded";

export interface DeliveryZone {
  id: string;
  name: string;
  state: string;
  city: string;
  areas: string[];
  fee_kobo: number;
  estimated_minutes_min: number;
  estimated_minutes_max: number;
  is_active: boolean;
  display_order: number;
}

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number; // e.g. 10 for 10% or fixed amount in Naira
  discount_kobo?: number;
  min_order_kobo: number;
  max_discount_kobo?: number | null;
  usage_limit?: number | null;
  times_used: number;
  is_active: boolean;
  starts_at?: string | null;
  expires_at?: string | null;
}

export interface NigerianAddressInput {
  state: string;
  city: string;
  area: string;
  street_address: string;
  building_number?: string;
  landmark?: string;
  additional_instructions?: string;
}

export interface CustomerCheckoutInput {
  full_name: string;
  email: string;
  phone: string;
  fulfillment_type: FulfillmentType;
  address?: NigerianAddressInput;
  delivery_zone_id?: string;
  pickup_instructions?: string;
  special_instructions?: string;
  coupon_code?: string;
  idempotency_key?: string;
}

export interface CartItemInput {
  productId: string;
  variantId?: string;
  addonIds?: string[];
  quantity: number;
  specialInstructions?: string;
}

export interface ValidatedOrderItem {
  product: Product;
  variant?: ProductVariant;
  addons: ProductAddon[];
  quantity: number;
  basePriceKobo: number;
  variantAdjustmentKobo: number;
  addonsTotalKobo: number;
  unitPriceKobo: number;
  totalPriceKobo: number;
  specialInstructions?: string;
}

export interface PricingSummary {
  currency: string;
  subtotalKobo: number;
  deliveryFeeKobo: number;
  discountKobo: number;
  couponApplied?: Coupon;
  totalKobo: number;
}

export interface CartValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  items: ValidatedOrderItem[];
  pricing: PricingSummary;
  deliveryZone?: DeliveryZone;
}

export interface OrderItemSnapshot {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_sku: string | null;
  product_image_url: string;
  category_name: string;
  variant_id: string | null;
  variant_name: string | null;
  variant_price_adjustment_kobo: number;
  base_price_kobo: number;
  addons_total_kobo: number;
  unit_price_kobo: number;
  quantity: number;
  total_price_kobo: number;
  special_instructions?: string | null;
  addons?: {
    id: string;
    addon_id: string;
    addon_group_name: string;
    addon_name: string;
    price_kobo: number;
  }[];
}

export interface Order {
  id: string;
  order_reference: string;
  secure_access_token: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  user_id?: string | null;
  fulfillment_type: FulfillmentType;
  delivery_state?: string | null;
  delivery_city?: string | null;
  delivery_area?: string | null;
  delivery_street_address?: string | null;
  delivery_building_number?: string | null;
  delivery_landmark?: string | null;
  delivery_instructions?: string | null;
  delivery_zone_id?: string | null;
  pickup_location?: string | null;
  pickup_instructions?: string | null;
  currency: string;
  subtotal_kobo: number;
  delivery_fee_kobo: number;
  discount_kobo: number;
  coupon_code?: string | null;
  coupon_id?: string | null;
  total_kobo: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  bachs_checkout_id?: string | null;
  bachs_payment_id?: string | null;
  bachs_checkout_url?: string | null;
  payment_completed_at?: string | null;
  special_instructions?: string | null;
  admin_notes?: string | null;
  assigned_driver_id?: string | null;
  delivery_assigned_at?: string | null;
  assigned_driver?: {
    id: string;
    full_name: string;
    phone: string;
    vehicle_type: string;
    vehicle_plate_number?: string | null;
  } | null;
  cancellation_reason?: string | null;
  cancelled_at?: string | null;
  cancelled_by?: string | null;
  idempotency_key?: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItemSnapshot[];
  timeline?: OrderStatusHistoryEntry[];
}

export interface OrderStatusHistoryEntry {
  id: string;
  order_id: string;
  order_reference: string;
  from_status: string;
  to_status: string;
  changed_by_user_id?: string | null;
  changed_by_name?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface OrderAdminMetrics {
  ordersReceivedToday: number;
  pendingOrders: number;
  paidOrders: number;
  preparingOrders: number;
  outForDeliveryOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  verifiedRevenueKobo: number; // Strictly from orders where payment_status = 'paid'
}
