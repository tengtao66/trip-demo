# Section 2: Auth & Layout Shell

> Prereq: Section 1 complete — monorepo running, Tailwind v4 + shadcn/ui installed, Express + SQLite seeded.

---

## Step 2.1 — Tailwind v4 Earth-Tone Theme Tokens (3 min)

**File:** `client/src/app.css`

Add TERRA color tokens to the existing `@theme` block (Tailwind v4 uses CSS-native theming, not `tailwind.config`):

```css
@theme {
  --color-primary: #5C3D2E;       /* Mocha */
  --color-accent: #A0522D;        /* Terracotta */
  --color-secondary: #86A873;     /* Sage */
  --color-background: #FAF6F1;    /* Alpine Oat */
  --color-card: #FFFDF9;          /* Ivory */
  --color-border: #E8DFD4;        /* Warm grey */
  --color-text: #3D2B1F;          /* Dark mocha */
  --color-text-muted: #8B7355;    /* Warm grey */
  --color-text-light: #C4956A;    /* Light mocha */
  --color-warning: #D4A054;       /* Warm amber */
  --color-destructive: #DC2626;   /* Red */
  --color-surface-highlight: #F5EDE3;
  --color-surface-muted: #F0EBE3;
}
```

Update `<body>` class in `client/index.html`: `class="bg-background text-text font-sans"`.

**Verify:** `npm run dev --workspace=client` — page loads with Alpine Oat background. Inspect any `bg-primary` element to confirm `#5C3D2E`.

---

## Step 2.2 — Zustand Auth Store (3 min)

**File:** `client/src/stores/auth-store.ts`

```ts
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
  merchant: { email: "merchant@terra.demo", name: "TERRA Tours", role: "merchant" },
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
```

**Verify:** Import in `App.tsx`, call `useAuthStore.getState()` in console — confirm localStorage key `terra-auth`.

---

## Step 2.3 — Client `authFetch` Helper (2 min)

**File:** `client/src/lib/auth-fetch.ts`

```ts
import { useAuthStore } from "@/stores/auth-store";

export async function authFetch(url: string, init?: RequestInit): Promise<Response> {
  const user = useAuthStore.getState().user;
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (user) {
    headers.set("X-User-Role", user.role);
    headers.set("X-User-Email", user.email);
  }
  return fetch(url, { ...init, headers });
}
```

---

## Step 2.4 — Server Mock Auth Middleware (2 min)

**File:** `server/src/middleware/auth.ts`

```ts
import type { Request, Response, NextFunction } from "express";

export interface AuthLocals {
  userRole: "customer" | "merchant" | null;
  userEmail: string | null;
}

export function mockAuth(req: Request, res: Response, next: NextFunction) {
  const role = req.headers["x-user-role"] as string | undefined;
  const email = req.headers["x-user-email"] as string | undefined;
  res.locals.userRole = role === "customer" || role === "merchant" ? role : null;
  res.locals.userEmail = email ?? null;
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(res.locals.userRole)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
```

Register in `server/src/index.ts`: `app.use(mockAuth);`

**Verify:** `curl -H "X-User-Role: merchant" http://localhost:3001/api/health` — 200 OK.

---

## Step 2.5 — Login Page (4 min)

**File:** `client/src/pages/LoginPage.tsx`

Two clickable cards (customer / merchant). Each card shows avatar icon, name, email, and role label. On click, calls `login(USERS[role])` then navigates to `/` (customer) or `/merchant` (merchant).

Use `Card` from shadcn/ui. Style: `bg-card border-border hover:border-accent` transition. Page background uses full-screen centered layout with TERRA logo above the cards.

**Verify:** Click customer card — redirects to `/`, localStorage has `terra-auth`. Click merchant card — redirects to `/merchant`.

---

## Step 2.6 — Layout Component (Header + Nav) (5 min)

**File:** `client/src/components/layout/Layout.tsx`

Shared layout wrapping all authenticated routes:

- **Header:** `bg-primary text-white` bar. Left: TERRA logo text (`font-semibold text-lg`). Center: nav links (Home, My Bookings; plus Dashboard, All Bookings if merchant). Right: role badge (`bg-accent/20 text-accent` for merchant, `bg-secondary/20 text-secondary` for customer) + role-switch button (swap icon from Lucide) + logout button.
- **Main:** `<Outlet />` with `max-w-7xl mx-auto px-4 py-8`.

**File:** `client/src/components/layout/RoleSwitcher.tsx`

Dropdown or toggle. Calls `switchRole()` from auth store. Shows current role with colored badge.

**Verify:** Log in as customer — header shows "Customer" badge in sage green. Click role switcher — badge changes to "Merchant" in terracotta. Nav links update.

---

## Step 2.7 — React Router v7 + Route Protection (4 min)

**File:** `client/src/App.tsx`

```tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import { Layout } from "@/components/layout/Layout";
import { LoginPage } from "@/pages/LoginPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function MerchantRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "customer") return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<HomePage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/bookings/:id" element={<BookingDetailPage />} />
          <Route path="/trips/:slug" element={<TripDetailPage />} />
          <Route path="/checkout/:slug" element={<CheckoutPage />} />
          {/* Merchant routes */}
          <Route path="/merchant" element={<MerchantRoute><DashboardPage /></MerchantRoute>} />
          <Route path="/merchant/*" element={<MerchantRoute><MerchantRoutes /></MerchantRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

Create placeholder pages (`client/src/pages/HomePage.tsx`, etc.) returning `<div>Page name</div>` so routes compile.

**Verify:** As customer, navigate to `/merchant` — redirects to `/`. As merchant, `/merchant` renders. Logged out, any route redirects to `/login`.

---

## Step 2.8 — Commit Checkpoint

```bash
git add -A && git commit -m "feat(section-2): auth store, layout shell, route protection, earth-tone theme"
```

Confirm: `npm run dev` starts both workspaces, login → role switch → route protection all work, theme tokens render correctly.
