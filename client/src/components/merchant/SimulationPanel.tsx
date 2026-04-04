import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  CheckCircle2,
  Loader2,
  RotateCcw,
  CreditCard,
  Sparkles,
  Fish,
  MapPin,
  Music,
  Wallet,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/auth-fetch";

interface SimStep {
  label: string;
  description: string;
  chargeType: string;
  amount: number;
  icon: typeof CreditCard;
  tag: string;
}

const SIM_STEPS: SimStep[] = [
  { label: "Setup Fee (Deposit)", description: "Vault created via PayPal wallet", chargeType: "setup_fee", amount: 500, icon: CreditCard, tag: "Setup fee" },
  { label: "Balinese Spa Treatment", description: "Activity add-on — Merchant-initiated", chargeType: "addon", amount: 150, icon: Sparkles, tag: "Add-on" },
  { label: "Scuba Diving Session", description: "Activity add-on — Merchant-initiated", chargeType: "addon", amount: 200, icon: Fish, tag: "Add-on" },
  { label: "Ubud City Walk Guidance", description: "Guide service fee — Merchant-initiated", chargeType: "addon", amount: 80, icon: MapPin, tag: "Add-on" },
  { label: "Kecak Fire Dance Event", description: "Event ticket fee — Merchant-initiated", chargeType: "addon", amount: 120, icon: Music, tag: "Add-on" },
  { label: "Final Settlement", description: "Remaining balance — Merchant-initiated", chargeType: "final", amount: 1450, icon: Wallet, tag: "Settlement" },
];

const TOTAL_AMOUNT = 2500;

type SimState = "idle" | "seeding" | "running" | "complete";

