import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  User,
  Shield,
  Clock,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/auth-fetch";
import type { BookingDetail } from "@/types/booking";

interface Props {
  booking: BookingDetail;
  onRefresh: () => void;
}

function useCountdown(expiresAt: string | null) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!expiresAt) return;

    function update() {
      const now = Date.now();
      const expiry = new Date(expiresAt!).getTime();
      const diff = expiry - now;
      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${days}d ${hours}h ${mins}m`);
    }

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return timeLeft;
}

export default function AuthorizeBookingDetailPage({
  booking,
  onRefresh,
}: Props) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const timeLeft = useCountdown(booking.authorization_expires_at);

  const balanceRemaining = booking.total_amount - booking.paid_amount;

  const handleCapture = useCallback(async () => {
    if (!booking.authorization_id) return;
    setActionLoading("capture");
    setError(null);
    setSuccess(null);
    try {
      const res = await authFetch(
        `/api/payments/authorizations/${booking.authorization_id}/capture`,
        { method: "POST" }
      );
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Capture failed");
        return;
      }
      setSuccess("Balance captured successfully!");
      onRefresh();
    } catch {
      setError("Network error during capture");
    } finally {
      setActionLoading(null);
    }
  }, [booking.authorization_id, onRefresh]);

  const handleVoid = useCallback(async () => {
    if (!booking.authorization_id) return;
    setActionLoading("void");
    setError(null);
    setSuccess(null);
    try {
      const res = await authFetch(
        `/api/payments/authorizations/${booking.authorization_id}/void`,
        { method: "POST" }
      );
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Void failed");
        return;
      }
      setSuccess("Authorization voided successfully.");
      onRefresh();
    } catch {
      setError("Network error during void");
    } finally {
      setActionLoading(null);
    }
  }, [booking.authorization_id, onRefresh]);

  const isActive = booking.status === "DEPOSIT_CAPTURED";

  return (
    <div>
      <Link
        to="/merchant/bookings"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to bookings
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          {booking.trip_name}
        </h1>
        <span className="font-mono text-sm text-muted-foreground">
          {booking.booking_reference}
        </span>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column */}
        <div className="space-y-6">
          {/* Customer card */}
          <div className="rounded-xl border border-border p-5">
            <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Customer
            </h2>
            <div className="text-sm space-y-1">
              <p className="text-foreground">{booking.customer_name}</p>
              <p className="text-muted-foreground">{booking.customer_email}</p>
            </div>
          </div>

          {/* Authorization Status card */}
          <div className="rounded-xl border border-border p-5">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Authorization Status
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">
                  {booking.status === "DEPOSIT_CAPTURED" && (
                    <span className="text-amber-700">Deposit Captured</span>
                  )}
                  {booking.status === "FULLY_CAPTURED" && (
                    <span className="text-green-700">Fully Captured</span>
                  )}
                  {booking.status === "VOIDED" && (
                    <span className="text-red-700">Voided</span>
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Authorized Amount
                </span>
                <span className="text-foreground font-medium">
                  ${booking.total_amount.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Deposit Captured</span>
                <span className="text-green-700 font-medium">
                  ${booking.paid_amount.toLocaleString()}
                </span>
              </div>

              {balanceRemaining > 0 && booking.status !== "VOIDED" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Balance Remaining
                  </span>
                  <span className="text-amber-700 font-medium">
                    ${balanceRemaining.toLocaleString()}
                  </span>
                </div>
              )}

              {booking.authorization_expires_at && isActive && (
                <>
                  <div className="h-px bg-border" />
                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Authorization expires in
                      </p>
                      <p className="font-semibold text-foreground">
                        {timeLeft}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {booking.authorization_id && (
                <div className="text-xs text-muted-foreground break-all">
                  Auth ID: {booking.authorization_id}
                </div>
              )}
            </div>

            {/* Action buttons */}
            {isActive && (
              <div className="flex gap-3 mt-5">
                <Button
                  onClick={handleCapture}
                  disabled={actionLoading !== null}
                  className="flex-1"
                >
                  {actionLoading === "capture" ? (
                    "Capturing..."
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-1.5" />
                      Capture Balance (${balanceRemaining.toLocaleString()})
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleVoid}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === "void" ? (
                    "Voiding..."
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-1.5" />
                      Void
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Two-phase payment timeline */}
          <div className="rounded-xl border border-border p-5">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Timeline
            </h2>

            <div className="relative pl-6 space-y-6">
              {/* Vertical line */}
              <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-border" />

              {/* Phase 1: Deposit */}
              <div className="relative">
                <div className="absolute -left-6 top-0.5 h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle2 className="h-3 w-3 text-white" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">
                    Deposit Captured
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ${booking.paid_amount.toLocaleString()} &middot;{" "}
                    {new Date(booking.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Phase 2: Balance */}
              <div className="relative">
                <div
                  className={`absolute -left-6 top-0.5 h-5 w-5 rounded-full flex items-center justify-center ${
                    booking.status === "FULLY_CAPTURED"
                      ? "bg-green-500"
                      : booking.status === "VOIDED"
                        ? "bg-red-500"
                        : "bg-muted border-2 border-border"
                  }`}
                >
                  {booking.status === "FULLY_CAPTURED" && (
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  )}
                  {booking.status === "VOIDED" && (
                    <XCircle className="h-3 w-3 text-white" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">
                    {booking.status === "FULLY_CAPTURED"
                      ? "Balance Captured"
                      : booking.status === "VOIDED"
                        ? "Authorization Voided"
                        : "Balance Pending"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {booking.status === "FULLY_CAPTURED" ? (
                      `$${balanceRemaining.toLocaleString()} captured`
                    ) : booking.status === "VOIDED" ? (
                      "Remaining balance released"
                    ) : (
                      `$${balanceRemaining.toLocaleString()} awaiting capture`
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charge history */}
          <div className="rounded-xl border border-border p-5">
            <h2 className="font-semibold text-foreground mb-3">
              Charge History
            </h2>
            {booking.charges.length === 0 ? (
              <p className="text-sm text-muted-foreground">No charges yet.</p>
            ) : (
              <div className="space-y-2">
                {booking.charges.map((charge) => (
                  <div
                    key={charge.id}
                    className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="text-foreground">{charge.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(charge.created_at).toLocaleDateString()}
                        {charge.paypal_capture_id && (
                          <>
                            {" "}
                            &middot;{" "}
                            <span className="font-mono">
                              {charge.paypal_capture_id}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    <span className="font-medium text-foreground">
                      ${charge.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* How it Works explainer */}
          <div className="rounded-xl border border-border bg-muted/30 p-5">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Info className="h-4 w-4" />
              How Authorize & Capture Works
            </h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                The customer's payment method was authorized for the full trip
                amount. A partial capture was taken as a deposit.
              </p>
              <p>
                <span className="font-medium text-foreground">
                  Capture Balance
                </span>{" "}
                charges the remaining amount (final capture). Use this when the
                trip is confirmed.
              </p>
              <p>
                <span className="font-medium text-foreground">Void</span>{" "}
                releases the remaining authorization. The deposit is already
                captured and cannot be reversed from here.
              </p>
              <p className="text-xs">
                Authorizations expire after 29 days. Capture before expiry.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
