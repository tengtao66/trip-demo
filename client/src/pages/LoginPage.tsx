import { useNavigate } from "react-router-dom";
import { User, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore, USERS, type Role } from "@/stores/auth-store";

const roles: { role: Role; icon: typeof User; accent: string; hoverBorder: string }[] = [
  { role: "customer", icon: User, accent: "text-terra-secondary", hoverBorder: "hover:border-terra-secondary" },
  { role: "merchant", icon: Building2, accent: "text-terra-accent", hoverBorder: "hover:border-terra-accent" },
];

export default function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  function handleLogin(role: Role) {
    login(USERS[role]);
    navigate(role === "customer" ? "/" : "/merchant");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-10 px-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-primary tracking-[6px]">TERRA</h1>
        <p className="mt-2 text-muted-foreground">Choose your role to continue</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        {roles.map(({ role, icon: Icon, accent, hoverBorder }) => {
          const user = USERS[role];
          return (
            <Card
              key={role}
              onClick={() => handleLogin(role)}
              className={`w-72 cursor-pointer border-border ${hoverBorder} transition-colors duration-200`}
            >
              <CardContent className="flex flex-col items-center gap-4 py-8">
                <div className={`rounded-full bg-muted p-4 ${accent}`}>
                  <Icon className="h-10 w-10" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <span
                    className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-medium ${
                      role === "customer"
                        ? "bg-terra-secondary/15 text-terra-secondary"
                        : "bg-terra-accent/15 text-terra-accent"
                    }`}
                  >
                    {role}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
