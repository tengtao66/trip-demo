import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Calendar,
  Compass,
  Mail,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { authFetch } from "@/lib/auth-fetch";
import { DESTINATIONS, ACTIVITIES } from "@/data/destinations";

export default function CustomTripRequestPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>(
    []
  );
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [email, setEmail] = useState(user?.email ?? "");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);

  const total = useMemo(() => {
    const destTotal = DESTINATIONS.filter((d) =>
      selectedDestinations.includes(d.id)
    ).reduce((sum, d) => sum + d.price, 0);
    const actTotal = ACTIVITIES.filter((a) =>
      selectedActivities.includes(a.id)
    ).reduce((sum, a) => sum + a.price, 0);
    return destTotal + actTotal;
  }, [selectedDestinations, selectedActivities]);

  const deposit = Math.round(total * 0.4 * 100) / 100;
  const balance = Math.round((total - deposit) * 100) / 100;

  function toggleDestination(id: string) {
    setSelectedDestinations((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  }

  function toggleActivity(id: string) {
    setSelectedActivities((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedDestinations.length === 0) {
      setError("Please select at least one destination.");
      return;
    }
    if (!startDate || !endDate) {
      setError("Please select travel dates.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await authFetch("/api/trip-requests", {
        method: "POST",
        body: JSON.stringify({
          email,
          startDate,
          endDate,
          destinations: selectedDestinations,
          activities: selectedActivities,
          notes: notes || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit request");
      }
      const data = await res.json();
      setRequestId(data.id);
      setBookingRef(data.bookingReference);
      setInvoiceUrl(data.invoiceUrl || null);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Confirmation view — shown after successful submission
  if (submitted) {
    const selectedDests = DESTINATIONS.filter((d) =>
      selectedDestinations.includes(d.id)
    );
    const selectedActs = ACTIVITIES.filter((a) =>
      selectedActivities.includes(a.id)
    );

    return (
      <div className="max-w-3xl mx-auto py-8">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/15 mb-4">
            <CheckCircle2 className="h-8 w-8 text-secondary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">
            {invoiceUrl ? "Invoice Sent!" : "Trip Request Submitted!"}
          </h1>
          {bookingRef && (
            <p className="text-sm font-mono text-accent mt-1">{bookingRef}</p>
          )}
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            {invoiceUrl
              ? <>A PayPal invoice has been sent to <strong className="text-foreground">{email}</strong>. Pay the deposit to confirm your booking.</>
              : <>Our travel team will review your request and send a PayPal invoice to <strong className="text-foreground">{email}</strong></>
            }
          </p>
        </div>

        {/* Invoice link — shown when auto-created */}
        {invoiceUrl && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">PayPal Invoice</h3>
            </div>
            <p className="text-sm text-blue-700 mb-4">
              Click below to view and pay your invoice. You can also find it in the email sent to {email}.
            </p>
            <div className="flex gap-3">
              <a
                href={invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <FileText className="h-4 w-4" />
                View & Pay Invoice
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(invoiceUrl);
                }}
                className="inline-flex items-center gap-2 bg-white border border-blue-200 text-blue-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors cursor-pointer"
              >
                Copy Link
              </button>
            </div>
          </div>
        )}

        {/* Request summary */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-5 mb-6">
          <h2 className="font-semibold text-foreground">Your Trip Summary</h2>

          {/* Dates */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {startDate} — {endDate}
            </span>
          </div>

          {/* Destinations */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Destinations
            </p>
            <div className="space-y-1.5">
              {selectedDests.map((d) => (
                <div
                  key={d.id}
                  className="flex justify-between text-sm border-b border-border/50 pb-1.5"
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-accent" />
                    {d.name}
                  </span>
                  <span className="font-medium">${d.price.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Activities */}
          {selectedActs.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Activities
              </p>
              <div className="space-y-1.5">
                {selectedActs.map((a) => (
                  <div
                    key={a.id}
                    className="flex justify-between text-sm border-b border-border/50 pb-1.5"
                  >
                    <span className="flex items-center gap-2">
                      <Compass className="h-3.5 w-3.5 text-secondary" />
                      {a.name}
                    </span>
                    <span className="font-medium">${a.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {notes && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Special Requests
              </p>
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                {notes}
              </p>
            </div>
          )}

          {/* Totals */}
          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">${total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Deposit (40%) — invoice item 1
              </span>
              <span className="font-medium">${deposit.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Balance (60%) — invoice item 2
              </span>
              <span className="font-medium">${balance.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* What happens next */}
        <div className="rounded-xl border border-border bg-muted/30 p-6 space-y-4 mb-6">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Mail className="h-4 w-4 text-accent" />
            What Happens Next
          </h3>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/15 text-accent text-xs font-semibold flex items-center justify-center">
                1
              </span>
              <span>
                Our travel team reviews your request and prepares your custom
                itinerary
              </span>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/15 text-accent text-xs font-semibold flex items-center justify-center">
                2
              </span>
              <span>
                A PayPal invoice will be sent to{" "}
                <strong className="text-foreground">{email}</strong> with your
                deposit and balance amounts
              </span>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/15 text-accent text-xs font-semibold flex items-center justify-center">
                3
              </span>
              <span>
                Pay the deposit through the invoice link to confirm your
                booking, then pay the balance before your trip starts
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="cursor-pointer"
          >
            Back to Trips
          </Button>
          <Button
            onClick={() => navigate("/bookings")}
            className="cursor-pointer"
          >
            View My Bookings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">
          Design Your European Grand Tour
        </h1>
        <p className="text-muted-foreground mt-1">
          Choose your destinations, activities, and dates. We will send you an
          invoice with a 40% deposit.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column: Trip builder */}
          <div className="space-y-6">
            {/* Hero card with euro2.jpg */}
            <div className="rounded-xl overflow-hidden border border-border">
              <div
                className="h-40 w-full bg-cover bg-center relative"
                style={{ backgroundImage: "url(/euro2.jpg)" }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                <div className="absolute bottom-4 left-5">
                  <h2 className="text-lg font-semibold text-foreground">
                    Custom European Grand Tour
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Personalized multi-city itinerary
                  </p>
                </div>
              </div>
            </div>

            {/* Travel dates */}
            <div className="rounded-xl border border-border p-5 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Travel Dates
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Destinations */}
            <div className="rounded-xl border border-border p-5 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Destinations
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DESTINATIONS.map((dest) => {
                  const selected = selectedDestinations.includes(dest.id);
                  return (
                    <button
                      key={dest.id}
                      type="button"
                      onClick={() => toggleDestination(dest.id)}
                      className={`flex items-center justify-between rounded-lg border p-3 text-left text-sm transition-colors ${
                        selected
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded border ${
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/30"
                          }`}
                        >
                          {selected && (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <span>{dest.name}</span>
                      </div>
                      <span className="font-medium text-foreground">
                        ${dest.price.toLocaleString()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Activities */}
            <div className="rounded-xl border border-border p-5 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Compass className="h-4 w-4 text-primary" />
                Activities
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ACTIVITIES.map((act) => {
                  const selected = selectedActivities.includes(act.id);
                  return (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => toggleActivity(act.id)}
                      className={`flex items-center justify-between rounded-lg border p-3 text-left text-sm transition-colors ${
                        selected
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded border ${
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/30"
                          }`}
                        >
                          {selected && (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <span>{act.name}</span>
                      </div>
                      <span className="font-medium text-foreground">
                        ${act.price.toLocaleString()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right column: Contact + Summary */}
          <div className="space-y-6">
            {/* Email */}
            <div className="rounded-xl border border-border p-5 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                Contact Email
              </h3>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
              <p className="text-xs text-muted-foreground">
                The PayPal invoice will be sent to this email.
              </p>
            </div>

            {/* Notes */}
            <div className="rounded-xl border border-border p-5 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Special Requests
              </h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="E.g. anniversary dinner in Paris, private guide for Swiss Alps..."
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>

            {/* Running total */}
            <div className="rounded-xl border border-border p-6 space-y-5">
              <h3 className="font-semibold text-foreground">Trip Estimate</h3>

              {/* Selected destinations summary */}
              {selectedDestinations.length > 0 && (
                <div className="space-y-1.5">
                  {DESTINATIONS.filter((d) =>
                    selectedDestinations.includes(d.id)
                  ).map((d) => (
                    <div
                      key={d.id}
                      className="flex justify-between text-sm text-muted-foreground"
                    >
                      <span>{d.name}</span>
                      <span>${d.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected activities summary */}
              {selectedActivities.length > 0 && (
                <div className="space-y-1.5">
                  {ACTIVITIES.filter((a) =>
                    selectedActivities.includes(a.id)
                  ).map((a) => (
                    <div
                      key={a.id}
                      className="flex justify-between text-sm text-muted-foreground"
                    >
                      <span>{a.name}</span>
                      <span>${a.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              {total === 0 && (
                <p className="text-sm text-muted-foreground/60 italic">
                  Select destinations and activities to see pricing
                </p>
              )}

              {total > 0 && (
                <>
                  <div className="h-px bg-border" />
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Estimated total
                      </span>
                      <span className="font-medium text-foreground">
                        ${total.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground font-medium">
                        Deposit (40%)
                      </span>
                      <span className="text-foreground font-semibold">
                        ${deposit.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Balance (60%)
                      </span>
                      <span className="text-muted-foreground">
                        ${balance.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={submitting || total === 0}
            >
              {submitting ? "Submitting..." : "Submit Trip Request"}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              You will receive a PayPal invoice via email once our team reviews
              your request.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
