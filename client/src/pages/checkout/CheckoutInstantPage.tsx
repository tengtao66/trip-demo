import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  PayPalButtons,
  PayPalMessages,
  usePayPalScriptReducer,
} from "@paypal/react-paypal-js";
import {
  Car,
  AlertCircle,
  CalendarDays,
  Fuel,
  Users,
  Luggage,
  Navigation,
  Wrench,
  CircleCheck,
  Infinity,
} from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";
import { usePayPalIntent } from "@/lib/use-paypal-intent";
import { tripImages } from "@/lib/constants";
import type { Trip } from "@/types/trip";

interface Props {
  trip: Trip;
}

/**
 * PayPalMessages wrapper that waits for the SDK to finish loading.
 * Must be rendered inside PayPalScriptProvider.
 */
function PayLaterMessages({ amount }: { amount: number }) {
  const [{ isResolved }] = usePayPalScriptReducer();
  if (!isResolved) return null;
  return (
    <PayPalMessages
      placement="payment"
      amount={amount}
      style={{
        layout: "text",
        logo: { type: "inline" },
        text: { color: "black", size: "12" },
      }}
    />
  );
}

export default function CheckoutInstantPage({ trip }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  usePayPalIntent("capture");

  const pickupDate: string | undefined = location.state?.pickupDate;
  const dropoffDate: string | undefined = location.state?.dropoffDate;

  // If dates are missing, show fallback
  if (!pickupDate || !dropoffDate) {
    return (
      <div className="max-w-5xl mx-auto text-center py-20 space-y-4">
        <Car className="h-12 w-12 text-muted-foreground mx-auto" />
        <p className="text-lg text-muted-foreground">
          No rental dates selected. Please go back and choose your pickup and
          drop-off dates.
        </p>
      </div>
    );
  }

  const pickup = new Date(pickupDate);
  const dropoff = new Date(dropoffDate);
  const rentalDays = Math.max(
    1,
    Math.ceil((dropoff.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24))
  );
  const dailyRate = trip.daily_rate ?? trip.base_price;
  const totalPrice = dailyRate * rentalDays;

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  async function handleCreateOrder() {
    setError(null);
    const res = await authFetch("/api/orders/create", {
      method: "POST",
      body: JSON.stringify({ slug: trip.slug, pickupDate, dropoffDate }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg =
        res.status === 403
          ? "Please switch to Customer role to complete checkout. Use the role switcher in the header."
          : data.error || "Failed to create order";
      setError(msg);
      throw new Error(msg);
    }
    const data = await res.json();
    return data.id;
  }

  async function handleApprove(data: { orderID: string }) {
    setError(null);
    const res = await authFetch(`/api/orders/${data.orderID}/capture`, {
      method: "POST",
    });
    if (!res.ok) {
      const errData = await res.json();
      setError(errData.error || "Capture failed");
      return;
    }
    const result = await res.json();
    navigate(`/bookings/${result.bookingReference}?confirmed=true`);
  }

  function handleError(err: Record<string, unknown>) {
    console.error("PayPal error:", err);
    // Don't overwrite a more specific error (e.g. 403 role message) with generic one
    setError((prev) =>
      prev || "Something went wrong with PayPal. Please try again."
    );
  }

  function handleCancel() {
    setError("Payment was cancelled. You can try again.");
  }

  return (
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Checkout</h1>
          <p className="text-muted-foreground mt-1">
            Complete your rental for {trip.name}
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Payment Error</p>
              <p className="text-sm text-destructive/80 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column: Order summary */}
          <div className="space-y-6">
            <div className="rounded-xl overflow-hidden border border-border">
              <div
                className="h-40 w-full bg-cover bg-center relative"
                style={
                  tripImages[trip.slug]
                    ? { backgroundImage: `url(${tripImages[trip.slug]})` }
                    : { background: trip.image_gradient }
                }
              >
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />
              </div>
              <div className="p-5 space-y-4">
                <h2 className="text-lg font-semibold text-foreground">
                  {trip.name}
                </h2>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    <span>
                      {formatDate(pickup)} &mdash; {formatDate(dropoff)}
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    {rentalDays} {rentalDays === 1 ? "day" : "days"} rental
                  </p>
                </div>

                <div className="h-px bg-border" />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      ${dailyRate.toLocaleString()} x {rentalDays}{" "}
                      {rentalDays === 1 ? "day" : "days"}
                    </span>
                    <span className="font-medium text-foreground">
                      ${totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle Specs */}
            <div className="rounded-xl border border-border p-5">
              <h3 className="font-semibold text-foreground mb-3">Vehicle Specifications</h3>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { icon: Car, value: "Auto", label: "Trans." },
                  { icon: Fuel, value: trip.slug === "suv-rental" ? "25 MPG" : trip.slug === "luxury-convertible" ? "20 MPG" : "35 MPG", label: "Economy" },
                  { icon: Users, value: trip.slug === "suv-rental" ? "7" : "5", label: "Seats" },
                  { icon: Luggage, value: trip.slug === "suv-rental" ? "4 Lrg" : trip.slug === "luxury-convertible" ? "1 Lrg" : "2 Lrg", label: "Bags" },
                ].map((spec) => (
                  <div key={spec.label} className="text-center py-2">
                    <spec.icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs font-semibold text-foreground">{spec.value}</p>
                    <p className="text-[10px] text-muted-foreground">{spec.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* What's Included */}
            <div className="rounded-xl border border-border p-5">
              <h3 className="font-semibold text-foreground mb-3">What's Included</h3>
              <div className="space-y-2">
                {[
                  { icon: Infinity, text: "Unlimited Mileage" },
                  { icon: Navigation, text: "GPS Navigation" },
                  { icon: Wrench, text: "Roadside Assistance (24/7)" },
                  { icon: CircleCheck, text: "Free Cancellation (24h before)" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <item.icon className="h-4 w-4 text-primary shrink-0" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column: Payment */}
          <div className="space-y-6">
            <div className="rounded-xl border border-border p-6 space-y-5">
              <h3 className="font-semibold text-foreground">Rental Summary</h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vehicle</span>
                  <span className="text-foreground font-medium">{trip.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pickup</span>
                  <span className="text-foreground">{formatDate(pickup)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Drop-off</span>
                  <span className="text-foreground">{formatDate(dropoff)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily rate</span>
                  <span className="text-foreground">${dailyRate}/day</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="text-foreground">
                    {rentalDays} {rentalDays === 1 ? "day" : "days"}
                  </span>
                </div>
              </div>

              <div className="h-px bg-border" />

              <div className="flex justify-between items-center">
                <span className="text-foreground font-semibold">Total</span>
                <span className="text-xl font-bold text-primary">
                  ${totalPrice.toLocaleString()}
                </span>
              </div>
            </div>

            {/* PayPal Buttons */}
            <fieldset className="rounded-xl border border-border p-6 space-y-4">
              <legend className="mx-auto px-3 text-sm font-semibold text-foreground">
                Pay securely with PayPal
              </legend>

              {/* Yellow PayPal button */}
              <PayPalButtons
                fundingSource="paypal"
                style={{ layout: "vertical", shape: "rect", label: "pay" }}
                createOrder={handleCreateOrder}
                onApprove={handleApprove}
                onError={handleError}
                onCancel={handleCancel}
              />

              {/* "or" divider */}
              <div className="relative flex items-center py-1">
                <div className="flex-1 border-t border-border" />
                <span className="px-3 text-xs text-muted-foreground">or</span>
                <div className="flex-1 border-t border-border" />
              </div>

              {/* Blue Pay Later button + message grouped tightly */}
              <div className="space-y-2">
                <PayPalButtons
                  fundingSource="paylater"
                  style={{ layout: "vertical", shape: "rect", label: "pay" }}
                  createOrder={handleCreateOrder}
                  onApprove={handleApprove}
                  onError={handleError}
                  onCancel={handleCancel}
                />
                {/* Official PayPal Pay Later messaging — centered under button */}
                <div className="text-center">
                  <PayLaterMessages amount={totalPrice} />
                </div>
              </div>

            </fieldset>
          </div>
        </div>
      </div>
  );
}
