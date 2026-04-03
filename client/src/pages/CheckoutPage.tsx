import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { fetchTrip } from "@/lib/api";
import type { Trip } from "@/types/trip";
import CheckoutAuthorizePage from "./checkout/CheckoutAuthorizePage";
import CheckoutVaultPage from "./checkout/CheckoutVaultPage";
import CheckoutInstantPage from "./checkout/CheckoutInstantPage";
import CustomTripRequestPage from "./checkout/CustomTripRequestPage";

/**
 * Single PayPalScriptProvider for ALL checkout flows.
 * The SDK is loaded once with a superset of options. Each flow's server-side
 * createOrder call determines the actual intent (AUTHORIZE vs CAPTURE).
 * This prevents the "zoid destroyed all components" error caused by
 * multiple providers loading the SDK with different parameters.
 */
function getPayPalOptions(flow: Trip["payment_flow"]) {
  const base = {
    clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
    currency: "USD",
  };

  switch (flow) {
    case "vault":
      return { ...base, intent: "capture" as const, vault: true, components: "buttons" };
    case "instant":
      return {
        ...base,
        intent: "capture" as const,
        components: "buttons,messages",
        "enable-funding": "paylater",
        "buyer-country": "US",
      };
    case "authorize":
    default:
      return { ...base, intent: "authorize" as const, components: "buttons" };
  }
}

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

  // Invoice flow has no PayPal buttons — render without provider
  if (trip.payment_flow === "invoice") {
    return <CustomTripRequestPage />;
  }

  // All other flows share one PayPalScriptProvider keyed by slug
  // to force a fresh provider when switching between products
  return (
    <PayPalScriptProvider key={slug} options={getPayPalOptions(trip.payment_flow)}>
      <CheckoutContent trip={trip} />
    </PayPalScriptProvider>
  );
}

function CheckoutContent({ trip }: { trip: Trip }) {
  switch (trip.payment_flow) {
    case "authorize":
      return <CheckoutAuthorizePage trip={trip} />;
    case "vault":
      return <CheckoutVaultPage trip={trip} />;
    case "instant":
      return <CheckoutInstantPage trip={trip} />;
    default:
      return null;
  }
}
