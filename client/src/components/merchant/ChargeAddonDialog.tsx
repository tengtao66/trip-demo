import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Waves, ChefHat, Mountain, Loader2 } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vaultId: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

interface PresetAddon {
  name: string;
  amount: number;
  icon: React.ElementType;
}

const presetAddons: PresetAddon[] = [
  { name: "Balinese Spa Treatment", amount: 150, icon: Sparkles },
  { name: "Scuba Diving Session", amount: 200, icon: Waves },
  { name: "Cooking Class", amount: 80, icon: ChefHat },
  { name: "Volcano Trek", amount: 120, icon: Mountain },
];

export default function ChargeAddonDialog({
  open,
  onOpenChange,
  vaultId,
  onSuccess,
  onError,
}: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setSelected(null);
    setCustomMode(false);
    setCustomAmount("");
    setCustomDescription("");
  };

  const handleCharge = async () => {
    let amount: number;
    let description: string;

    if (customMode) {
      amount = parseFloat(customAmount);
      description = customDescription.trim();
      if (!amount || amount <= 0) {
        onError("Enter a valid amount");
        return;
      }
      if (!description) {
        onError("Enter a description");
        return;
      }
    } else if (selected !== null) {
      const preset = presetAddons[selected];
      amount = preset.amount;
      description = preset.name;
    } else {
      return;
    }

    setLoading(true);
    try {
      const res = await authFetch(`/api/vault/${vaultId}/charge`, {
        method: "POST",
        body: JSON.stringify({ amount, description, type: "addon" }),
      });
      if (!res.ok) {
        const data = await res.json();
        onError(data.error || "Charge failed");
        return;
      }
      reset();
      onOpenChange(false);
      onSuccess();
    } catch {
      onError("Network error processing charge");
    } finally {
      setLoading(false);
    }
  };

  const canCharge = customMode
    ? parseFloat(customAmount) > 0 && customDescription.trim().length > 0
    : selected !== null;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Charge Add-on Service</DialogTitle>
          <DialogDescription>
            Select a service or enter a custom charge to bill the customer's
            saved payment method.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Preset cards */}
          {!customMode && (
            <div className="grid grid-cols-2 gap-2">
              {presetAddons.map((addon, idx) => {
                const Icon = addon.icon;
                const isSelected = selected === idx;
                return (
                  <button
                    key={addon.name}
                    type="button"
                    onClick={() => setSelected(isSelected ? null : idx)}
                    className={`flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-colors cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        isSelected ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                    <span className="text-xs font-medium text-foreground">
                      {addon.name}
                    </span>
                    <span className="text-sm font-semibold text-primary">
                      ${addon.amount}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Custom toggle */}
          {!customMode ? (
            <button
              type="button"
              onClick={() => {
                setCustomMode(true);
                setSelected(null);
              }}
              className="w-full text-center text-sm text-primary hover:underline cursor-pointer py-1"
            >
              Or enter a custom charge...
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">
                  Description
                </label>
                <input
                  type="text"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="e.g., Private yoga session"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">
                  Amount (USD)
                </label>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setCustomMode(false);
                  setCustomAmount("");
                  setCustomDescription("");
                }}
                className="text-sm text-muted-foreground hover:underline cursor-pointer"
              >
                Back to presets
              </button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleCharge}
            disabled={!canCharge || loading}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Charge
                {selected !== null && !customMode
                  ? ` $${presetAddons[selected].amount}`
                  : customAmount
                    ? ` $${parseFloat(customAmount).toFixed(2)}`
                    : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
