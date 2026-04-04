import { useState } from "react";
import { CircleDollarSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/auth-fetch";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { BookingDetail } from "@/types/booking";

interface Props {
  booking: BookingDetail;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export default function FinalSettlementButton({
  booking,
  onSuccess,
  onError,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const remainingBalance = booking.total_amount - booking.paid_amount;

  const handleFinalSettlement = async () => {
    if (!booking.vault_token_id) return;

    setLoading(true);
    try {
      if (remainingBalance > 0) {
        const chargeRes = await authFetch(
          `/api/vault/${booking.vault_token_id}/charge`,
          {
            method: "POST",
            body: JSON.stringify({
              amount: remainingBalance,
              description: `Final Settlement - ${booking.trip_name}`,
              type: "final",
            }),
          }
        );
        if (!chargeRes.ok) {
          const data = await chargeRes.json();
          onError(data.error || "Final settlement charge failed");
          return;
        }
      }

      const deleteRes = await authFetch(
        `/api/vault/${booking.vault_token_id}`,
        { method: "DELETE" }
      );
      if (!deleteRes.ok) {
        const data = await deleteRes.json();
        onError(data.error || "Failed to delete vault token");
        return;
      }

      onSuccess();
    } catch {
      onError("Network error during final settlement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => setConfirmOpen(true)}
        disabled={loading}
        className="flex-1 cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CircleDollarSign className="h-4 w-4 mr-1.5" />
            Final Settlement
            {remainingBalance > 0 && ` ($${remainingBalance.toFixed(2)})`}
          </>
        )}
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Final Settlement"
        description={
          remainingBalance <= 0
            ? "No remaining balance. Delete the vault token and complete the booking?"
            : `This will charge $${remainingBalance.toFixed(2)} as the final settlement and delete the vault token. This cannot be undone.`
        }
        confirmLabel={remainingBalance > 0 ? `Charge $${remainingBalance.toFixed(2)}` : "Complete Booking"}
        onConfirm={handleFinalSettlement}
      />
    </>
  );
}
