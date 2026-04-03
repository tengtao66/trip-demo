import { useEffect, useRef } from "react";
import { usePayPalScriptReducer } from "@paypal/react-paypal-js";

/**
 * Hook to load/reload the PayPal SDK with the correct intent for this checkout flow.
 * Only dispatches resetOptions when the intent actually changes from the
 * currently loaded value, preventing unnecessary SDK reloads (and zoid errors)
 * during Vite HMR or re-renders.
 */
export function usePayPalIntent(intent: "capture" | "authorize") {
  const [{ options, isInitial }, dispatch] = usePayPalScriptReducer();
  const loadedIntent = useRef<string | undefined>(undefined);

  useEffect(() => {
    // Skip if the SDK is already loaded with this intent
    if (loadedIntent.current === intent && !isInitial) return;

    loadedIntent.current = intent;
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
