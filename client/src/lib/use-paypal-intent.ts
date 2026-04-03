import { useEffect, useRef } from "react";
import { usePayPalScriptReducer } from "@paypal/react-paypal-js";

/**
 * Hook to ensure the PayPal SDK is loaded with the correct intent.
 *
 * The App-level provider loads the SDK with intent=capture (default).
 * - Capture flows (vault, instant): no-op, SDK already has correct intent.
 * - Authorize flow: dispatches resetOptions to reload SDK with intent=authorize.
 *   This triggers a one-time zoid console warning (cosmetic, non-blocking).
 */
export function usePayPalIntent(intent: "capture" | "authorize") {
  const [{ options }, dispatch] = usePayPalScriptReducer();
  const appliedRef = useRef(false);

  useEffect(() => {
    // SDK already loaded with intent=capture by default.
    // Only resetOptions if we need a DIFFERENT intent (authorize).
    if (intent === "capture") return;
    if (appliedRef.current) return;

    appliedRef.current = true;
    dispatch({
      type: "resetOptions",
      value: {
        ...options,
        intent,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent]);
}
