import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  Car,
  Fuel,
  Users,
  Luggage,
  Navigation,
  Wrench,
  CircleCheck,
  Infinity,
  Globe,
  UtensilsCrossed,
  Music,
  Waves,
  Lock,
} from "lucide-react";
import { fetchTrip } from "@/lib/api";
import { tripImages } from "@/lib/constants";
import { usePayPalIntent } from "@/lib/use-paypal-intent";
import { Button } from "@/components/ui/button";
import PayLaterMessage from "@/components/PayLaterMessage";
import type { Trip } from "@/types/trip";

function PricingSidebar({ trip }: { trip: Trip }) {
  const navigate = useNavigate();
  const [pickupDate, setPickupDate] = useState("");
  const [dropoffDate, setDropoffDate] = useState("");

  // Pre-load the correct PayPal SDK intent so checkout buttons render instantly
  usePayPalIntent(trip.payment_flow === "authorize" ? "authorize" : "capture");

  const today = new Date().toISOString().split("T")[0];

  const rentalDays =
    pickupDate && dropoffDate
      ? Math.max(
          0,
          Math.ceil(
            (new Date(dropoffDate).getTime() -
              new Date(pickupDate).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : 0;
  const rentalTotal =
    trip.category === "car_rental" && trip.daily_rate
      ? rentalDays * trip.daily_rate
      : 0;

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4 sticky top-24">
      {trip.payment_flow === "authorize" && (
        <>
          <p className="text-2xl font-semibold text-foreground">
            ${trip.base_price.toLocaleString()}
          </p>
          {trip.category === "cruise" && (
            <p className="text-sm text-muted-foreground">
              per person, {trip.duration_days}-day cruise
            </p>
          )}

          <div className="rounded-lg bg-muted/50 p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-primary">
                Deposit ({Math.round((trip.deposit_amount / trip.base_price) * 100)}%)
              </span>
              <span className="font-semibold text-primary">
                ${trip.deposit_amount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Balance due</span>
              <span className="text-foreground">
                ${(trip.base_price - trip.deposit_amount).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground pt-1 border-t border-border flex items-start gap-1.5">
              <Lock className="h-3 w-3 mt-0.5 shrink-0" />
              Deposit is captured immediately. Balance is captured by the merchant before your departure date.
            </p>
          </div>
        </>
      )}

      {trip.payment_flow === "vault" && (
        <>
          <p className="text-2xl font-semibold text-foreground">
            Setup fee: ${trip.deposit_amount.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">Add-ons during trip</p>
        </>
      )}

      {trip.payment_flow === "invoice" && (
        <>
          <p className="text-2xl font-semibold text-foreground">
            Starting from ${trip.base_price.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">Custom quote</p>
        </>
      )}

      {trip.payment_flow === "instant" && trip.daily_rate && (
        <>
          <p className="text-2xl font-semibold text-foreground">
            ${trip.daily_rate.toLocaleString()}/day
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Pickup Date
              </label>
              <input
                type="date"
                min={today}
                value={pickupDate}
                onChange={(e) => {
                  setPickupDate(e.target.value);
                  if (dropoffDate && e.target.value > dropoffDate) {
                    setDropoffDate("");
                  }
                }}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Dropoff Date
              </label>
              <input
                type="date"
                min={pickupDate || today}
                value={dropoffDate}
                onChange={(e) => setDropoffDate(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum 1-day rental
            </p>
          </div>

          {rentalDays > 0 && (
            <div className="rounded-lg bg-muted/50 p-3 space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  ${trip.daily_rate.toLocaleString()}/day &times; {rentalDays}{" "}
                  {rentalDays === 1 ? "day" : "days"}
                </span>
                <span>${rentalTotal.toLocaleString()}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-bold text-lg text-primary">
                  ${rentalTotal.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {rentalTotal > 0 && <PayLaterMessage amount={rentalTotal} />}

          <Button
            className="w-full cursor-pointer"
            disabled={rentalDays <= 0}
            onClick={() =>
              navigate(`/checkout/${trip.slug}`, {
                state: { pickupDate, dropoffDate },
              })
            }
          >
            Rent Now
          </Button>
        </>
      )}

      {trip.payment_flow !== "instant" && (
        <Link to={`/checkout/${trip.slug}`} className="block w-full">
          <Button className="w-full cursor-pointer">
            {trip.payment_flow === "invoice"
              ? "Design Your Trip"
              : trip.payment_flow === "authorize"
                ? "Reserve Now"
                : "Book Now"}
          </Button>
        </Link>
      )}
    </div>
  );
}

export default function TripDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

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
        <p className="text-xl text-muted-foreground mb-4">Trip not found</p>
        <Link to="/" className="text-primary underline">
          Back to all trips
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Back link */}
      <div className="max-w-6xl mx-auto px-6 pt-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all trips
        </Link>
      </div>

      {/* Hero banner — split layout: text left, image right */}
      <div className="max-w-6xl mx-auto px-6 mt-4">
        <div
          className="rounded-2xl overflow-hidden flex"
          style={{ background: trip.image_gradient, minHeight: "280px" }}
        >
          {/* Left: text content */}
          <div className="flex-1 flex flex-col justify-center p-6 md:p-10 text-white">
            <h1 className="text-2xl md:text-3xl font-bold leading-tight">{trip.name}</h1>
            <p className="mt-3 text-white/80 text-sm leading-relaxed max-w-md">
              {trip.description}
            </p>
            {trip.duration_days > 0 && (
              <p className="mt-4 text-white/70 text-sm flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {trip.duration_days} {trip.duration_days === 1 ? "Day" : "Days"}
              </p>
            )}
          </div>
          {/* Right: image (if available) */}
          {tripImages[trip.slug] && (
            <div className="w-2/5 relative hidden md:block">
              <img
                src={tripImages[trip.slug]}
                alt={trip.name}
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  maskImage: "linear-gradient(to right, transparent 0%, black 30%)",
                  WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 30%)",
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left: description + itinerary (or vehicle specs for car rentals) */}
        <div className="lg:col-span-2 space-y-8">
          {trip.category === "car_rental" ? (
            <>
              {/* Vehicle Specifications */}
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Vehicle Specifications
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: Car, value: "Automatic", label: "Transmission" },
                    { icon: Fuel, value: trip.slug === "suv-rental" ? "25 MPG" : trip.slug === "luxury-convertible" ? "20 MPG" : "35 MPG", label: "Fuel Economy" },
                    { icon: Users, value: trip.slug === "suv-rental" ? "7 Seats" : "5 Seats", label: "Passengers" },
                    { icon: Luggage, value: trip.slug === "suv-rental" ? "4 Large" : trip.slug === "luxury-convertible" ? "1 Large" : "2 Large", label: "Luggage" },
                  ].map((spec) => (
                    <div
                      key={spec.label}
                      className="rounded-xl border border-border bg-card p-4 text-center"
                    >
                      <spec.icon className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-semibold text-foreground">
                        {spec.value}
                      </p>
                      <p className="text-xs text-muted-foreground">{spec.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* What's Included */}
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  What's Included
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { icon: Infinity, title: "Unlimited Mileage", desc: "Drive as far as you need" },
                    { icon: Navigation, title: "GPS Navigation", desc: "Built-in nav system" },
                    { icon: Wrench, title: "Roadside Assistance", desc: "24/7 emergency support" },
                    { icon: CircleCheck, title: "Free Cancellation", desc: "Cancel up to 24h before" },
                  ].map((feature) => (
                    <div
                      key={feature.title}
                      className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <feature.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {feature.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {feature.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Cruise Highlights — only for cruise category */}
              {trip.category === "cruise" && (
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    Cruise Highlights
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { icon: Globe, title: trip.slug === "caribbean-cruise" ? "3 Island Ports" : trip.slug === "mediterranean-cruise" ? "5 Country Stops" : "2 Alaska Ports", desc: trip.slug === "caribbean-cruise" ? "Cozumel, Grand Cayman, Jamaica" : trip.slug === "mediterranean-cruise" ? "France, Italy, Greece & more" : "Juneau, Glacier Bay" },
                      { icon: UtensilsCrossed, title: "All-Inclusive Dining", desc: "Breakfast, lunch, dinner included" },
                      { icon: Music, title: "Live Entertainment", desc: "Nightly shows and deck parties" },
                      { icon: Waves, title: "Shore Excursions", desc: "Snorkeling, waterfalls, beaches" },
                    ].map((highlight) => (
                      <div
                        key={highlight.title}
                        className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <highlight.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {highlight.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {highlight.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3">
                  {trip.category === "cruise" ? `${trip.duration_days}-Day Itinerary` : "About This Trip"}
                </h2>
                {trip.category !== "cruise" && (
                  <p className="text-muted-foreground leading-relaxed">
                    {trip.description}
                  </p>
                )}
              </div>
            </>
          )}

          {trip.itinerary.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-6">
                Itinerary
              </h2>
              <div className="relative pl-8">
                {/* Vertical line */}
                <div className="absolute left-3 top-1 bottom-1 w-0.5 bg-border" />

                <div className="space-y-6">
                  {trip.itinerary.map((day) => (
                    <div key={day.day} className="relative">
                      {/* Day circle */}
                      <div className="absolute -left-8 top-0.5 h-6 w-6 rounded-full bg-accent text-accent-foreground text-xs font-semibold flex items-center justify-center">
                        {day.day}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {day.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {day.details}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: pricing sidebar */}
        <div>
          <PricingSidebar trip={trip} />
        </div>
      </div>
    </div>
  );
}
