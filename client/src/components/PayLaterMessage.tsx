import {
  PayPalMessages,
  usePayPalScriptReducer,
} from "@paypal/react-paypal-js";

interface PayLaterMessageProps {
  amount: number;
  placement?: "product" | "payment" | "cart" | "home";
}

/**
 * Official PayPal Pay Later messaging component.
 * Uses PayPalMessages from react-paypal-js with the App-level
 * PayPalScriptProvider. Waits for SDK to finish loading before rendering.
 */
export default function PayLaterMessage({
  amount,
  placement = "product",
}: PayLaterMessageProps) {
  const [{ isResolved }] = usePayPalScriptReducer();

  if (!amount || amount <= 0 || !isResolved) return null;

  return (
    <PayPalMessages
      amount={amount}
      placement={placement}
      style={{
        layout: "text",
        logo: { type: "inline" },
        text: { color: "black", size: "12" },
      }}
    />
  );
}
