import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchTrips } from "@/lib/api";
import { usePayPalIntent } from "@/lib/use-paypal-intent";
import TripCard from "@/components/trips/TripCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Trip } from "@/types/trip";

const TAB_CONFIG: { value: Trip["category"]; label: string }[] = [
  { value: "tour", label: "Tours" },
  { value: "car_rental", label: "Car Rentals" },
  { value: "cruise", label: "Cruises" },
];

export default function HomePage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get("tab");
  const activeTab: Trip["category"] = TAB_CONFIG.find(
    (t) => t.value === tabParam
  )
    ? (tabParam as Trip["category"])
    : "tour";

  // Pre-load PayPal SDK intent based on active tab:
  // cruise → authorize, car_rental/tour → capture
  usePayPalIntent(activeTab === "cruise" ? "authorize" : "capture");

  useEffect(() => {
    fetchTrips()
      .then(setTrips)
      .finally(() => setLoading(false));
  }, []);

  function handleTabChange(value: unknown) {
    const tab = value as string;
    setSearchParams({ tab }, { replace: true });
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 py-16 relative z-10">
          <h1 className="text-2xl md:text-4xl font-semibold">Explore Our Services</h1>
          <p className="mt-2 text-primary-foreground/80 text-lg">
            Tours, car rentals, and cruises &mdash; with flexible payment
            options
          </p>
        </div>
        {/* Right-half background image */}
        <div className="absolute inset-y-0 right-0 w-1/2 hidden md:block">
          <img
            src="/guided-tour-16.webp"
            alt="Guided tours"
            className="w-full h-full object-cover"
            style={{
              maskImage:
                "linear-gradient(to right, transparent 0%, black 30%)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0%, black 30%)",
            }}
          />
        </div>
      </section>

      {/* Tabbed Trip Grid */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-6">
            {TAB_CONFIG.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {loading ? (
            <p className="text-muted-foreground">Loading trips...</p>
          ) : (
            TAB_CONFIG.map((tab) => {
              const filtered = trips.filter(
                (trip) => trip.category === tab.value
              );
              return (
                <TabsContent key={tab.value} value={tab.value}>
                  {filtered.length === 0 ? (
                    <p className="text-muted-foreground">
                      No {tab.label.toLowerCase()} available yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {filtered.map((trip) => (
                        <TripCard key={trip.id} trip={trip} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              );
            })
          )}
        </Tabs>
      </section>
    </div>
  );
}
