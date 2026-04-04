import { useState, useCallback } from "react";
import {
  ArrowLeft,
  User,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Key,
  Sparkles,
  Waves,
  MapPin,
  Ticket,
  CircleDollarSign,
  Trash2,
  Plus,
  Info,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/auth-fetch";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { BookingDetail, BookingCharge } from "@/types/booking";
import ChargeAddonDialog from "@/components/merchant/ChargeAddonDialog";
import FinalSettlementButton from "@/components/merchant/FinalSettlementButton";

interface Props {
  booking: BookingDetail;
  onRefresh: () => void;
}

const chargeIcons: Record<string, React.ElementType> = {
  setup_fee: Key,
  spa: Sparkles,
  diving: Waves,
  city_walk: MapPin,
  event: Ticket,
  final: CircleDollarSign,
  addon: Sparkles,
};

function getChargeIcon(charge: BookingCharge) {
  // Try to match by type first, then by description keywords
  if (chargeIcons[charge.type]) return chargeIcons[charge.type];
  const desc = charge.description.toLowerCase();
  if (desc.includes("spa") || desc.includes("massage")) return Sparkles;
  if (desc.includes("scuba") || desc.includes("diving") || desc.includes("surf"))
    return Waves;
  if (desc.includes("walk") || desc.includes("tour") || desc.includes("city"))
    return MapPin;
  if (desc.includes("event") || desc.includes("dance") || desc.includes("show"))
    return Ticket;
  if (desc.includes("settlement") || desc.includes("final"))
    return CircleDollarSign;
  return Sparkles;
}

function getTypeLabel(charge: BookingCharge): string {
  if (charge.type === "setup_fee") return "Setup Fee";
  if (charge.type === "final") return "Final Settlement";
  if (charge.type === "addon") return "Add-on Service";
  return charge.type;
}

function formatTimestamp(dateStr: string): { date: string; time: string } {
  const d = new Date(dateStr);
  return {
    date: d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
  };
}

export default function VaultBookingDetailPage({ booking, onRefresh }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [addonOpen, setAddonOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const isVaultActive = !!booking.vault_token_id;
  const isCompleted = booking.status === "COMPLETED";

  const setupFeeCharge = booking.charges.find((c) => c.type === "setup_fee");
  const addonCharges = booking.charges.filter(
    (c) => c.type === "addon" || (c.type !== "setup_fee" && c.type !== "final")
  );
  const finalCharge = booking.charges.find((c) => c.type === "final");

  const setupTotal = setupFeeCharge?.amount ?? 0;
  const addonTotal = addonCharges.reduce((sum, c) => sum + c.amount, 0);
  const finalTotal = finalCharge?.amount ?? 0;
  const chargedTotal = booking.paid_amount;
  const progressPct = Math.min(
    100,
    Math.round((chargedTotal / booking.total_amount) * 100)
  );

  const handleDeleteVault = useCallback(async () => {
    if (!booking.vault_token_id) return;

    setDeleteLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await authFetch(`/api/vault/${booking.vault_token_id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        const msg = data.error || "Failed to delete vault token";
        setError(msg);
        toast.error(msg);
        return;
      }
      setSuccess("Vault token deleted successfully.");
      toast.success("Vault token deleted successfully.");
      onRefresh();
    } catch {
      setError("Network error deleting vault token");
      toast.error("Network error deleting vault token");
    } finally {
      setDeleteLoading(false);
    }
  }, [booking.vault_token_id, onRefresh]);

  // Compute running totals for timeline
  let runningTotal = 0;
  const chargesWithRunning = booking.charges.map((c) => {
    runningTotal += c.amount;
    return { ...c, runningTotal };
  });

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
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-2xl font-semibold text-foreground">
          {booking.trip_name}
        </h1>
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            booking.status === "COMPLETED"
              ? "bg-green-100 text-green-800"
              : booking.status === "IN_PROGRESS"
                ? "bg-blue-100 text-blue-800"
                : "bg-amber-100 text-amber-800"
          }`}
        >
          {booking.status.replace(/_/g, " ")}
        </span>
        <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
          VAULT
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Booking #{booking.booking_reference}
        {booking.duration_days && ` \u00b7 ${booking.duration_days} Days`}
      </p>

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
              <p className="text-muted-foreground">
                Booked:{" "}
                {new Date(booking.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Payment Summary card */}
          <div className="rounded-xl border border-border p-5">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Summary
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Setup Fee (Deposit)
                </span>
                <span className="font-medium text-foreground">
                  ${setupTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              {addonTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Add-on Services</span>
                  <span className="font-medium text-foreground">
                    ${addonTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {finalTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Final Settlement
                  </span>
                  <span className="font-medium text-foreground">
                    ${finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <div className="h-px bg-border" />
              <div className="flex justify-between">
                <span className="font-semibold text-foreground">
                  Total Charged
                </span>
                <span className="font-semibold text-foreground">
                  ${chargedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-green-700">
                  {booking.charges.filter((c) => c.status === "completed").length}{" "}
                  of {booking.charges.length} payments completed
                </span>
                {booking.total_amount - chargedTotal > 0 && (
                  <span className="text-muted-foreground">
                    ${(booking.total_amount - chargedTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
                    remaining
                  </span>
                )}
              </div>
              {/* Progress bar */}
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {!isCompleted && (
            <div className="flex gap-3">
              {isVaultActive && (
                <>
                  <Button
                    className="flex-1"
                    onClick={() => setAddonOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Charge Add-on
                  </Button>
                  <FinalSettlementButton
                    booking={booking}
                    onSuccess={() => {
                      setSuccess("Final settlement completed. Booking closed.");
                      toast.success("Final settlement completed. Booking closed.");
                      onRefresh();
                    }}
                    onError={(msg) => {
                      setError(msg);
                      toast.error(msg);
                    }}
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => setDeleteConfirmOpen(true)}
                    disabled={deleteLoading}
                    title="Delete Vault Token"
                    className="cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Vault token info */}
          <div className="rounded-xl border border-border bg-muted/30 p-5">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Vault Token
            </h3>
            <div className="text-sm text-muted-foreground space-y-2">
              {isVaultActive ? (
                <>
                  <p>
                    Vault token active since{" "}
                    {new Date(booking.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    .
                  </p>
                  <p className="text-xs font-mono bg-muted px-2 py-1 rounded inline-block">
                    {booking.vault_token_id!.slice(0, 8)}...
                  </p>
                  <p className="text-xs">
                    Token will be deleted after final settlement.
                  </p>
                </>
              ) : (
                <p>
                  Vault token has been deleted.{" "}
                  {isCompleted
                    ? "Booking is complete."
                    : "No further charges can be made."}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right column — Payment Timeline */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border p-5">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Timeline
              </h2>
              <span className="text-xs text-muted-foreground">
                {booking.charges.length} transaction
                {booking.charges.length !== 1 ? "s" : ""}
              </span>
            </div>

            {booking.charges.length === 0 ? (
              <div className="text-center py-8">
                <Sparkles className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No add-on charges yet — use "+ Charge Add-on" to record a
                  service.
                </p>
              </div>
            ) : (
              <div className="relative pl-7 space-y-6">
                {/* Vertical line */}
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />

                {chargesWithRunning.map((charge) => {
                  const Icon = getChargeIcon(charge);
                  const ts = formatTimestamp(charge.created_at);
                  const isCompleted = charge.status === "completed";

                  return (
                    <div key={charge.id} className="relative">
                      {/* Dot */}
                      <div
                        className={`absolute -left-7 top-1 h-[22px] w-[22px] rounded-full flex items-center justify-center ${
                          isCompleted
                            ? "bg-green-500"
                            : "bg-amber-400 border-2 border-dashed border-amber-500"
                        }`}
                      >
                        <Icon className="h-3 w-3 text-white" />
                      </div>

                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            {charge.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {getTypeLabel(charge)}{" "}
                            {charge.type !== "setup_fee" &&
                              "\u00b7 Merchant-initiated"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {ts.date} — {ts.time}
                          </p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p
                            className={`text-sm font-semibold ${
                              isCompleted
                                ? "text-green-700"
                                : "text-amber-700"
                            }`}
                          >
                            $
                            {charge.amount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                          <p
                            className={`text-[10px] font-medium ${
                              isCompleted
                                ? "text-green-600"
                                : "text-amber-600"
                            }`}
                          >
                            {isCompleted ? "CAPTURED" : "PENDING"}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Running: $
                            {charge.runningTotal.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* How Vault Works */}
          <div className="rounded-xl border border-border bg-muted/30 p-5">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Info className="h-4 w-4" />
              How Vault Payments Work
            </h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                The customer's PayPal account was saved (vaulted) during checkout.
                A setup fee was captured immediately.
              </p>
              <p>
                <span className="font-medium text-foreground">Charge Add-on</span>{" "}
                bills the customer's saved payment method for services during their trip.
              </p>
              <p>
                <span className="font-medium text-foreground">Final Settlement</span>{" "}
                charges the remaining balance and deletes the vault token.
              </p>
              <p className="text-xs">
                All charges are merchant-initiated and require no buyer interaction.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charge Add-on Dialog */}
      {isVaultActive && booking.vault_token_id && (
        <ChargeAddonDialog
          open={addonOpen}
          onOpenChange={setAddonOpen}
          vaultId={booking.vault_token_id}
          onSuccess={() => {
            setSuccess("Add-on charge processed successfully.");
            toast.success("Add-on charge processed successfully.");
            onRefresh();
          }}
          onError={(msg) => {
            setError(msg);
            toast.error(msg);
          }}
        />
      )}

      {/* Delete Vault Confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Vault Token"
        description="Are you sure you want to delete this vault token? This cannot be undone. No further charges can be made."
        confirmLabel="Delete Vault"
        variant="destructive"
        onConfirm={handleDeleteVault}
      />
    </div>
  );
}
