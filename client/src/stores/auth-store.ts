import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "customer" | "merchant";
export interface User {
  email: string;
  name: string;
  role: Role;
}

interface AuthState {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  switchRole: (role: Role) => void;
}

const USERS: Record<Role, User> = {
  customer: { email: "customer@terra.demo", name: "Alex Rivera", role: "customer" },
  merchant: { email: "merchant@terra.demo", name: "Terra Travel Co.", role: "merchant" },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
      switchRole: (role) => set({ user: USERS[role] }),
    }),
    { name: "terra-auth" }
  )
);

export { USERS };
