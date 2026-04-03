import { useEffect, useState, useCallback } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, CreditCard, Calendar, Clock } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";
import { tripImages, STATUS_LABELS } from "@/lib/constants";
import type { BookingDetail } from "@/types/booking";
import AuthorizeBookingDetailPage from "./AuthorizeBookingDetailPage";
import VaultBookingDetailPage from "./VaultBookingDetailPage";

function InstantBookingDetail({ booking }: { booking: BookingDetail }) {
  const statusConfig = STATUS_LABELS[booking.status] || {
    label: booking.status,
    className: "bg-muted text-muted-foreground",
  };

  return (
    <div>
      <Link
        to="/merchant/bookings"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to bookings
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Trip info */}
        <div className="lg:col-span-2 space-y-6">
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

          {/* Status banner */}
          <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-800">Payment Complete</p>
              <p className="text-sm text-green-700 mt-0.5">
                This booking was paid in full at checkout. No further action
                required.
              </p>
            </div>
          </div>

          {/* Charge history */}
          <div className="rounded-xl border border-border p-5">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment History
            </h2>
            {booking.charges.length === 0 ? (
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
                        {new Date(charge.created_at).toLocaleDateString()}{" "}
                        &middot;{" "}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MerchantBookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const loadBooking = useCallback(() => {
    if (!id) return;
    authFetch(`/api/bookings/${id}`)
      .then((r) => r.json())
      .then(setBooking)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

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

  // Dispatch based on payment_flow
  switch (booking.payment_flow) {
    case "authorize":
      return (
        <AuthorizeBookingDetailPage
          booking={booking}
          onRefresh={loadBooking}
        />
      );
    case "vault":
      return (
        <VaultBookingDetailPage booking={booking} onRefresh={loadBooking} />
      );
    case "instant":
      return <InstantBookingDetail booking={booking} />;
    case "invoice":
      // Redirect to the invoice detail page which handles this flow
      return booking.invoice_id ? (
        <Navigate to={`/merchant/invoices/${booking.invoice_id}`} replace />
      ) : (
        <Navigate to={`/merchant/trip-requests`} replace />
      );
    default:
      return null;
  }
}
