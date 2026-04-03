import { useEffect, useState, useCallback } from "react";
import { useParams, Navigate } from "react-router-dom";
import { authFetch } from "@/lib/auth-fetch";
import type { BookingDetail } from "@/types/booking";
import AuthorizeBookingDetailPage from "./AuthorizeBookingDetailPage";
import VaultBookingDetailPage from "./VaultBookingDetailPage";

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
