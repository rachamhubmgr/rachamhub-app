// User roles in RachamHub
export type UserRole =
  | "customer_service"
  | "warehouse"
  | "fom"
  | "accounting"
  | "admin";

export const ROLE_LABELS: Record<UserRole, string> = {
  customer_service: "Customer Service",
  warehouse: "Warehouse",
  fom: "FOM",
  accounting: "Accounting",
  admin: "Administrator",
};

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

// Firestore user document structure
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  department?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

// User session/context type
export interface AuthUser extends UserProfile {
  isLoading: boolean;
  error: string | null;
}

// Order structure stored in Supabase
export interface Order {
  id: string;
  customer_name: string;
  delivery_address?: string | null;
  phone_numbers?: string[] | null;
  merchant?: string | null;
  cc_comment?: string | null;
  items: OrderItem[];
  total_amount: number;
  status: UserRole; // Reflects which department is currently handling the order
  delivery_status?: string | null;
  inventory_status?: string | null;
  warehouse_comment?: string | null;
  fom_assigned?: string | null;
  rider_name?: string | null;
  landmark?: string | null;
  price_with_rider?: number | null;
  payment_method?: string | null;
  payment_by_merchant?: number | null;
  payment_confirmed?: boolean | null;
  bank?: string | null;
  fom_comment?: string | null;
  extracted_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  weight?: number;
  dimensions?: string;
}

// AI Order Extraction Response from Gemini
export interface ExtractedOrder {
  customerName: string;
  deliveryAddress?: string | null;
  phoneNumbers?: string[] | null;
  merchant?: string | null;
  comment?: string | null;
  items: OrderItem[];
  totalAmount: number;
}

// Gemini API Response
export interface GeminiResponse {
  success: boolean;
  data?: ExtractedOrder;
  error?: string;
}
