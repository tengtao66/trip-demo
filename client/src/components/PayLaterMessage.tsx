import { PayPalScriptProvider, PayPalMessages } from "@paypal/react-paypal-js";

interface PayLaterMessageProps {
  amount: number;
  placement?: "product" | "payment" | "cart" | "home";
}

const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID as string;

export default function PayLaterMessage({
  amount,
  placement = "product",
}: PayLaterMessageProps) {
  if (!amount || amount <= 0) return null;
  return (
    <PayPalScriptProvider
      options={{
        clientId,
        currency: "USD",
        components: "messages",
        buyerCountry: "US",
      }}
    >
      <PayPalMessages
        style={{
          layout: "text",
          logo: { type: "inline" },
          text: { color: "black", size: "12" },
        }}
        amount={amount}
        placement={placement}
      />
    </PayPalScriptProvider>
  );
}
