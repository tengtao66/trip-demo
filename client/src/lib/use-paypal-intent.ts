import { useEffect } from "react";
import { usePayPalScriptReducer } from "@paypal/react-paypal-js";

/**
 * Hook to load/reload the PayPal SDK with the correct intent for this checkout flow.
 * Must be called inside a component wrapped by PayPalScriptProvider.
 *
 * The App-level provider uses deferLoading={true}, so the SDK only loads
 * when a checkout page calls this hook with the appropriate intent.
 * When navigating between flows with different intents, resetOptions
 * reloads the SDK with the new params.
 */
export function usePayPalIntent(intent: "capture" | "authorize") {
  const [{ options }, dispatch] = usePayPalScriptReducer();

  useEffect(() => {
    dispatch({
      type: "resetOptions",
      value: {
        ...options,
        intent,
      },
    });
    // Only re-run when intent changes, not on every options change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent, dispatch]);
}
