export interface Trip {
  id: string;
  slug: string;
  name: string;
  description: string;
  duration_days: number;
  base_price: number;
  deposit_amount: number;
  payment_flow: "authorize" | "vault" | "invoice" | "instant";
  itinerary: ItineraryDay[];
  image_gradient: string;
  category: "tour" | "car_rental" | "cruise";
  daily_rate: number | null;
}

export interface ItineraryDay {
  day: number;
  title: string;
  details: string;
}
