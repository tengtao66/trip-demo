interface PayLaterMessageProps {
  amount: number;
}

/**
 * Static Pay Later message for product detail pages.
 * Uses a simple informational display instead of the PayPal SDK component
 * to avoid SDK conflicts with checkout pages that load the SDK with different params.
 * The real PayPalMessages component renders on CheckoutInstantPage.
 */
export default function PayLaterMessage({ amount }: PayLaterMessageProps) {
  if (!amount || amount <= 0) return null;

  const installment = (amount / 4).toFixed(2);

  return (
    <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-blue-900">
      <span className="font-bold text-blue-700 whitespace-nowrap">PayPal</span>
      <span>
        Pay in 4 interest-free payments of{" "}
        <strong>${installment}</strong>.{" "}
        <span className="text-blue-600 underline cursor-pointer">
          Learn more
        </span>
      </span>
    </div>
  );
}
