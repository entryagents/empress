export type AnalyticsDateRangePreset =
  | "today"
  | "yesterday"
  | "last_7_days"
  | "last_30_days"
  | "this_month"
  | "last_month"
  | "custom";

export interface AnalyticsFilterParams {
  preset: AnalyticsDateRangePreset;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

export interface AnalyticsOverviewMetrics {
  totalOrders: number;
  ordersReceivedToday: number;
  ordersReceivedThisWeek: number;
  ordersReceivedThisMonth: number;
  paidOrdersCount: number;
  pendingPaymentsCount: number;
  failedPaymentsCount: number;
  cancelledOrdersCount: number;
  completedDeliveriesCount: number;
  activeDeliveriesCount: number;
  totalVerifiedRevenueKobo: number;
  grossOrderValueKobo: number;
  refundsKobo: number;
  netRevenueKobo: number;
  averageOrderValueKobo: number;
  paymentSuccessRatePct: number;
}

export interface DailyRevenueDataPoint {
  date: string; // YYYY-MM-DD
  label: string; // e.g. "Mon 16"
  revenueKobo: number;
  orderCount: number;
}

export interface FulfillmentRevenueBreakdown {
  deliveryRevenueKobo: number;
  deliveryOrdersCount: number;
  pickupRevenueKobo: number;
  pickupOrdersCount: number;
}

export interface ZoneRevenueBreakdown {
  zoneName: string;
  orderCount: number;
  revenueKobo: number;
  deliveryFeesKobo: number;
}

export interface ProductPerformanceMetric {
  productId: string;
  productName: string;
  categoryName: string;
  unitsSold: number;
  totalRevenueKobo: number;
  averagePriceKobo: number;
  orderAppearances: number;
}

export interface CustomerAnalyticsSummary {
  totalCustomers: number;
  registeredCustomers: number;
  guestCustomers: number;
  newCustomersPeriod: number;
  returningCustomersPeriod: number;
  repeatOrderRatePct: number;
  averageOrdersPerCustomer: number;
  topCustomers: {
    customerName: string;
    email: string;
    phone: string;
    isRegistered: boolean;
    ordersCount: number;
    totalSpentKobo: number;
    lastOrderDate: string;
  }[];
}

export interface DeliveryAnalyticsSummary {
  totalDeliveries: number;
  completedDeliveries: number;
  cancelledDeliveries: number;
  activeDeliveries: number;
  averageDeliveryMinutes: number | null;
  ordersAwaitingAssignment: number;
  driverPerformance: {
    driverId: string;
    driverName: string;
    vehicleType: string;
    completedTrips: number;
    activeTrips: number;
    failedTrips: number;
  }[];
  zonePerformance: {
    zoneName: string;
    totalTrips: number;
    completedTrips: number;
  }[];
}

export interface FullAnalyticsReport {
  period: {
    preset: AnalyticsDateRangePreset;
    startDate: string;
    endDate: string;
    timezone: string; // "Africa/Lagos"
  };
  overview: AnalyticsOverviewMetrics;
  revenueTrend: DailyRevenueDataPoint[];
  fulfillmentBreakdown: FulfillmentRevenueBreakdown;
  zoneBreakdown: ZoneRevenueBreakdown[];
  productPerformance: ProductPerformanceMetric[];
  customerAnalytics: CustomerAnalyticsSummary;
  deliveryAnalytics: DeliveryAnalyticsSummary;
}
