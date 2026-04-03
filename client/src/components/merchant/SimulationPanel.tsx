import { useState, useEffect, useRef, useCallback } from "react";
import { Play, CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/auth-fetch";

interface SimStep {
  label: string;
  description: string;
  chargeType: string;
  amount: number;
}

const SIM_STEPS: SimStep[] = [
  { label: "Setup Fee", description: "Initial booking setup fee", chargeType: "setup_fee", amount: 500 },
  { label: "Spa Treatment", description: "Balinese spa treatment add-on", chargeType: "addon", amount: 150 },
  { label: "Diving Session", description: "Scuba diving session add-on", chargeType: "addon", amount: 200 },
  { label: "City Walk Tour", description: "Guided city walk add-on", chargeType: "addon", amount: 80 },
  { label: "Cultural Event", description: "Traditional dance event add-on", chargeType: "addon", amount: 120 },
  { label: "Final Settlement", description: "Final trip settlement charge", chargeType: "final", amount: 1450 },
];

type SimState = "idle" | "seeding" | "running" | "complete";

export default function SimulationPanel() {
  const [simState, setSimState] = useState<SimState>("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [vaultTokenId, setVaultTokenId] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [totalCharged, setTotalCharged] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [stepError, setStepError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const startSimulation = async () => {
    setSimState("seeding");
    setStepError(null);
    setCurrentStep(0);
    setTotalCharged(0);

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
      // Step 0 (setup_fee) is already done via seed
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
          body: JSON.stringify({
            amount: step.amount,
            description: step.description,
            type: step.chargeType,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          setStepError(err.error || "Charge failed");
          return;
        }
        setTotalCharged((prev) => prev + step.amount);
        const nextStep = stepIdx + 1;
        if (nextStep >= SIM_STEPS.length) {
          // Final step — also delete the vault token to complete the lifecycle
          try {
            await authFetch(`/api/vault/${vaultTokenId}`, { method: "DELETE" });
          } catch {
            // Non-critical — vault cleanup is best-effort in simulation
          }
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

  // Auto-advance timer
  useEffect(() => {
    if (simState === "running" && autoAdvance && currentStep > 0 && currentStep < SIM_STEPS.length) {
      timerRef.current = setTimeout(() => runStep(currentStep), 3000);
      return cleanup;
    }
  }, [simState, autoAdvance, currentStep, runStep, cleanup]);

  const reset = async () => {
    cleanup();
    // Clean up simulation booking from DB
    if (bookingId) {
      try {
        await authFetch(`/api/simulation/${bookingId}`, { method: "DELETE" });
      } catch {
        // Best-effort cleanup
      }
    }
    setSimState("idle");
    setCurrentStep(0);
    setVaultTokenId(null);
    setBookingId(null);
    setTotalCharged(0);
    setStepError(null);
  };

  const progressPct =
    simState === "complete"
      ? 100
      : simState === "idle"
        ? 0
        : Math.round((currentStep / SIM_STEPS.length) * 100);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#5C3D2E] to-[#A0522D] px-6 py-4 flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-lg">
            Vault Flow Simulation
          </h3>
          <p className="text-white/70 text-sm mt-0.5">
            Walk through a complete Flow 2 (vault) lifecycle without real PayPal calls
          </p>
        </div>
        {simState === "idle" && (
          <Button
            onClick={startSimulation}
            className="bg-white text-[#5C3D2E] hover:bg-white/90"
          >
            <Play className="h-4 w-4 mr-1.5" />
            Start Simulation
          </Button>
        )}
        {simState === "complete" && (
          <Button
            onClick={reset}
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10"
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Reset
          </Button>
        )}
      </div>

      {/* Progress */}
      {simState !== "idle" && (
        <div className="px-6 py-5 space-y-4">
          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-[#A0522D] transition-all duration-500 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Step labels */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {SIM_STEPS.map((step, idx) => {
              const isDone = idx < currentStep;
              const isCurrent = idx === currentStep && simState === "running";
              return (
                <div
                  key={idx}
                  className={`flex flex-col items-center text-center gap-1 p-2 rounded-lg transition-colors ${
                    isDone
                      ? "bg-emerald-50 text-emerald-700"
                      : isCurrent
                        ? "bg-[#A0522D]/10 text-[#A0522D]"
                        : "text-muted-foreground"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : isCurrent ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-current opacity-40" />
                  )}
                  <span className="text-[10px] font-medium leading-tight">
                    {step.label}
                  </span>
                  <span className="text-[10px] font-semibold">${step.amount}</span>
                </div>
              );
            })}
          </div>

          {/* Controls */}
          {simState === "running" && (
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                disabled={currentStep >= SIM_STEPS.length}
                onClick={() => {
                  cleanup();
                  runStep(currentStep);
                }}
              >
                Next Step
              </Button>
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoAdvance}
                  onChange={(e) => {
                    setAutoAdvance(e.target.checked);
                    if (!e.target.checked) cleanup();
                  }}
                  className="rounded"
                />
                Auto-advance (3s)
              </label>
            </div>
          )}

          {/* Error */}
          {stepError && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {stepError}
            </div>
          )}

          {/* Completion summary */}
          {simState === "complete" && (
            <div className="bg-emerald-50 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-emerald-800">
                Simulation Complete
              </h4>
              <div className="text-sm text-emerald-700 space-y-1">
                <p>
                  <span className="font-medium">Total Charged:</span>{" "}
                  ${totalCharged.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
                <p>
                  <span className="font-medium">Steps Completed:</span>{" "}
                  {SIM_STEPS.length} / {SIM_STEPS.length}
                </p>
                {bookingId && (
                  <p>
                    <span className="font-medium">Booking ID:</span>{" "}
                    <code className="text-xs bg-emerald-100 px-1 py-0.5 rounded">
                      {bookingId.slice(0, 8)}...
                    </code>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