function generateTimestamp(stepIdx: number): string {
  const base = new Date();
  base.setDate(base.getDate() + stepIdx);
  base.setHours(8 + stepIdx * 2, Math.floor(Math.random() * 60), 0);
  return base.toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

export default function SimulationPanel() {
  const [simState, setSimState] = useState<SimState>("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [vaultTokenId, setVaultTokenId] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [totalCharged, setTotalCharged] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [stepError, setStepError] = useState<string | null>(null);
  const [timestamps, setTimestamps] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const startSimulation = async () => {
    setSimState("seeding");
    setStepError(null);
    setCurrentStep(0);
    setTotalCharged(0);
    setTimestamps([generateTimestamp(0)]);

    try {
      const res = await authFetch("/api/simulation/seed", { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        setStepError(err.error || "Failed to seed simulation");
        setSimState("idle");
        return;
      }
      const data = await res.json();
      setVaultTokenId(data.vaultTokenId);
      setBookingId(data.bookingId);
      setBookingRef(data.bookingReference);
      setTotalCharged(500);
      setCurrentStep(1);
      setSimState("running");
    } catch {
      setStepError("Network error starting simulation");
      setSimState("idle");
    }
  };

  const runStep = useCallback(
    async (stepIdx: number) => {
      if (!vaultTokenId || stepIdx >= SIM_STEPS.length) return;
      const step = SIM_STEPS[stepIdx];
      setStepError(null);

      try {
        const res = await authFetch(`/api/vault/${vaultTokenId}/charge`, {
          method: "POST",
          body: JSON.stringify({ amount: step.amount, description: step.description, type: step.chargeType }),
        });
        if (!res.ok) {
          const err = await res.json();
          setStepError(err.error || "Charge failed");
          return;
        }
        setTotalCharged((prev) => prev + step.amount);
        setTimestamps((prev) => [...prev, generateTimestamp(stepIdx)]);
        const nextStep = stepIdx + 1;
        if (nextStep >= SIM_STEPS.length) {
          try { await authFetch(`/api/vault/${vaultTokenId}`, { method: "DELETE" }); } catch {}
          setCurrentStep(nextStep);
          setSimState("complete");
        } else {
          setCurrentStep(nextStep);
        }
      } catch {
        setStepError("Network error");
      }
    },
    [vaultTokenId]
  );

  useEffect(() => {
    if (simState === "running" && autoAdvance && currentStep > 0 && currentStep < SIM_STEPS.length) {
      timerRef.current = setTimeout(() => runStep(currentStep), 3000);
      return cleanup;
    }
  }, [simState, autoAdvance, currentStep, runStep, cleanup]);

  const reset = async () => {
    cleanup();
    if (bookingId) {
      try { await authFetch(`/api/simulation/${bookingId}`, { method: "DELETE" }); } catch {}
    }
    setSimState("idle");
    setCurrentStep(0);
    setVaultTokenId(null);
    setBookingId(null);
    setBookingRef(null);
    setTotalCharged(0);
    setStepError(null);
    setTimestamps([]);
  };

  const completedSteps = Math.min(currentStep, SIM_STEPS.length);
  const addonTotal = SIM_STEPS.filter((s, i) => s.chargeType === "addon" && i < currentStep).reduce((a, s) => a + s.amount, 0);
  const remaining = TOTAL_AMOUNT - totalCharged;
  const progressPct = simState === "complete" ? 100 : Math.round((completedSteps / SIM_STEPS.length) * 100);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#5C3D2E] to-[#A0522D] px-6 py-4 flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-lg">Vault Flow Simulation</h3>
          <p className="text-white/70 text-sm mt-0.5">
            Walk through a complete Flow 2 (vault) lifecycle
          </p>
        </div>
        {simState === "idle" && (
          <Button onClick={startSimulation} className="bg-white text-[#5C3D2E] hover:bg-white/90 cursor-pointer">
            <Play className="h-4 w-4 mr-1.5" /> Start Simulation
          </Button>
        )}
      </div>

      {/* Main content — only shown after simulation starts */}
      {simState !== "idle" && (
        <div className="p-6">
          {/* Booking header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="font-semibold text-foreground text-lg">Bali Adventure Retreat</h4>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                {bookingRef && <span className="font-mono">{bookingRef}</span>}
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  simState === "complete" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                }`}>
                  {simState === "complete" ? "COMPLETED" : "IN PROGRESS"}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">VAULT</span>
              </div>
            </div>
            {vaultTokenId && (
              <div className="text-right text-xs text-muted-foreground">
                <span>Vault Token</span>
                <p className="font-mono font-medium text-foreground">{vaultTokenId.slice(0, 12)}...</p>
              </div>
            )}
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Payment Summary + Controls */}
            <div className="space-y-4">
              {/* Payment Summary */}
              <div className="rounded-lg border border-border p-4 space-y-3">
                <h5 className="font-semibold text-foreground text-sm uppercase tracking-wide">Payment Summary</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Setup Fee (Deposit)</span>
                    <span className={currentStep > 0 ? "text-foreground font-medium" : "text-muted-foreground"}>
                      {currentStep > 0 ? "$500.00" : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Add-on Services</span>
                    <span className={addonTotal > 0 ? "text-foreground font-medium" : "text-muted-foreground"}>
                      {addonTotal > 0 ? `$${addonTotal.toFixed(2)}` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Final Settlement</span>
                    <span className={simState === "complete" ? "text-foreground font-medium" : "text-muted-foreground"}>
                      {simState === "complete" ? "$1,450.00" : "—"}
                    </span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between font-semibold">
                    <span className="text-foreground">Total Charged</span>
                    <span className="text-foreground">${totalCharged.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-[#86A873] transition-all duration-700 rounded-full"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                    <span>{completedSteps} of {SIM_STEPS.length} payments completed</span>
                    <span>{remaining > 0 ? `$${remaining.toFixed(2)} remaining` : "Fully settled"}</span>
                  </div>
                </div>
              </div>

              {/* Controls or Completion */}
              {simState === "complete" ? (
                <div className="rounded-lg bg-green-50 border border-green-200 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <h5 className="font-semibold text-green-800">Simulation Complete</h5>
                  </div>
                  <p className="text-sm text-green-700">
                    All {SIM_STEPS.length} charges processed. Total: ${totalCharged.toLocaleString("en-US", { minimumFractionDigits: 2 })}. Vault token deleted.
                  </p>
                  <Button onClick={reset} variant="outline" size="sm" className="cursor-pointer">
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset Simulation
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border border-border p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      disabled={currentStep >= SIM_STEPS.length}
                      onClick={() => { cleanup(); runStep(currentStep); }}
                      className="cursor-pointer"
                    >
                      {currentStep < SIM_STEPS.length && (() => {
                        const Icon = SIM_STEPS[currentStep].icon;
                        return <Icon className="h-3.5 w-3.5 mr-1.5" />;
                      })()}
                      Charge: {currentStep < SIM_STEPS.length ? SIM_STEPS[currentStep].label : "Done"}
                    </Button>
                    <Button onClick={reset} variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 cursor-pointer">
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete Vault
                    </Button>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoAdvance}
                      onChange={(e) => { setAutoAdvance(e.target.checked); if (!e.target.checked) cleanup(); }}
                      className="rounded"
                    />
                    Auto-advance every 3 seconds
                  </label>
                </div>
              )}

              {stepError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{stepError}</div>
              )}
            </div>

            {/* Right: Payment Timeline */}
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <h5 className="font-semibold text-foreground text-sm uppercase tracking-wide">Payment Timeline</h5>
                <span className="text-xs text-muted-foreground">{completedSteps} transactions</span>
              </div>

              <div className="relative pl-7">
                {/* Vertical line */}
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />

                <div className="space-y-5">
                  {SIM_STEPS.map((step, idx) => {
                    const isDone = idx < currentStep;
                    const isCurrent = idx === currentStep && simState === "running";
                    const isPending = idx > currentStep || (idx === currentStep && simState !== "running" && !isDone);
                    const StepIcon = step.icon;
                    let runningTotal = 0;
                    for (let i = 0; i <= idx; i++) runningTotal += SIM_STEPS[i].amount;

                    return (
                      <div key={idx} className={`relative flex gap-3 ${isPending && !isCurrent ? "opacity-40" : ""}`}>
                        {/* Timeline dot */}
                        <div className={`absolute -left-7 top-0.5 w-[22px] h-[22px] rounded-full flex items-center justify-center border-2 ${
                          isDone
                            ? "bg-[#86A873] border-[#86A873] text-white"
                            : isCurrent
                              ? "bg-amber-100 border-amber-400 text-amber-600"
                              : "bg-background border-border text-muted-foreground"
                        }`}
                          style={isCurrent ? { animation: "pulse 2s infinite" } : {}}
                        >
                          {isDone ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : isCurrent ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <div className="h-1.5 w-1.5 rounded-full bg-current" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                                <StepIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                {step.label}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                              {isDone && timestamps[idx] && (
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  {timestamps[idx]}
                                  {idx > 0 && idx < 5 && <span className="text-primary ml-1">(Day {idx + 1})</span>}
                                </p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <p className={`text-sm font-semibold ${
                                isDone ? "text-foreground" : isCurrent ? "text-amber-600" : "text-muted-foreground"
                              }`}>
                                ${step.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </p>
                              <span className={`text-[10px] font-medium uppercase tracking-wider ${
                                isDone ? "text-[#86A873]" : isCurrent ? "text-amber-500" : "text-muted-foreground"
                              }`}>
                                {isDone ? "CAPTURED" : isCurrent ? "PROCESSING" : "PENDING"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Vault status footer */}
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>{simState === "complete" ? "Vault token deleted" : "Vault token active"}</span>
                <span>{simState === "complete" ? "Token will be deleted after final settlement" : ""}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
