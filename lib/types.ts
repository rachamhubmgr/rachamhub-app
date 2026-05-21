// User roles in RachamHub
export type UserRole =
  | 'customer_service'
  | 'warehouse'
  | 'fom1'
  | 'fom2'
  | 'fom3'
  | 'accounting'
  | 'admin';

export const ROLE_LABELS: Record<UserRole, string> = {
  customer_service: 'Customer Service',
  warehouse: 'Warehouse',
  fom1: 'FOM Level 1',
  fom2: 'FOM Level 2',
  fom3: 'FOM Level 3',
  accounting: 'Accounting',
  admin: 'Administrator',
};

// Firestore user document structure
export interface FirestoreUser {
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
export interface AuthUser extends FirestoreUser {
  isLoading: boolean;
  error: string | null;
}

// Order structure for Firestore
export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  extractedBy?: string; // UID of customer service rep who extracted
  notes?: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  weight?: number;
  dimensions?: string;
}

// AI Order Extraction Response from Gemini
export interface ExtractedOrder {
  customerId: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  notes?: string;
}

// Gemini API Response
export interface GeminiResponse {
  success: boolean;
  data?: ExtractedOrder;
  error?: string;
}
