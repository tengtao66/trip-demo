import { Link, Outlet, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import RoleSwitcher from "./RoleSwitcher";

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const isMerchant = user?.role === "merchant";

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Left: Logo */}
          <Link to={isMerchant ? "/merchant" : "/"} className="text-lg font-semibold tracking-[3px]">
            TERRA
          </Link>

          {/* Center: Nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link to="/?tab=tour" className="hover:text-primary-foreground/80 transition-colors">
              Tours
            </Link>
            <Link to="/?tab=car_rental" className="hover:text-primary-foreground/80 transition-colors">
              Car Rentals
            </Link>
            <Link to="/?tab=cruise" className="hover:text-primary-foreground/80 transition-colors">
              Cruises
            </Link>
            <Link to="/bookings" className="hover:text-primary-foreground/80 transition-colors">
              My Bookings
            </Link>
            {isMerchant && (
              <>
                <span className="text-primary-foreground/30">|</span>
                <Link to="/merchant" className="hover:text-primary-foreground/80 transition-colors">
                  Dashboard
                </Link>
                <Link to="/merchant/bookings" className="hover:text-primary-foreground/80 transition-colors">
                  All Bookings
                </Link>
                <Link to="/merchant/invoices" className="hover:text-primary-foreground/80 transition-colors">
                  Invoices
                </Link>
              </>
            )}
          </nav>

          {/* Right: Role switcher + logout */}
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
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
