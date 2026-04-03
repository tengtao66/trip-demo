import { useEffect } from "react";
import { usePayPalScriptReducer } from "@paypal/react-paypal-js";

/**
 * Hook to ensure the PayPal SDK is loaded with the correct intent.
 * Compares the requested intent against the SDK's current options.
 * Only calls resetOptions when the intent actually differs.
 */
export function usePayPalIntent(intent: "capture" | "authorize") {
  const [{ options }, dispatch] = usePayPalScriptReducer();

  useEffect(() => {
    // Only reset if the SDK's current intent differs from what this page needs
    if (options.intent === intent) return;

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
