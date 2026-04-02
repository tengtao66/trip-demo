import { ArrowLeftRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";

export default function RoleSwitcher() {
  const { user, switchRole } = useAuthStore();
  const navigate = useNavigate();

  if (!user) return null;

  const isCustomer = user.role === "customer";

  function handleSwitch() {
    const newRole = isCustomer ? "merchant" : "customer";
    switchRole(newRole as "customer" | "merchant");
    navigate(newRole === "customer" ? "/" : "/merchant");
  }

  return (
    <div className="flex items-center gap-3">
      <span
        className={`rounded-full px-3 py-1 text-xs font-medium ${
          isCustomer
            ? "bg-terra-secondary/20 text-terra-secondary"
            : "bg-terra-accent/20 text-terra-accent"
        }`}
      >
        {user.role}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSwitch}
        className="text-primary-foreground hover:bg-white/10 cursor-pointer"
      >
        <ArrowLeftRight className="h-4 w-4 mr-1" />
        Switch
      </Button>
    </div>
  );
}
