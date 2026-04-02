export interface Booking {
  id: string;
  booking_reference: string;
  user_id: string;
  trip_id: string;
  status: string;
  payment_flow: string;
  total_amount: number;
  paid_amount: number;
  paypal_order_id: string | null;
  authorization_id: string | null;
  authorization_expires_at: string | null;
  vault_token_id: string | null;
  invoice_id: string | null;
  invoice_url: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  trip_name?: string;
  trip_slug?: string;
  image_gradient?: string;
  customer_name?: string;
  customer_email?: string;
}

export interface BookingCharge {
  id: string;
  booking_id: string;
  type: string;
  description: string;
  amount: number;
  paypal_capture_id: string | null;
  status: string;
  created_at: string;
}

export interface BookingDetail extends Booking {
  charges: BookingCharge[];
  base_price?: number;
  trip_deposit_amount?: number;
  duration_days?: number;
  trip_description?: string;
  trip_payment_flow?: string;
}
