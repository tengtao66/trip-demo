import { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import RoleSwitcher from "./RoleSwitcher";

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isMerchant = user?.role === "merchant";

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const navLinks = (
    <>
      <Link to="/?tab=tour" className="hover:text-primary-foreground/80 transition-colors" onClick={() => setMobileNavOpen(false)}>
        Tours
      </Link>
      <Link to="/?tab=car_rental" className="hover:text-primary-foreground/80 transition-colors" onClick={() => setMobileNavOpen(false)}>
        Car Rentals
      </Link>
      <Link to="/?tab=cruise" className="hover:text-primary-foreground/80 transition-colors" onClick={() => setMobileNavOpen(false)}>
        Cruises
      </Link>
      <Link to="/bookings" className="hover:text-primary-foreground/80 transition-colors" onClick={() => setMobileNavOpen(false)}>
        My Bookings
      </Link>
      {isMerchant && (
        <>
          <span className="text-primary-foreground/30 hidden md:inline">|</span>
          <Link to="/merchant" className="hover:text-primary-foreground/80 transition-colors" onClick={() => setMobileNavOpen(false)}>
            Dashboard
          </Link>
          <Link to="/merchant/bookings" className="hover:text-primary-foreground/80 transition-colors" onClick={() => setMobileNavOpen(false)}>
            All Bookings
          </Link>
          <Link to="/merchant/invoices" className="hover:text-primary-foreground/80 transition-colors" onClick={() => setMobileNavOpen(false)}>
            Invoices
          </Link>
        </>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Left: Logo */}
          <Link to={isMerchant ? "/merchant" : "/"} className="text-lg font-semibold tracking-[3px]">
            MERCHANT
          </Link>

          {/* Center: Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {navLinks}
          </nav>

          {/* Right: Role switcher + logout + mobile menu toggle */}
          <div className="flex items-center gap-3">
            <RoleSwitcher />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-primary-foreground hover:bg-white/10 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden text-primary-foreground hover:bg-white/10 cursor-pointer"
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {mobileNavOpen && (
          <nav className="md:hidden border-t border-primary-foreground/10 px-6 py-4 flex flex-col gap-3 text-sm">
            {navLinks}
          </nav>
        )}
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}
