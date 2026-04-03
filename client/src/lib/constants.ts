export const tripImages: Record<string, string> = {
  "tokyo-cherry-blossom": "/tokyo.webp",
  "bali-adventure": "/bali2.webp",
  "custom-european-tour": "/euro2.jpg",
  "economy-sedan": "/car-rental-car.webp",
  "suv-rental": "/car-rental-suv.webp",
  "luxury-convertible": "/car-rental-luxury.jpg",
  "caribbean-cruise": "/cruises-caribbean.webp",
  "mediterranean-cruise": "/cruises-mediterranean.webp",
  "alaska-cruise": "/cruise-alaska.webp",
};

export const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  REQUEST_SUBMITTED: {
    label: "Request Submitted",
    className: "bg-purple-100 text-purple-800",
  },
  INVOICE_CREATED: {
    label: "Invoice Created",
    className: "bg-blue-100 text-blue-800",
  },
  AWAITING_DEPOSIT: {
    label: "Awaiting Deposit",
    className: "bg-amber-100 text-amber-800",
  },
  DEPOSIT_RECEIVED: {
    label: "Deposit Received",
    className: "bg-blue-100 text-blue-800",
  },
  FULLY_PAID: {
    label: "Fully Paid",
    className: "bg-green-100 text-green-800",
  },
  DEPOSIT_AUTHORIZED: {
    label: "Authorized",
    className: "bg-amber-100 text-amber-800",
  },
  DEPOSIT_CAPTURED: {
    label: "Deposit Paid",
    className: "bg-amber-100 text-amber-800",
  },
  FULLY_CAPTURED: {
    label: "Fully Paid",
    className: "bg-green-100 text-green-800",
  },
  CONFIRMED: {
    label: "Confirmed",
    className: "bg-green-100 text-green-800",
  },
  ACTIVE: {
    label: "Active",
    className: "bg-blue-100 text-blue-800",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-blue-100 text-blue-800",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-green-100 text-green-800",
  },
  SETUP_FEE_PAID: {
    label: "Active",
    className: "bg-blue-100 text-blue-800",
  },
  INVOICE_SENT: {
    label: "Invoice Sent",
    className: "bg-purple-100 text-purple-800",
  },
  INVOICE_PAID: {
    label: "Invoice Paid",
    className: "bg-green-100 text-green-800",
  },
  VOIDED: {
    label: "Cancelled",
    className: "bg-red-100 text-red-800",
  },
};
