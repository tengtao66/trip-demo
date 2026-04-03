import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  Calendar,
  Mail,
  FileText,
  ExternalLink,
} from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";
import type { BookingDetail } from "@/types/booking";

const tripImages: Record<string, string> = {
  "tokyo-cherry-blossom": "/tokyo.webp",
  "bali-adventure": "/bali2.webp",
  "custom-european-tour": "/euro2.jpg",
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  DEPOSIT_CAPTURED: {
    label: "Deposit Paid",
    className: "bg-amber-100 text-amber-800",
  },
  FULLY_CAPTURED: {
    label: "Fully Paid",
    className: "bg-green-100 text-green-800",
  },
  VOIDED: {
    label: "Cancelled",
    className: "bg-red-100 text-red-800",
  },
};

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isConfirmation = searchParams.get("confirmed") === "true";
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    authFetch(`/api/bookings/${id}`)
      .then((r) => r.json())
      .then(setBooking)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="text-muted-foreground py-12">Loading booking...</div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-20">
        <p className="text-xl text-muted-foreground">Booking not found</p>
      </div>
    );
  }

  const statusConfig = STATUS_LABELS[booking.status] || {
    label: booking.status,
    className: "bg-muted text-muted-foreground",
  };

  const balanceRemaining = booking.total_amount - booking.paid_amount;

  return (
    <div>
      <Link
        to="/bookings"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to bookings
      </Link>

      {/* Confirmation banner */}
      {isConfirmation && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-green-800">Booking Confirmed!</p>
            <p className="text-sm text-green-700 mt-0.5">
              Your deposit has been captured. Reference:{" "}
              <span className="font-mono font-semibold">
                {booking.booking_reference}
              </span>
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Trip info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trip card */}
          <div className="rounded-xl overflow-hidden border border-border">
            <div
              className="h-40 w-full bg-cover bg-center relative"
              style={
                tripImages[booking.trip_slug]
                  ? { backgroundImage: `url(${tripImages[booking.trip_slug]})` }
                  : { background: booking.image_gradient || "#ccc" }
              }
            >
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-xl font-semibold text-foreground">
                  {booking.trip_name}
                </h1>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.className}`}
                >
                  {statusConfig.label}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="font-mono">{booking.booking_reference}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Booked {new Date(booking.created_at).toLocaleDateString()}
                </span>
                {booking.duration_days && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {booking.duration_days} days
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Invoice flow status — only for invoice bookings */}
          {booking.payment_flow === "invoice" && (
            <div className="rounded-xl border border-border p-5 space-y-4">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-accent" />
                Invoice Status
              </h2>

              {/* Invoice link — shown when available */}
              {booking.invoice_url ? (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-2">
                  <p className="text-sm font-medium text-blue-900">PayPal Invoice Link</p>
                  <p className="text-xs text-blue-700">Click to view and pay your invoice</p>
                  <a
                    href={booking.invoice_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Invoice
                  </a>
                </div>
              ) : null}

              {/* Invoice flow timeline */}
              <div className="space-y-3">
                {[
                  { status: "REQUEST_SUBMITTED", label: "Trip request submitted", icon: FileText },
                  { status: "INVOICE_CREATED", label: "Invoice created by merchant", icon: FileText },
                  { status: "AWAITING_DEPOSIT", label: "Invoice sent — check your email", icon: Mail },
                  { status: "DEPOSIT_RECEIVED", label: "Deposit payment received", icon: CheckCircle2 },
                  { status: "FULLY_PAID", label: "Fully paid — trip confirmed!", icon: CheckCircle2 },
                ].map((step, i) => {
                  const statusOrder = ["REQUEST_SUBMITTED", "INVOICE_CREATED", "AWAITING_DEPOSIT", "DEPOSIT_RECEIVED", "FULLY_PAID"];
                  const currentIdx = statusOrder.indexOf(booking.status);
                  const stepIdx = statusOrder.indexOf(step.status);
                  const isDone = stepIdx <= currentIdx;
                  const isCurrent = stepIdx === currentIdx;
                  const StepIcon = step.icon;

                  return (
                    <div key={step.status} className="flex items-start gap-3">
                      <div className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                        isDone ? "bg-secondary text-white" : "bg-muted text-muted-foreground"
                      }`}>
                        {isDone ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <span className="text-xs font-medium">{i + 1}</span>
                        )}
                      </div>
                      <div>
                        <p className={`text-sm ${isCurrent ? "font-semibold text-foreground" : isDone ? "text-foreground" : "text-muted-foreground"}`}>
                          {step.label}
                        </p>
                        {isCurrent && step.status === "REQUEST_SUBMITTED" && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Our team is reviewing your request and will send an invoice to your email
                          </p>
                        )}
                        {isCurrent && step.status === "AWAITING_DEPOSIT" && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            A PayPal invoice has been sent to your email — pay the deposit to confirm
                          </p>
                        )}
                        {isCurrent && step.status === "DEPOSIT_RECEIVED" && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Please pay the remaining balance before your trip starts
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Charge history */}
          <div className="rounded-xl border border-border p-5">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment History
            </h2>
            {booking.charges.length === 0 && booking.payment_flow === "invoice" ? (
              <p className="text-sm text-muted-foreground">
                Payments will appear here once you pay the invoice sent to your email.
              </p>
            ) : booking.charges.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No charges recorded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {booking.charges.map((charge) => (
                  <div
                    key={charge.id}
                    className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="text-foreground font-medium">
                        {charge.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(charge.created_at).toLocaleDateString()} &middot;{" "}
                        <span className="capitalize">{charge.status}</span>
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
        </div>

        {/* Right: Payment summary */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border p-5 space-y-4">
            <h3 className="font-semibold text-foreground">Payment Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium text-foreground">
                  ${booking.total_amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paid</span>
                <span className="font-medium text-green-700">
                  ${booking.paid_amount.toLocaleString()}
                </span>
              </div>
              {balanceRemaining > 0 && booking.status !== "VOIDED" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Remaining</span>
                  <span className="font-medium text-amber-700">
                    ${balanceRemaining.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
            {booking.authorization_id &&
              booking.status === "DEPOSIT_CAPTURED" && (
                <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                  <p>
                    Authorization expires:{" "}
                    {booking.authorization_expires_at
                      ? new Date(
                          booking.authorization_expires_at
                        ).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
