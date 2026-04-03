import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { Clock, AlertCircle, ShieldCheck, Repeat } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";
import { tripImages } from "@/lib/constants";
import type { Trip } from "@/types/trip";

interface Props {
  trip: Trip;
}

// Fee schedule breakdown for the 7-day trip
const feeSchedule = [
  { day: "Booking", label: "Setup Fee (Deposit)", amount: 500, type: "setup_fee" },
  { day: "Day 2", label: "Balinese Spa Treatment", amount: 150, type: "addon" },
  { day: "Day 3", label: "Scuba Diving Session", amount: 200, type: "addon" },
  { day: "Day 4", label: "Ubud City Walk Guidance", amount: 80, type: "addon" },
  { day: "Day 5", label: "Kecak Fire Dance Event", amount: 120, type: "addon" },
  { day: "Day 7", label: "Final Settlement (Remaining)", amount: 1450, type: "final" },
];

export default function CheckoutVaultPage({ trip }: Props) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const setupFee = trip.deposit_amount;

  return (
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
                className="h-40 w-full bg-cover bg-center relative"
                style={tripImages[trip.slug]
                  ? { backgroundImage: `url(${tripImages[trip.slug]})` }
                  : { background: trip.image_gradient }
                }
              >
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />
              </div>
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
                    Pay a <span className="text-foreground font-medium">${setupFee.toLocaleString()}</span> setup
                    fee now to secure your spot and save your payment method.
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    2
                  </span>
                  <p>
                    During your trip, add-on activities and services are charged
                    automatically to your saved payment method.
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    3
                  </span>
                  <p>
                    A final settlement is charged at the end of your trip for the
                    remaining balance.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                <Repeat className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  Your payment method will be securely saved (vaulted) so the
                  merchant can charge add-ons during your trip without requiring
                  you to approve each one.
                </p>
              </div>
            </div>
          </div>

          {/* Right column: Pricing + PayPal */}
          <div className="space-y-6">
            <div className="rounded-xl border border-border p-6 space-y-5">
              <h3 className="font-semibold text-foreground">
                Payment Summary
              </h3>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total trip cost</span>
                <span className="font-semibold text-foreground">${trip.base_price.toLocaleString()}</span>
              </div>

              <div className="h-px bg-border" />

              {/* Fee schedule timeline */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Payment Schedule</p>
                <div className="space-y-0">
                  {feeSchedule.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded min-w-[60px] text-center ${
                        item.type === "setup_fee"
                          ? "bg-primary/10 text-primary"
                          : item.type === "final"
                            ? "bg-accent/10 text-accent"
                            : "bg-secondary/10 text-secondary"
                      }`}>
                        {item.day}
                      </span>
                      <span className="text-sm text-foreground flex-1">{item.label}</span>
                      <span className={`text-sm font-medium ${
                        i === 0 ? "text-primary font-semibold" : "text-foreground"
                      }`}>
                        ${item.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-px bg-border" />

              <div className="flex justify-between items-center">
                <span className="text-foreground font-semibold">Due today</span>
                <span className="text-xl font-bold text-primary">${setupFee.toLocaleString()}</span>
              </div>

              <p className="text-xs text-muted-foreground">
                Remaining charges will be billed to your saved payment method during and after your trip.
              </p>
            </div>

            {/* Vault terms + checkbox */}
            <div className="rounded-xl border border-border bg-surface-highlight/50 p-5 text-sm text-muted-foreground space-y-3">
              <p className="font-medium text-foreground">Payment Authorization Terms</p>
              <p>By proceeding, you agree to save your PayPal payment method for this trip. The merchant will:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Charge the setup fee of <strong className="text-foreground">${trip.deposit_amount.toLocaleString()}</strong> now</li>
                <li>Charge additional service fees for activities you select during your trip</li>
                <li>Charge the remaining balance after your trip is completed</li>
                <li>Delete your saved payment token once the trip is fully settled</li>
              </ul>
              <label className="flex items-start gap-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-primary cursor-pointer"
                />
                <span className="text-foreground text-sm">
                  I agree to the payment authorization terms and understand that my payment method will be saved and charged during the trip.
                </span>
              </label>
            </div>

            {/* PayPal Button — PayPal only, gated by terms checkbox */}
            <div className={`rounded-xl border border-border p-6 ${!termsAccepted ? "opacity-50 pointer-events-none" : ""}`}>
              <p className="text-sm text-muted-foreground mb-4">
                Save & pay with PayPal
              </p>
              {!termsAccepted && (
                <p className="text-xs text-accent mb-3">Please accept the terms above to proceed</p>
              )}
              <PayPalButtons
                fundingSource="paypal"
                disabled={!termsAccepted}
                style={{ layout: "vertical", shape: "rect", label: "pay", tagline: false }}
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
                    `/api/orders/${data.orderID}/capture`,
                    { method: "POST" }
                  );
                  if (!res.ok) {
                    const errData = await res.json();
                    setError(errData.error || "Capture failed");
                    return;
                  }
                  const result = await res.json();
                  navigate(`/bookings/${result.bookingReference}?confirmed=true`);
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
  );
}
