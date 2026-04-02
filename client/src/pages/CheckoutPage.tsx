import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { fetchTrip } from "@/lib/api";
import type { Trip } from "@/types/trip";
import CheckoutAuthorizePage from "./checkout/CheckoutAuthorizePage";

export default function CheckoutPage() {
  const { slug } = useParams<{ slug: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetchTrip(slug)
      .then(setTrip)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12 text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (notFound || !trip) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <p className="text-xl text-muted-foreground">Trip not found</p>
      </div>
    );
  }

  // Dispatch to the correct checkout sub-component based on payment flow
  switch (trip.payment_flow) {
    case "authorize":
      return <CheckoutAuthorizePage trip={trip} />;
    case "vault":
      // Will be built in Section 5
      return (
        <div className="text-center py-20 text-2xl text-muted-foreground">
          Vault Checkout — Coming Soon
        </div>
      );
    case "invoice":
      return <Navigate to={`/trips/${trip.slug}`} replace />;
    default:
      return null;
  }
}
