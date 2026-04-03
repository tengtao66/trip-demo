import { useEffect, useRef } from "react";

interface PayLaterMessageProps {
  amount: number;
  placement?: string;
}

const CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID as string;
const SCRIPT_ID = "paypal-messages-sdk";

/**
 * Official PayPal Pay Later messaging for product/detail pages.
 * Uses the native data-attribute approach (data-pp-message) with a
 * separate messages-only SDK script. This avoids conflicts with
 * the checkout page's PayPalScriptProvider which loads the SDK
 * with different parameters (buttons + messages).
 *
 * @see https://developer.paypal.com/docs/checkout/pay-later/integrate/
 */
export default function PayLaterMessage({
  amount,
  placement = "product",
}: PayLaterMessageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!amount || amount <= 0) return;

    // Load the PayPal messages-only SDK if not already present
    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = `https://www.paypal.com/sdk/js?client-id=${CLIENT_ID}&components=messages&buyer-country=US`;
      script.async = true;
      script.dataset.namespace = "paypal_messages";
      document.head.appendChild(script);
    }

    // Re-render messages when amount changes (if SDK already loaded)
    const ns = (window as Record<string, unknown>).paypal_messages as
      | { Messages?: { render?: (opts: Record<string, unknown>, sel: string) => void } }
      | undefined;
    if (ns?.Messages?.render && containerRef.current) {
      // Clear and re-render
      containerRef.current.innerHTML = "";
      ns.Messages.render(
        {
          amount,
          placement,
          style: {
            layout: "text",
            logo: { type: "inline" },
            text: { color: "black", size: 12 },
          },
        },
        `#paylater-msg-${placement}`,
      );
    }
  }, [amount, placement]);

  if (!amount || amount <= 0) return null;

  return (
    <div
      ref={containerRef}
      id={`paylater-msg-${placement}`}
      data-pp-message=""
      data-pp-style-layout="text"
      data-pp-style-logo-type="inline"
      data-pp-style-text-color="black"
      data-pp-style-text-size="12"
      data-pp-amount={amount}
      data-pp-placement={placement}
    />
  );
}
