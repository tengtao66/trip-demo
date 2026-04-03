import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchTrip } from "@/lib/api";
import type { Trip } from "@/types/trip";
import CheckoutAuthorizePage from "./checkout/CheckoutAuthorizePage";
import CheckoutVaultPage from "./checkout/CheckoutVaultPage";
import CheckoutInstantPage from "./checkout/CheckoutInstantPage";
import CustomTripRequestPage from "./checkout/CustomTripRequestPage";

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
      return <CheckoutVaultPage trip={trip} />;
    case "instant":
      return <CheckoutInstantPage trip={trip} />;
    case "invoice":
      return <CustomTripRequestPage />;
    default:
      return null;
  }
}
