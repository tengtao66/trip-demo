import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import Layout from "@/components/layout/Layout";
import LoginPage from "@/pages/LoginPage";
import HomePage from "@/pages/HomePage";
import TripDetailPage from "@/pages/TripDetailPage";
import CheckoutPage from "@/pages/CheckoutPage";
import BookingsPage from "@/pages/BookingsPage";
import BookingDetailPage from "@/pages/BookingDetailPage";
import DashboardPage from "@/pages/merchant/DashboardPage";
import MerchantBookingsPage from "@/pages/merchant/MerchantBookingsPage";
import MerchantBookingDetailPage from "@/pages/merchant/MerchantBookingDetailPage";
import InvoicesPage from "@/pages/merchant/InvoicesPage";
import InvoiceDetailPage from "@/pages/merchant/InvoiceDetailPage";
import CreateInvoicePage from "@/pages/merchant/CreateInvoicePage";
import TripRequestsPage from "@/pages/merchant/TripRequestsPage";
import TripRequestDetailPage from "@/pages/merchant/TripRequestDetailPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function MerchantRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "merchant") return <Navigate to="/" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes with shared layout */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<HomePage />} />
          <Route path="/trips/:slug" element={<TripDetailPage />} />
          <Route path="/checkout/:slug" element={<CheckoutPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/bookings/:id" element={<BookingDetailPage />} />
        </Route>

        {/* Merchant-only routes with shared layout */}
        <Route
          element={
            <MerchantRoute>
              <Layout />
            </MerchantRoute>
          }
        >
          <Route path="/merchant" element={<DashboardPage />} />
          <Route path="/merchant/bookings" element={<MerchantBookingsPage />} />
          <Route path="/merchant/bookings/:id" element={<MerchantBookingDetailPage />} />
          <Route path="/merchant/invoices" element={<InvoicesPage />} />
          <Route path="/merchant/invoices/create" element={<CreateInvoicePage />} />
          <Route path="/merchant/invoices/:id" element={<InvoiceDetailPage />} />
          <Route path="/merchant/trip-requests" element={<TripRequestsPage />} />
          <Route path="/merchant/trip-requests/:id" element={<TripRequestDetailPage />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
