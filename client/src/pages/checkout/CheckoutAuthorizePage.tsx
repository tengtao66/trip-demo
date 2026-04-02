import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PayPalScriptProvider,
  PayPalButtons,
} from "@paypal/react-paypal-js";
import { Clock, AlertCircle, ShieldCheck } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";
import type { Trip } from "@/types/trip";

interface Props {
  trip: Trip;
}

export default function CheckoutAuthorizePage({ trip }: Props) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const balanceAmount = trip.base_price - trip.deposit_amount;

  return (
    <PayPalScriptProvider
      options={{
        clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
        intent: "authorize",
        currency: "USD",
      }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Checkout</h1>
          <p className="text-muted-foreground mt-1">
            Complete your booking for {trip.name}
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
          {/* Left column: Trip summary */}
          <div className="space-y-6">
            <div className="rounded-xl overflow-hidden border border-border">
              <div
                className="h-40 w-full"
                style={{ background: trip.image_gradient }}
              />
              <div className="p-5 space-y-3">
                <h2 className="text-lg font-semibold text-foreground">
                  {trip.name}
                </h2>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {trip.duration_days} {trip.duration_days === 1 ? "Day" : "Days"}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {trip.description}
                </p>
              </div>
            </div>

            {/* How it works */}
            <div className="rounded-xl border border-border p-5 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                How It Works
              </h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    1
                  </span>
                  <p>
                    Pay a <span className="text-foreground font-medium">${trip.deposit_amount.toLocaleString()}</span> deposit
                    now to secure your spot.
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    2
                  </span>
                  <p>
                    The remaining <span className="text-foreground font-medium">${balanceAmount.toLocaleString()}</span> is
                    authorized but not charged yet.
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    3
                  </span>
                  <p>
                    Balance is captured closer to your trip date, or voided if
                    you cancel.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right column: Pricing + PayPal */}
          <div className="space-y-6">
            <div className="rounded-xl border border-border p-6 space-y-5">
              <h3 className="font-semibold text-foreground">
                Payment Summary
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Trip total</span>
                  <span className="font-medium text-foreground">
                    ${trip.base_price.toLocaleString()}
                  </span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between text-sm">
                  <span className="text-foreground font-medium">
                    Deposit now
                  </span>
                  <span className="text-foreground font-semibold">
                    ${trip.deposit_amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Balance (later)</span>
                  <span className="text-muted-foreground">
                    ${balanceAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="h-px bg-border" />

              <div className="flex justify-between items-center">
                <span className="text-foreground font-semibold">
                  Due today
                </span>
                <span className="text-xl font-bold text-primary">
                  ${trip.deposit_amount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* PayPal Buttons */}
            <div className="rounded-xl border border-border p-6">
              <p className="text-sm text-muted-foreground mb-4">
                Pay securely with PayPal
              </p>
              <PayPalButtons
                style={{ layout: "vertical", shape: "rect", label: "pay" }}
                createOrder={async () => {
                  setError(null);
                  const res = await authFetch("/api/orders/create", {
                    method: "POST",
                    body: JSON.stringify({ slug: trip.slug }),
                  });
                  if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "Failed to create order");
                  }
                  const data = await res.json();
                  return data.id;
                }}
                onApprove={async (data) => {
                  setError(null);
                  const res = await authFetch(
                    `/api/orders/${data.orderID}/authorize`,
                    { method: "POST" }
                  );
                  if (!res.ok) {
                    const errData = await res.json();
                    setError(errData.error || "Authorization failed");
                    return;
                  }
                  const result = await res.json();
                  navigate(`/bookings/${result.bookingId}?confirmed=true`);
                }}
                onError={(err) => {
                  console.error("PayPal error:", err);
                  setError(
                    "Something went wrong with PayPal. Please try again."
                  );
                }}
                onCancel={() => {
                  setError("Payment was cancelled. You can try again.");
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </PayPalScriptProvider>
  );
}
