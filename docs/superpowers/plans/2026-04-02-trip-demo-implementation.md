# TERRA Trip Demo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a tour booking demo showcasing three PayPal payment flows (authorize/capture, vaulting, invoice) with a merchant dashboard and earth-tone UI.

**Architecture:** Monorepo (client/ + server/) with React 19 frontend and Express v5 backend. PayPal JS SDK v5 via react-paypal-js v8.x for client-side payment buttons. SQLite via better-sqlite3 for persistence. Mock auth with customer/merchant role switching.

**Tech Stack:** React 19, Vite, Tailwind CSS v4, shadcn/ui, Zustand, React Router v7, Express v5, TypeScript, better-sqlite3, @paypal/react-paypal-js v8.x, @paypal/paypal-server-sdk, Recharts, Lucide React

**Spec:** `docs/superpowers/specs/2026-04-02-trip-demo-design.md`

**Section files:** Individual expanded sections are in `docs/superpowers/plans/sections/`

---

# Section 1: Project Scaffolding & Infrastructure

> Estimated time: 30-40 minutes | 8 steps | Commit after step 8

## Step 1.1 — Initialize monorepo root

Create `trip-demo/package.json` with npm workspaces:

```json
{
  "name": "terra-trip-demo",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["client", "server"],
  "scripts": {
    "dev": "concurrently -n client,server -c blue,green \"npm run dev -w client\" \"npm run dev -w server\"",
    "build": "npm run build -w client && npm run build -w server",
    "test": "npm run test -w client && npm run test -w server"
  },
  "devDependencies": {
    "concurrently": "^9.1.2"
  }
}
```

Create `client/` and `server/` directories. Run `mkdir -p trip-demo/{client,server}`.

## Step 1.2 — Scaffold client workspace

Create `client/package.json` with `"type": "module"`. Dependencies:

**dependencies:** `react`, `react-dom` (^19), `react-router-dom` (^7), `zustand` (^5), `@paypal/react-paypal-js` (^8), `tailwindcss` (^4), `@tailwindcss/vite` (^4), `lucide-react` (^0.500), `recharts` (^2), `class-variance-authority` (^0.7), `clsx` (^2.1), `tailwind-merge` (^3), `tw-animate-css` (^1), `radix-ui` (^1.4), `shadcn` (^4), `zod` (^4)

**devDependencies:** `@types/react`, `@types/react-dom` (^19), `@vitejs/plugin-react` (^6), `typescript` (~5.9), `vite` (^8), `vitest` (^4)

Scripts: `dev` → `vite`, `build` → `tsc -b && vite build`, `test` → `vitest run`

Create `client/tsconfig.json` and `client/tsconfig.app.json` (standard Vite React setup with `@` path alias).

Create `client/index.html` with root div mount point.

## Step 1.3 — Configure Vite with proxy + Tailwind v4

Create `client/vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  envDir: "..",
  server: {
    proxy: {
      "/api": { target: "http://localhost:3001", changeOrigin: true },
    },
  },
});
```

Create `client/src/index.css` with `@import "tailwindcss";` and `@theme` block containing all TERRA color tokens from the spec (primary, accent, secondary, background, card, border, text, text-muted, text-light, warning, destructive, surface-highlight, surface-muted). Set `--font-sans: "Inter", sans-serif;`.

Create minimal `client/src/main.tsx` (renders `<App />`) and `client/src/App.tsx` (returns `<h1>TERRA</h1>`).

**Verify:** `npm run dev -w client` starts on port 5173 with no errors.

## Step 1.4 — Initialize shadcn/ui

Run from `client/`: `npx shadcn@latest init -d` (New York style, neutral base, CSS variables enabled).

Create `client/src/lib/utils.ts` with `cn()` helper (clsx + tailwind-merge).

Install first component to verify: `npx shadcn@latest add button`.

## Step 1.5 — Scaffold server workspace

Create `server/package.json` with `"type": "module"`. Dependencies:

**dependencies:** `express` (^5.1), `@paypal/paypal-server-sdk` (^2), `better-sqlite3` (^12), `cors` (^2.8)

**devDependencies:** `tsx` (^4.19), `typescript` (~5.9), `vitest` (^4), `supertest` (^7), `@types/express` (^5), `@types/cors` (^2.8), `@types/better-sqlite3` (^7)

Scripts: `dev` → `tsx watch --env-file=../.env src/index.ts`, `build` → `tsc`, `test` → `vitest run`

Create `server/tsconfig.json` (target ES2022, module NodeNext, outDir dist, rootDir src, strict true).

Create `server/src/index.ts`:

```ts
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`TERRA server running on :${PORT}`));
```

**Verify:** `npm run dev -w server` starts on port 3001, `curl localhost:3001/api/health` returns `{"status":"ok"}`.

## Step 1.6 — SQLite schema

Create `server/src/db/schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('customer','merchant'))
);

CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  base_price REAL NOT NULL,
  deposit_amount REAL NOT NULL,
  payment_flow TEXT NOT NULL CHECK(payment_flow IN ('authorize','vault','invoice')),
  itinerary TEXT NOT NULL,
  image_gradient TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  booking_reference TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  trip_id TEXT NOT NULL REFERENCES trips(id),
  status TEXT NOT NULL,
  payment_flow TEXT NOT NULL,
  total_amount REAL NOT NULL,
  paid_amount REAL NOT NULL DEFAULT 0,
  paypal_order_id TEXT,
  authorization_id TEXT,
  authorization_expires_at TEXT,
  vault_token_id TEXT,
  invoice_id TEXT,
  invoice_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS booking_charges (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(id),
  type TEXT NOT NULL CHECK(type IN ('deposit','balance','addon','setup_fee','final')),
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  paypal_capture_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','completed','failed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS trip_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  email TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  destinations TEXT NOT NULL,
  activities TEXT NOT NULL,
  notes TEXT,
  total_estimate REAL NOT NULL,
  deposit_amount REAL NOT NULL,
  balance_amount REAL NOT NULL,
  booking_id TEXT REFERENCES bookings(id),
  status TEXT NOT NULL DEFAULT 'REQUEST_SUBMITTED',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

Create `server/src/services/db.ts`:

```ts
import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, "..", "..", "terra.db");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Run schema
const schema = readFileSync(join(__dirname, "..", "db", "schema.sql"), "utf-8");
db.exec(schema);

export default db;
```

Import db in `server/src/index.ts` to initialize on startup.

## Step 1.7 — Seed data

Create `server/src/db/seed.sql`:

```sql
INSERT OR IGNORE INTO users (id, email, name, role) VALUES
  ('u-customer-01', 'customer@terra.demo', 'Alex Rivera', 'customer'),
  ('u-merchant-01', 'merchant@terra.demo', 'Terra Travel Co.', 'merchant');

INSERT OR IGNORE INTO trips (id, slug, name, description, duration_days, base_price, deposit_amount, payment_flow, itinerary, image_gradient) VALUES
  ('t-tokyo-01', 'tokyo-cherry-blossom', 'Tokyo Cherry Blossom Express', 'Cherry blossom season in Tokyo. Temples, parks, tea ceremonies.', 3, 800, 200, 'authorize',
   '[{"day":1,"title":"Arrival & Shinjuku Gyoen","details":"Welcome dinner, cherry blossom walks"},{"day":2,"title":"Ueno Park & Senso-ji","details":"Tea ceremony, temple visit"},{"day":3,"title":"Chidorigafuchi & Departure","details":"Imperial Palace gardens"}]',
   'linear-gradient(135deg, #FFB7C5 0%, #FF69B4 100%)'),
  ('t-bali-01', 'bali-adventure', 'Bali Adventure Retreat', 'Multi-day adventure in Bali. Surfing, temples, rice terraces, spa.', 7, 2500, 500, 'vault',
   '[{"day":1,"title":"Arrival & Seminyak Beach","details":"Check-in, sunset beach"},{"day":2,"title":"Ubud Rice Terraces","details":"Tegallalang, monkey forest"},{"day":3,"title":"Temple Tour","details":"Tanah Lot, Uluwatu"},{"day":4,"title":"Optional Activities","details":"Spa, diving, cooking"},{"day":5,"title":"Optional Activities","details":"Volcano trek, surfing"},{"day":6,"title":"Beach Day","details":"Nusa Dua relaxation"},{"day":7,"title":"Departure","details":"Transfer to airport"}]',
   'linear-gradient(135deg, #87CEEB 0%, #2E8B57 100%)'),
  ('t-europe-01', 'custom-european-tour', 'Custom European Grand Tour', 'Design your dream European itinerary.', 14, 10000, 2500, 'invoice',
   '[]',
   'linear-gradient(135deg, #DAA520 0%, #8B4513 100%)');
```

Add seed execution in `db.ts` after schema (check if users table is empty first to avoid re-seeding).

**Verify:** Start server, confirm `terra.db` is created. Run: `sqlite3 server/terra.db "SELECT slug, payment_flow FROM trips;"` — should return 3 rows.

## Step 1.8 — Environment template + full dev verify

Create `.env` at monorepo root:

```env
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret
NODE_ENV=development
PORT=3001
```

Add `.env` to `.gitignore` (also include `node_modules`, `dist`, `*.db`).

**Install all deps:** `npm install` (from monorepo root — installs both workspaces + concurrently).

**Final verification:** `npm run dev` from root. Confirm:
1. Server starts on :3001, health endpoint responds
2. Client starts on :5173, renders "TERRA" heading
3. Client proxy works: open `http://localhost:5173/api/health` in browser returns JSON

**Commit:** `feat: scaffold TERRA monorepo with Vite, Express v5, SQLite schema and seed data`

---

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

---

# Section 3: Trip Listing & Detail Pages

## 3.1 Trip Data Types

Create shared types used by both client and server.

**File:** `server/src/types/trip.ts`

```ts
export interface Trip {
  id: string;
  slug: string;
  name: string;
  description: string;
  duration_days: number;
  base_price: number;
  deposit_amount: number;
  payment_flow: 'authorize' | 'vault' | 'invoice';
  itinerary: ItineraryDay[];
  image_gradient: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
}
```

Mirror these types on the client at `client/src/types/trip.ts` (copy or symlink via workspace).

## 3.2 Server Endpoints

**File:** `server/src/routes/trips.ts`

### GET /api/trips

Returns all trips from SQLite. Query selects all columns, parses `itinerary` from JSON string.

```ts
router.get('/trips', (req, res) => {
  const trips = db.prepare('SELECT * FROM trips').all();
  res.json(trips.map(t => ({ ...t, itinerary: JSON.parse(t.itinerary) })));
});
```

### GET /api/trips/:slug

Returns a single trip by slug. Returns 404 if not found.

```ts
router.get('/trips/:slug', (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE slug = ?').get(req.params.slug);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  res.json({ ...trip, itinerary: JSON.parse(trip.itinerary) });
});
```

Register in `server/src/index.ts`:

```ts
import tripsRouter from './routes/trips';
app.use('/api', tripsRouter);
```

**Test:** `curl http://localhost:3001/api/trips` returns 3 trips. `curl http://localhost:3001/api/trips/tokyo-cherry-blossom` returns the Tokyo trip. `curl http://localhost:3001/api/trips/nonexistent` returns 404.

## 3.3 Client API Helper

**File:** `client/src/lib/api.ts`

```ts
export async function fetchTrips(): Promise<Trip[]> {
  const res = await fetch('/api/trips');
  return res.json();
}

export async function fetchTrip(slug: string): Promise<Trip> {
  const res = await fetch(`/api/trips/${slug}`);
  if (!res.ok) throw new Error('Trip not found');
  return res.json();
}
```

## 3.4 TripCard Component

**File:** `client/src/components/trips/TripCard.tsx`

Visual requirements:
- **Image area:** Top 60% of card. Use `image_gradient` as CSS `background` (gradient placeholder). Rounded top corners.
- **Duration badge:** Top-right corner, pill shape, `bg-surface-muted text-text-muted`, e.g. "3 days" using `Clock` icon from Lucide.
- **Payment flow badge:** Top-left corner, color-coded pill: authorize = mocha (`primary`), vault = terracotta (`accent`), invoice = sage (`secondary`). Text: "Reserve Now" / "Add-ons" / "Invoice".
- **Card body:** Trip name (Inter 600), description truncated to 2 lines, price displayed as "From $800" in `accent` color.
- **Card surface:** `bg-card` with `border-border`, rounded-lg, hover shadow transition.
- **Entire card is a `<Link to={/trips/${slug}}>` wrapper.**

## 3.5 Home Page

**File:** `client/src/pages/HomePage.tsx`

### Hero Section

- Full-width section, `bg-primary` (mocha), `text-white`, py-16.
- Headline: "Explore the World with TERRA" (Inter 600, text-4xl).
- Subheadline: "Curated guided tours with flexible payment options" (text-lg, text-light opacity).
- No CTA button in hero — trips grid serves as the call to action.

### Trip Card Grid

- Fetch trips via `fetchTrips()` in a `useEffect` (or React Router loader).
- 3-column grid on desktop (`grid-cols-3`), 1-column on mobile. Gap-6, max-w-6xl, mx-auto, px-6 py-12.
- Section heading above grid: "Featured Tours" (Inter 600, text-2xl, `text-primary`).
- Loading state: 3 skeleton cards (shadcn `Skeleton`).

## 3.6 TripDetail Page

**File:** `client/src/pages/TripDetailPage.tsx`

**Route:** `/trips/:slug` — uses `useParams` to extract slug, calls `fetchTrip(slug)`.

### Hero Banner

- Full-width, 300px height, `image_gradient` as background.
- Overlay with trip name (text-3xl, white, font-semibold) and duration badge.

### Two-Column Layout (below hero)

**Left column (2/3 width):**

- **Description** paragraph in `text-text`.
- **Itinerary Timeline:** Vertical timeline using a left-border line. Each day renders:
  - Day number circle (bg-accent, text-white, w-8 h-8, rounded-full).
  - Title (font-semibold) + description.
  - Connected by a 2px `border-border` vertical line.
- Use `MapPin` icon from Lucide for each day marker.

**Right column (1/3 width) — Pricing Sidebar:**

- Sticky card (`sticky top-24`), `bg-card`, `border-border`, rounded-lg, p-6.
- Price breakdown varies by `payment_flow`:
  - **authorize:** "Total: $800" then "Deposit now: $200" + "Balance due later: $600".
  - **vault:** "Setup fee: $500" then "Add-ons charged during trip".
  - **invoice:** "Starting from $5,000" then "Custom quote via invoice".
- **Book Now button:** Full-width, `bg-accent hover:bg-accent/90`, text-white, rounded-md. Links to `/checkout/${slug}`.
  - For invoice flow, button text is "Request Custom Trip" and links to the request form within the detail page or `/checkout/${slug}`.

### 404 Handling

If `fetchTrip` throws, render a "Trip not found" message with a link back to Home.

## 3.7 Navigation Wiring

**File:** `client/src/App.tsx` (update existing router config)

```tsx
<Route path="/" element={<HomePage />} />
<Route path="/trips/:slug" element={<TripDetailPage />} />
<Route path="/checkout/:slug" element={<CheckoutPage />} />
```

Flow: Home (`/`) click TripCard -> TripDetail (`/trips/:slug`) click Book Now -> Checkout (`/checkout/:slug`).

Add breadcrumb-style back navigation on TripDetail: "< Back to tours" link at top, navigates to `/`.

**Commit:** `feat: add trip listing and detail pages with server endpoints`

---

# Section 4: Flow 1 — Authorize & Capture (Tokyo Cherry Blossom)

## 4.1 Checkout Page with PayPalScriptProvider

**File:** `client/src/pages/CheckoutPage.tsx`

Render `PayPalScriptProvider` with `intent: "authorize"` wrapping `PayPalButtons`. The provider options come from the trip's `payment_flow` field so Flow 2 pages can use different options.

```tsx
<PayPalScriptProvider options={{
  clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
  intent: "authorize",
  currency: "USD",
}}>
  <PayPalButtons createOrder={createOrder} onApprove={onApprove} />
</PayPalScriptProvider>
```

**Checkout UI** shows a two-column layout: left side has trip summary (image, name, dates), right side has the pricing breakdown card:

| Line item | Amount |
|-----------|--------|
| Tokyo Cherry Blossom Express (3 days) | $800.00 |
| Deposit due today | -$200.00 |
| **Balance due within 30 days** | **$600.00** |
| **You pay now** | **$200.00** |

Below the breakdown, render the `PayPalButtons` component. On error, show an inline alert banner (not a modal).

## 4.2 Server: Create Order

**File:** `server/src/routes/orders.ts`

`POST /api/orders/create` — Looks up trip by slug from the request body, calculates the total server-side (never trusts client amounts), and creates a PayPal order with `intent: "AUTHORIZE"`.

```ts
const order = await ordersController.createOrder({
  body: {
    intent: "AUTHORIZE",
    purchaseUnits: [{
      amount: { currencyCode: "USD", value: "800.00" },
      description: "Tokyo Cherry Blossom Express — 3-day tour",
    }],
  },
});
return res.json({ id: order.result.id });
```

The `createOrder` callback on the client returns this order ID to the PayPal SDK.

## 4.3 Server: Authorize + Partial Capture Deposit

**File:** `server/src/routes/orders.ts`

`POST /api/orders/:orderId/authorize` — Called from `onApprove`. Authorizes the full $800, extracts the `authorization_id`, then immediately partial-captures the $200 deposit (`final_capture: false`).

```ts
// Step 1: Authorize the order
const authResponse = await ordersController.authorizeOrder({ id: orderId });
const authId = authResponse.result.purchaseUnits[0]
  .payments.authorizations[0].id;

// Step 2: Partial capture $200 deposit
const captureResponse = await paymentsController.captureAuthorization({
  authorizationId: authId,
  body: {
    amount: { currencyCode: "USD", value: "200.00" },
    finalCapture: false,
  },
});
```

After both succeed, insert into SQLite:
- `bookings` row: status `DEPOSIT_CAPTURED`, `authorization_id`, `authorization_expires_at` (29 days from now), `booking_reference` (e.g., `TERRA-A1B2`)
- `booking_charges` row: type `deposit`, amount 200, status `completed`, `paypal_capture_id`

If the partial capture fails, save with status `DEPOSIT_AUTHORIZED` so the merchant can retry.

Return `{ bookingReference, status, authorizationId, depositCaptureId }` to the client.

## 4.4 Server: Capture Balance

**File:** `server/src/routes/orders.ts`

`POST /api/payments/authorizations/:authId/capture` — Merchant action from the dashboard. Captures the remaining $600 with `final_capture: true`.

```ts
const capture = await paymentsController.captureAuthorization({
  authorizationId: authId,
  body: {
    amount: { currencyCode: "USD", value: "600.00" },
    finalCapture: true,
  },
});
```

Update booking status to `FULLY_CAPTURED`, insert a `booking_charges` row with type `balance`, and set `paid_amount = 800`.

## 4.5 Server: Void Authorization

**File:** `server/src/routes/orders.ts`

`POST /api/payments/authorizations/:authId/void` — Merchant cancels the booking before capturing balance.

```ts
await paymentsController.voidAuthorization({ authorizationId: authId });
```

Update booking status to `VOIDED`. No refund of the deposit capture is performed (captures cannot be voided; a separate refund endpoint would be needed for production).

## 4.6 Client: onApprove and Confirmation

**File:** `client/src/pages/CheckoutPage.tsx`

`onApprove` calls the authorize endpoint, then navigates to the confirmation page:

```tsx
const onApprove = async (data: OnApproveData) => {
  const res = await authFetch(`/api/orders/${data.orderID}/authorize`, { method: "POST" });
  const booking = await res.json();
  navigate(`/bookings/${booking.bookingReference}`);
};
```

**File:** `client/src/pages/BookingConfirmationPage.tsx`

Shows a success state with check icon, booking reference, payment summary (deposit paid, balance pending), and authorization expiration date. Link to "View My Bookings".

## 4.7 Booking Status Model

| Status | Meaning | Transition trigger |
|--------|---------|-------------------|
| `DEPOSIT_AUTHORIZED` | Auth succeeded, partial capture failed | Retry capture or void |
| `DEPOSIT_CAPTURED` | $200 deposit captured, $600 balance pending | Merchant captures balance |
| `FULLY_CAPTURED` | Full $800 captured | Terminal state |
| `VOIDED` | Authorization voided by merchant | Terminal state |
| `EXPIRED` | Authorization expired (29 days) | Background check or manual |

## 4.8 Customer Bookings Pages

**File:** `client/src/pages/BookingsPage.tsx`

`/bookings` — Lists the customer's bookings. Each row shows: booking reference, trip name, status badge (color-coded), amount paid / total, date. Click navigates to detail.

**File:** `client/src/pages/BookingDetailPage.tsx`

`/bookings/:id` — Shows full booking detail: trip info, payment breakdown (deposit captured amount, balance pending/captured), transaction history (list of `booking_charges`), and status timeline. For `DEPOSIT_CAPTURED` status, shows "Balance of $600 will be captured by merchant within 30 days".

**Server routes** (`server/src/routes/bookings.ts`):
- `GET /api/bookings` — Returns bookings for the current user (filtered by `X-User-Role` header)
- `GET /api/bookings/:id` — Returns booking detail with associated charges

## 4.8b Merchant Booking Detail — Authorize Flow

**File:** `client/src/pages/merchant/AuthorizeBookingDetailPage.tsx`

Route: `/merchant/bookings/:id` (when `payment_flow === 'authorize'`). Two-column layout:

**Left column:**
- Customer card (name, email, booking/trip dates)
- **Authorization Status card** with amber border:
  - Two metric boxes side by side: "Authorized Amount" ($800) and "Remaining to Capture" ($600)
  - Authorization ID + PayPal Order ID (monospace, truncated)
  - Created/Expires dates
  - **Countdown timer component** — calculates days:hours:mins from `authorization_expires_at`. Use `setInterval` every 60s to update.
  - Honor period indicator: green "Within 3-day honor period ✓" when `daysLeft >= 26`, amber warning when `daysLeft < 26 && daysLeft > 0`, red "HONOR PERIOD EXPIRED" when honor period passed
- Action buttons (conditional rendering):
  - `DEPOSIT_CAPTURED`: "Capture Balance ($600)" primary + "Void" destructive
  - Honor period expired: "Reauthorize ($600)" amber + "Try Capture Anyway" outline + "Void" destructive
  - `FULLY_CAPTURED`: No buttons, green success state

**Right column:**
- **Two-phase payment timeline:**
  - Phase 1 (BOOKING) — green header, grouped card containing: "Full Amount Authorized $800 AUTHORIZED" + "Deposit Captured (Partial) $200 CAPTURED" with `final_capture=false` label
  - Phase 2 (SETTLEMENT) — amber header, dashed border card: "Balance Capture $600 PENDING" with "Must capture before {expiry date}"
- **"How it Works" explainer card** — 4 numbered steps explaining the authorize & capture flow for demo audience:
  1. Customer approves full amount — funds held, not charged
  2. Merchant immediately captures deposit as partial capture
  3. Merchant verifies trip details
  4. Merchant captures remaining balance within 29-day window

**Three visual state variants:**
- `DEPOSIT_CAPTURED` — Amber auth card with countdown, capture button active
- Honor period expired — Red border on auth card, warning message, "Reauthorize" button
- `FULLY_CAPTURED` — Green success card with deposit + balance = total breakdown and capture dates

**Server change:** `GET /api/bookings/:id` response must include `authorization_expires_at` and `authorization_id` fields for the countdown timer.

> **Mockup:** See `docs/ui/booking-detail-authorize.html`

## 4.9 Commit Checkpoint

After completing and verifying all tasks in this section:

```bash
git add client/src/pages/CheckoutPage.tsx \
       client/src/pages/BookingConfirmationPage.tsx \
       client/src/pages/BookingsPage.tsx \
       client/src/pages/BookingDetailPage.tsx \
       server/src/routes/orders.ts \
       server/src/routes/bookings.ts
git commit -m "feat: implement Flow 1 authorize & capture (Tokyo Cherry Blossom)"
```

---

# Section 5: Flow 2 — Vaulting (Bali Adventure Retreat)

> Vault-with-purchase, merchant-initiated subsequent charges, vault deletion, and the booking detail timeline view.

**Booking statuses:** `ACTIVE` (setup fee captured) -> `IN_PROGRESS` (add-on charges started) -> `COMPLETED` (final settlement + vault deleted)

---

## Task 5.1 — Checkout Page for Flow 2

**File:** `client/src/pages/CheckoutVaultPage.tsx`

Render `PayPalScriptProvider` with vault-specific options and the checkout UI.

```tsx
<PayPalScriptProvider options={{
  clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
  intent: "capture",
  vault: true,
  currency: "USD",
}}>
  <PayPalButtons createOrder={createOrder} onApprove={onApprove} />
</PayPalScriptProvider>
```

**UI elements:**
- Trip summary card (Bali Adventure Retreat, 7 days)
- Pricing breakdown: Setup Fee $500 (charged now), Base Price $2,500 (total), add-on info text explaining merchant-initiated charges during trip
- PayPal Buttons rendered below the breakdown
- On approve: call `POST /api/orders/:orderId/capture`, redirect to `/bookings/:id`

**Route:** Register `/checkout/bali-adventure` in `App.tsx` pointing to this page.

---

## Task 5.2 — Server: Create Order with Vault Attributes

**File:** `server/src/routes/orders.ts` (extend existing route)

Add vault-aware logic to `POST /api/orders/create`. When the trip's `payment_flow === 'vault'`, build the order body with vault attributes:

```ts
const orderBody = {
  intent: "CAPTURE",
  purchase_units: [{
    amount: { currency_code: "USD", value: "500.00" },
    description: "Bali Adventure Retreat - Setup Fee",
  }],
  payment_source: {
    paypal: {
      attributes: {
        vault: {
          store_in_vault: "ON_SUCCESS",
          usage_type: "MERCHANT",
          usage_pattern: "UNSCHEDULED_POSTPAID",
        },
      },
      experience_context: {
        return_url: `${baseUrl}/checkout/bali-adventure?status=approved`,
        cancel_url: `${baseUrl}/checkout/bali-adventure?status=cancelled`,
      },
    },
  },
};
```

Call `ordersController.ordersCreate({ body: orderBody })` and return the order ID to the client.

---

## Task 5.3 — Server: Capture Order & Extract Vault Token

**File:** `server/src/routes/orders.ts`

In `POST /api/orders/:orderId/capture`, after calling `ordersController.ordersCapture({ id: orderId })`:

1. Extract `vault_id` from `response.result.payment_source.paypal.attributes.vault.id`
2. Extract `capture_id` from `response.result.purchase_units[0].payments.captures[0].id`
3. Insert booking into SQLite with `status = 'ACTIVE'`, `vault_token_id = vault_id`, `paid_amount = 500`
4. Insert a `booking_charges` row: `type = 'setup_fee'`, `amount = 500`, `status = 'completed'`
5. Return `{ bookingId, bookingReference, vaultTokenId }` to client

---

## Task 5.4 — Server: Merchant-Initiated Charge via Vault

**File:** `server/src/routes/vault.ts` (new file)

`POST /api/vault/:vaultId/charge`

Request body: `{ bookingId, amount, description }`

```ts
const orderBody = {
  intent: "CAPTURE",
  purchase_units: [{
    amount: { currency_code: "USD", value: amount.toFixed(2) },
    description,
  }],
  payment_source: {
    paypal: {
      vault_id: req.params.vaultId,
    },
  },
};
```

1. Create order with `ordersController.ordersCreate({ body: orderBody })`
2. Immediately capture with `ordersController.ordersCapture({ id: orderId })`
3. Insert `booking_charges` row: `type = 'addon'`, `status = 'completed'`
4. Update `bookings.paid_amount += amount`; if first add-on, set `status = 'IN_PROGRESS'`
5. Return charge record to client

---

## Task 5.5 — Server: Delete Vault Token

**File:** `server/src/routes/vault.ts`

`DELETE /api/vault/:vaultId`

Call PayPal API directly: `DELETE /v3/vault/payment-tokens/:vaultId` using the SDK's HTTP client or a raw fetch with OAuth token from `server/src/services/paypal.ts`.

After success, set `bookings.vault_token_id = NULL` for the associated booking. Return `{ deleted: true }`.

---

## Task 5.6 — Merchant Booking Detail Page with Payment Timeline

**File:** `client/src/pages/MerchantBookingDetailPage.tsx`

**Two-column layout:**

*Left column — Booking Info:*
- Customer card (name, email, booking date)
- Payment summary: setup fee + add-ons + final settlement = total, with progress bar (paid / total)
- Action buttons: "Charge Add-on" (primary), "Final Settlement" (secondary), "Delete Vault" (destructive, only after COMPLETED)

*Right column — Payment Timeline:*

Vertical timeline component (`client/src/components/merchant/PaymentTimeline.tsx`) fed by `GET /api/bookings/:id/charges`. Each entry:

```
[circle indicator]
  Charge Name (e.g., "Balinese Spa Treatment")
  Type: Activity add-on - Merchant-initiated
  Apr 6, 2026 - 2:15 PM (Day 2)        $150.00  [CAPTURED badge]
```

- Completed charges: solid sage-green left border, green CAPTURED badge
- Pending final settlement: dashed amber border, amber PENDING badge
- Day indicator calculated from booking start date

**Server route:** `GET /api/bookings/:id/charges` in `server/src/routes/bookings.ts` — returns ordered charges with computed `trip_day` field.

---

## Task 5.7 — Charge Add-on Dialog & Final Settlement

**File:** `client/src/components/merchant/ChargeAddonDialog.tsx`

shadcn/ui Dialog with:
- Dropdown: predefined add-ons (Spa $150, Scuba $200, Cooking $80, Volcano trek $120) or "Custom" with manual amount/description
- Amount field (pre-filled from selection, editable for custom)
- Description field
- "Charge" button calls `POST /api/vault/:vaultId/charge`
- On success: toast notification, refresh timeline, update payment summary

**Final Settlement action** (`client/src/components/merchant/FinalSettlementButton.tsx`):
1. Calculate remaining balance: `total_amount - paid_amount`
2. Confirm dialog: "Charge final settlement of $X,XXX.XX?"
3. Call `POST /api/vault/:vaultId/charge` with `type = 'final'`
4. On success: call `DELETE /api/vault/:vaultId` to clean up vault token
5. Update booking status to `COMPLETED`

---

## Task 5.8 — Wire Up & Commit

1. Register vault routes in `server/src/index.ts`: `app.use('/api/vault', vaultRouter)`
2. Add charges route: `GET /api/bookings/:id/charges` to bookings router
3. Register `CheckoutVaultPage` route in `App.tsx`
4. Add "Bali Adventure" card on Home page linking to `/checkout/bali-adventure`
5. Verify end-to-end: customer checkout -> merchant charges add-on -> final settlement -> vault deleted

**Commit:** `feat(flow2): implement vault payment flow with merchant-initiated charges and timeline`

---

# Section 6: Flow 3 — Invoice (Custom European Grand Tour)

> Implements custom trip request form, merchant invoice creation via PayPal Invoicing API v2 (direct REST), and invoice status tracking with polling.

---

## Task 6.1: Custom Trip Request Form

**File:** `client/src/pages/CustomTripRequestPage.tsx`

Build the request form at route `/trips/custom-european-tour` (reuse TripDetail page with a form section instead of PayPal buttons).

**Form fields:**
- **Date pickers** — `startDate` and `endDate` using shadcn `<Calendar>` + `<Popover>` (date-fns formatting)
- **Destination checkboxes** — each with name and price, stored as `Array<{ name: string; price: number }>`:

```ts
const DESTINATIONS = [
  { id: "paris", name: "Paris, France", price: 1200 },
  { id: "rome", name: "Rome, Italy", price: 1000 },
  { id: "santorini", name: "Santorini, Greece", price: 1500 },
  { id: "barcelona", name: "Barcelona, Spain", price: 900 },
  { id: "swiss-alps", name: "Swiss Alps", price: 1800 },
  { id: "amsterdam", name: "Amsterdam, Netherlands", price: 800 },
] as const;
```

- **Activity add-on checkboxes** — Guided museum tour ($150), Wine tasting ($100), Cooking class ($120), Boat excursion ($200)
- **Email** — text input, pre-filled from auth store
- **Notes** — textarea for special requests
- **Running total** — live-calculated: sum of selected destinations + activities. Show deposit (40%) and balance (60%) split beneath the total.

**File:** `client/src/data/destinations.ts` — Export `DESTINATIONS` and `ACTIVITIES` constants.

On submit, POST to `/api/trip-requests` and redirect to `/bookings` with a success toast.

---

## Task 6.2: Server — Trip Request Endpoint

**File:** `server/src/routes/trip-requests.ts`

```ts
// POST /api/trip-requests — save customer request
router.post("/", (req, res) => {
  const { email, startDate, endDate, destinations, activities, notes } = req.body;
  // Server-side recalculate total from destination/activity IDs (never trust client total)
  const totalEstimate = calcTotal(destinations, activities);
  const depositAmount = Math.round(totalEstimate * 0.4 * 100) / 100;
  const balanceAmount = totalEstimate - depositAmount;
  // Insert into trip_requests table, status = 'REQUEST_SUBMITTED'
  // Return { id, totalEstimate, depositAmount, balanceAmount, status }
});

// GET /api/trip-requests — merchant list (requires merchant role)
router.get("/", requireMerchant, (req, res) => { /* SELECT * FROM trip_requests ORDER BY created_at DESC */ });

// GET /api/trip-requests/:id — merchant detail
router.get("/:id", requireMerchant, (req, res) => { /* SELECT by id, parse JSON fields */ });
```

Register routes in `server/src/index.ts`: `app.use("/api/trip-requests", tripRequestRoutes)`.

---

## Task 6.3: Merchant Trip Requests List & Detail

**File:** `client/src/pages/merchant/TripRequestsPage.tsx`

Route: `/merchant/trip-requests`. Table with columns: Date, Customer Email, Destinations (pill badges), Total Estimate, Status, Action. Status badge colors: `REQUEST_SUBMITTED` = amber, `AWAITING_DEPOSIT` = blue, `DEPOSIT_RECEIVED` = sage, `FULLY_PAID` = green.

**File:** `client/src/pages/merchant/TripRequestDetailPage.tsx`

Route: `/merchant/trip-requests/:id`. Shows full request details (dates, destinations list with per-item prices, activities, notes, totals). Primary CTA: **"Create Invoice"** button (visible when status is `REQUEST_SUBMITTED`).

---

## Task 6.4: Server — Create Invoice (PayPal Invoicing API v2)

**File:** `server/src/routes/invoices.ts`

The `@paypal/paypal-server-sdk` may not include Invoicing. Use direct REST calls via `fetch` with OAuth token from `server/src/services/paypal.ts`.

```ts
// POST /api/invoices/create
router.post("/create", requireMerchant, async (req, res) => {
  const { tripRequestId } = req.body;
  const request = db.getTripRequest(tripRequestId);
  const token = await getPayPalAccessToken();

  const invoicePayload = {
    detail: {
      currency_code: "USD",
      note: `Custom European Grand Tour — ${request.destinations.length} destinations`,
      invoice_date: new Date().toISOString().split("T")[0],
      payment_term: { term_type: "NET_30" },
    },
    primary_recipients: [{ billing_info: { email_address: request.email } }],
    items: [
      { name: "European Tour — Deposit", quantity: "1", unit_amount: { currency_code: "USD", value: String(request.depositAmount) } },
      { name: "European Tour — Balance", quantity: "1", unit_amount: { currency_code: "USD", value: String(request.balanceAmount) } },
    ],
  };

  const resp = await fetch("https://api-m.sandbox.paypal.com/v2/invoicing/invoices", {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(invoicePayload),
  });
  const invoice = await resp.json();
  // Save invoice.id to trip_requests.booking_id (or create a booking record with invoice_id)
  // Create booking with payment_flow='invoice', status='REQUEST_SUBMITTED', invoice_id=invoice.id
  // Return { invoiceId: invoice.id, bookingId }
});
```

**File:** `server/src/services/paypal.ts` — Add `getPayPalAccessToken()` helper that caches the OAuth2 token (POST `/v1/oauth2/token` with client credentials).

---

## Task 6.5: Server — Send Invoice

**File:** `server/src/routes/invoices.ts` (append)

```ts
// POST /api/invoices/:id/send
router.post("/:id/send", requireMerchant, async (req, res) => {
  const booking = db.getBookingByInvoiceId(req.params.id);
  const token = await getPayPalAccessToken();
  await fetch(`https://api-m.sandbox.paypal.com/v2/invoicing/invoices/${req.params.id}/send`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ send_to_recipient: true }),
  });
  // Update booking status to 'AWAITING_DEPOSIT', update trip_request status
  db.updateBookingStatus(booking.id, "AWAITING_DEPOSIT");
  res.json({ status: "AWAITING_DEPOSIT" });
});
```

---

## Task 6.6: Server — Poll Invoice Status

**File:** `server/src/routes/invoices.ts` (append)

```ts
// GET /api/invoices/:id/status
router.get("/:id/status", requireMerchant, async (req, res) => {
  const token = await getPayPalAccessToken();
  const resp = await fetch(`https://api-m.sandbox.paypal.com/v2/invoicing/invoices/${req.params.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const invoice = await resp.json();
  // Map PayPal invoice status + payments.transactions to our status:
  // invoice.status === 'SENT' && no payments → AWAITING_DEPOSIT
  // invoice.status === 'PARTIALLY_PAID' → DEPOSIT_RECEIVED
  // invoice.status === 'PAID' → FULLY_PAID
  const newStatus = mapInvoiceStatus(invoice);
  db.updateBookingStatus(booking.id, newStatus);
  // Also update paid_amount from invoice.payments.paid_amount.value
  res.json({ status: newStatus, paidAmount: invoice.payments?.paid_amount?.value ?? "0.00" });
});
```

No webhooks needed. Merchant clicks **"Refresh Status"** button on the invoice detail page, which calls this endpoint. Status also auto-refreshes on page load via `useEffect`.

---

## Task 6.7: Merchant Invoice Management Page

**File:** `client/src/pages/merchant/InvoicesPage.tsx`

Route: `/merchant/invoices`. Table listing all invoice-flow bookings: Reference, Customer, Total, Paid, Status, Actions.

**File:** `client/src/pages/merchant/InvoiceDetailPage.tsx`

Route: `/merchant/invoices/:id`. Two-column layout:

**Left column:**
- Customer card (name, email, request date, trip dates)
- **Invoice Payment Link card** (blue highlight, prominent):
  - Display the PayPal invoice URL from `detail.metadata.recipient_view_url` (stored in DB when invoice is created)
  - **"Open"** button → `window.open(invoiceUrl, '_blank')` — opens PayPal-hosted invoice in new tab for audience to see
  - **"Copy"** button → `navigator.clipboard.writeText(invoiceUrl)` with toast confirmation
  - Helper tip: "Open this link in a browser to show the audience the PayPal invoice view"
- Payment progress: deposit ($3,400 PAID) vs balance ($5,100 PENDING) with progress bar
- **"Send Invoice"** button (when status is `REQUEST_SUBMITTED` and invoice draft exists)
- **"Refresh Status"** button (when status is `AWAITING_DEPOSIT` or `DEPOSIT_RECEIVED`) — calls `GET /api/invoices/:id/status`

**Right column:**
- Invoice line items grouped: Destinations (with prices), Activities (with quantities × price), Custom notes from customer
- Subtotal + service fee → invoice total
- Invoice timeline (vertical): REQUEST_SUBMITTED → Invoice Created & Sent → Deposit Received → Awaiting Balance

**Server change:** When creating invoice via `POST /v2/invoicing/invoices`, store the `detail.metadata.recipient_view_url` from the response in the `bookings` table (add `invoice_url TEXT` column to schema).

> **Mockup:** See `docs/ui/invoice-detail-merchant.html`

---

## Task 6.8: Wire Routes & Integration

**Files to update:**
- `client/src/App.tsx` — Add routes: `/merchant/trip-requests`, `/merchant/trip-requests/:id`, `/merchant/invoices`, `/merchant/invoices/:id`
- `server/src/index.ts` — Mount `invoiceRoutes` at `/api/invoices`
- `client/src/lib/api.ts` — Add fetch helpers: `submitTripRequest()`, `createInvoice()`, `sendInvoice()`, `refreshInvoiceStatus()`, `getTripRequests()`, `getTripRequest()`

**Commit:** `feat: implement Flow 3 — invoice payment flow with custom trip requests, PayPal Invoicing API v2, and merchant invoice management`

---

# Section 7: Merchant Dashboard

## 7.1 Server — KPI Stats Endpoint

**File:** `server/src/routes/merchant.ts`

Add `GET /api/merchant/stats` returning four KPIs:

```ts
router.get('/stats', requireMerchant, (req, res) => {
  const activeBookings = db.prepare(
    `SELECT COUNT(*) as count FROM bookings WHERE status NOT IN ('FULLY_CAPTURED','COMPLETED','FULLY_PAID','VOIDED','EXPIRED')`
  ).get();
  const pendingCaptures = db.prepare(
    `SELECT COUNT(*) as count FROM bookings WHERE payment_flow = 'authorize' AND status = 'DEPOSIT_CAPTURED'`
  ).get();
  const openInvoices = db.prepare(
    `SELECT COUNT(*) as count FROM bookings WHERE payment_flow = 'invoice' AND status IN ('AWAITING_DEPOSIT','DEPOSIT_RECEIVED')`
  ).get();
  const monthlyRevenue = db.prepare(
    `SELECT COALESCE(SUM(amount),0) as total FROM booking_charges WHERE status = 'completed' AND created_at >= date('now','start of month')`
  ).get();
  res.json({ activeBookings: activeBookings.count, pendingCaptures: pendingCaptures.count, openInvoices: openInvoices.count, monthlyRevenue: monthlyRevenue.total });
});
```

Register in `server/src/index.ts`: `app.use('/api/merchant', merchantRouter)`.

## 7.2 Server — Chart Data Endpoint

**File:** `server/src/routes/merchant.ts`

Add `GET /api/merchant/charts` returning three datasets:

- **revenueByFlow**: `SELECT payment_flow, SUM(amount) as total FROM booking_charges bc JOIN bookings b ON bc.booking_id = b.id WHERE bc.status = 'completed' GROUP BY b.payment_flow` — returns `[{ flow: 'authorize', total }, ...]`
- **dailyBookings**: `SELECT DATE(created_at) as date, COUNT(*) as count FROM bookings WHERE created_at >= date('now','-30 days') GROUP BY DATE(created_at) ORDER BY date` — fill missing dates with 0 on the client
- **monthlyRevenue**: `SELECT strftime('%Y-%m', bc.created_at) as month, bc.type, SUM(bc.amount) as total FROM booking_charges bc WHERE bc.status = 'completed' GROUP BY month, bc.type ORDER BY month` — pivot types into `{ month, deposit, final, addon }` rows

## 7.3 KPI Stat Cards

**File:** `client/src/components/merchant/StatCards.tsx`

Four cards in a `grid grid-cols-2 lg:grid-cols-4 gap-4` layout. Each card uses `bg-card border border-border rounded-xl p-5`. Content: Lucide icon (top-left, `text-accent`), label (`text-sm text-text-muted`), value (`text-2xl font-semibold text-text`). Cards: Activity (active bookings), CreditCard (pending captures), FileText (open invoices), DollarSign (monthly revenue formatted as `$X,XXX`).

Fetch from `/api/merchant/stats` via `useEffect` on mount.

## 7.4 Donut Chart — Revenue by Flow

**File:** `client/src/components/merchant/RevenueByFlowChart.tsx`

Use Recharts `<PieChart>` with `<Pie innerRadius={60} outerRadius={90}>`. Data mapped to three cells with explicit `<Cell fill={color} />`: Mocha `#5C3D2E` (authorize), Terracotta `#A0522D` (vault), Sage `#86A873` (invoice). Center label showing total revenue. Custom `<Legend>` below with flow names. Wrapper div with heading "Revenue by Flow".

## 7.5 Line Chart — Bookings Trend

**File:** `client/src/components/merchant/BookingsTrendChart.tsx`

Use Recharts `<LineChart>` with `<Line type="monotone" dataKey="count" stroke="#A0522D" strokeWidth={2} dot={false} />`. X-axis: dates (formatted `MMM d`). Y-axis: booking count. `<CartesianGrid strokeDasharray="3 3" stroke="#E8DFD4" />`. Fill missing dates from the 30-day window with count 0 before passing to chart.

## 7.6 Stacked Bar Chart — Monthly Revenue

**File:** `client/src/components/merchant/MonthlyRevenueChart.tsx`

Use Recharts `<BarChart>` with three stacked `<Bar>` elements: `deposit` (Mocha `#5C3D2E`), `final` (Terracotta `#A0522D`), `addon` (Sage `#86A873`). Each bar has `stackId="revenue"`. X-axis: month labels. Y-axis: dollar amounts. Include `<Tooltip>` with custom formatter showing `$` prefix.

## 7.7 Recent Bookings Table

**File:** `client/src/components/merchant/RecentBookingsTable.tsx`

Fetch last 10 bookings from `GET /api/bookings?limit=10&sort=desc` (add query param support to existing bookings route). Columns: Customer (name), Trip (trip name), Flow (badge: authorize/vault/invoice), Status (colored badge), Amount (`$X,XXX`), Action.

Action column logic:
- Flow 1 + `DEPOSIT_CAPTURED` → `<Link to={/merchant/bookings/:id}>Capture</Link>` (accent button)
- Flow 2 + `ACTIVE`/`IN_PROGRESS` → `<Link>Charge</Link>` (accent button)
- Flow 3 → `<span className="text-text-muted">Waiting</span>` (no action)
- Terminal statuses → `<Link>View</Link>` (ghost button)

## 7.8 Simulation Mode

**File:** `client/src/components/merchant/SimulationPanel.tsx`

Banner at dashboard bottom: `bg-surface-highlight border border-border rounded-xl p-6`. Heading "Simulation Mode" with Lucide `Play` icon. "Start Simulation" button (accent).

On start, steps through a Flow 2 lifecycle with `useRef` for timer and `useState` for current step index:

| Step | Label | Action | Server Call |
|------|-------|--------|-------------|
| 0 | Day 0 — Setup Fee | Create booking + vault + capture $500 | `POST /api/orders/create` + `POST /api/orders/:id/capture` |
| 1 | Day 2 — Spa Treatment | Charge $150 via vault | `POST /api/vault/:vaultId/charge` body `{ description: "Balinese Spa Treatment", amount: 150 }` |
| 2 | Day 3 — Scuba Diving | Charge $200 via vault | `POST /api/vault/:vaultId/charge` body `{ description: "Scuba Diving Session", amount: 200 }` |
| 3 | Day 4 — City Walk | Charge $80 via vault | `POST /api/vault/:vaultId/charge` body `{ description: "Ubud City Walk Guidance", amount: 80 }` |
| 4 | Day 5 — Fire Dance | Charge $120 via vault | `POST /api/vault/:vaultId/charge` body `{ description: "Kecak Fire Dance Event", amount: 120 }` |
| 5 | Day 7 — Final Settlement | Charge $1,450 + delete vault | `POST /api/vault/:vaultId/charge` + `DELETE /api/vault/:vaultId` |

Progress bar showing step X of 6. Each step displays: step label, amount, status indicator (spinner while processing, checkmark on success). Auto-advance via `setTimeout(3000)` or manual "Next Step" button. "Reset" button clears simulation booking from DB via `DELETE /api/bookings/:id/simulation` (new endpoint, restricted to simulation-flagged bookings).

Add server endpoint `POST /api/simulation/seed` to create a Bali booking with a mock vault token (bypasses PayPal for demo purposes — uses a `sim_vault_xxx` token prefix and the vault charge endpoint returns mock captures when it detects the prefix).

## 7.9 Dashboard Page Assembly

**File:** `client/src/pages/merchant/Dashboard.tsx`

Compose all components:

```tsx
export default function Dashboard() {
  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold text-text">Dashboard</h1>
      <StatCards />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RevenueByFlowChart />
        <BookingsTrendChart className="lg:col-span-2" />
      </div>
      <MonthlyRevenueChart />
      <RecentBookingsTable />
      <SimulationPanel />
    </div>
  );
}
```

## 7.10 Commit

```bash
git add server/src/routes/merchant.ts client/src/components/merchant/StatCards.tsx \
  client/src/components/merchant/RevenueByFlowChart.tsx \
  client/src/components/merchant/BookingsTrendChart.tsx \
  client/src/components/merchant/MonthlyRevenueChart.tsx \
  client/src/components/merchant/RecentBookingsTable.tsx \
  client/src/components/merchant/SimulationPanel.tsx \
  client/src/pages/merchant/Dashboard.tsx
git commit -m "feat(dashboard): add merchant dashboard with KPIs, charts, table, and simulation mode"
```

---

# Section 8: Polish & Integration Testing

## 8.1 Error Handling — PaymentErrorBanner

Create `client/src/components/payment/PaymentErrorBanner.tsx`:

```tsx
interface PaymentErrorBannerProps {
  error: string | null;
  onDismiss?: () => void;
}

export function PaymentErrorBanner({ error, onDismiss }: PaymentErrorBannerProps) {
  if (!error) return null;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
      <AlertCircle className="h-5 w-5 shrink-0" />
      <p className="flex-1">{error}</p>
      {onDismiss && (
        <button onClick={onDismiss} aria-label="Dismiss error">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
```

Wire into all three checkout pages (`client/src/pages/Checkout.tsx`) — render above PayPal buttons. Set error state in `onError` callback and in catch blocks of `createOrder`/`onApprove`. Also add to merchant action dialogs (capture balance, charge add-on, send invoice).

## 8.2 Loading States — Skeleton Screens

Create `client/src/components/ui/Skeleton.tsx` (shadcn/ui skeleton primitive). Add these skeleton variants:

- **TripCardSkeleton** in `client/src/components/trips/TripCardSkeleton.tsx` — pulse gradient matching card dimensions (image block 200px, 3 text lines, badge placeholder).
- **BookingListSkeleton** in `client/src/components/bookings/BookingListSkeleton.tsx` — 4 rows of horizontal bars (reference, trip, status, amount).
- **DashboardChartSkeleton** in `client/src/components/merchant/DashboardChartSkeleton.tsx` — rounded rectangle matching chart container with muted pulse fill.
- **KPICardSkeleton** — row of 4 cards with number placeholder and label bar.

Use in each page's loading state (Zustand loading flag or React Suspense boundaries).

## 8.3 ProcessingOverlay

Create `client/src/components/payment/ProcessingOverlay.tsx`:

```tsx
export function ProcessingOverlay({ message = "Processing payment..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 shadow-lg">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="text-sm font-medium text-text">{message}</p>
      </div>
    </div>
  );
}
```

Show during: `onApprove` server calls (Flow 1 authorize + partial capture, Flow 2 capture + vault extraction), merchant capture/charge actions, and simulation step transitions. Toggle via Zustand `paymentStore.isProcessing`.

## 8.4 End-to-End Testing Checklist (PayPal Sandbox)

Run each flow manually against sandbox credentials. Verify in browser DevTools Network tab and server logs.

| # | Flow | Step | Expected Result |
|---|------|------|-----------------|
| 1 | Auth/Capture | Create order intent=AUTHORIZE | 201 with order ID |
| 2 | Auth/Capture | Approve in PayPal popup | Authorization ID returned |
| 3 | Auth/Capture | Partial capture $200 deposit | Capture ID, booking status DEPOSIT_CAPTURED |
| 4 | Auth/Capture | Merchant captures $600 balance | Status FULLY_CAPTURED, paid_amount = 800 |
| 5 | Vault | Create order with vault attrs | 201 with order ID |
| 6 | Vault | Capture setup fee $500 | vault_token_id saved, status ACTIVE |
| 7 | Vault | Merchant charges add-on $150 | New booking_charge row, capture ID |
| 8 | Vault | Final settlement + vault delete | Status COMPLETED, DELETE returns 204 |
| 9 | Invoice | Submit trip request | trip_requests row created |
| 10 | Invoice | Create + send invoice | PayPal invoice ID saved, email sent |
| 11 | Invoice | Poll invoice status after payment | Status transitions to DEPOSIT_RECEIVED / FULLY_PAID |

## 8.5 Role Switching Verification

Test sequence: login as customer, book Tokyo trip, switch to merchant via nav role switcher, capture balance on dashboard, switch back to customer, confirm booking shows FULLY_CAPTURED.

Verify:
- Nav bar updates immediately (role badge, menu items).
- Customer cannot access `/merchant/*` routes (redirects to `/`).
- Merchant can browse customer routes and also access merchant routes.
- `X-User-Role` header updates on all subsequent API calls after switch.
- localStorage persists role across page refresh.

## 8.6 Responsive Layout

Add Tailwind breakpoints in these files:

- **Trip card grid** (`client/src/pages/Home.tsx`): `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` with consistent gap.
- **Trip detail** (`client/src/pages/TripDetail.tsx`): Stack itinerary and pricing sidebar vertically on mobile (`flex-col lg:flex-row`).
- **Checkout** (`client/src/pages/Checkout.tsx`): Single column below `md`, side-by-side summary + PayPal buttons above.
- **Dashboard charts** (`client/src/pages/merchant/Dashboard.tsx`): `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` for chart cards. KPI cards: `grid-cols-2 md:grid-cols-4`.
- **Booking detail timeline** (`client/src/components/merchant/PaymentTimeline.tsx`): Full-width single column on mobile, two-column layout on `lg`.
- **Nav** (`client/src/components/layout/Header.tsx`): Collapse menu to hamburger below `md`.

Test at 375px (mobile), 768px (tablet), 1280px (desktop).

## 8.7 Edge Cases

**Authorization expiration warning (Flow 1):**
In `client/src/components/merchant/BookingDetail.tsx`, compute days remaining from `authorization_expires_at`. If <= 3 days, show amber warning banner: "Authorization expires in X days. Capture or reauthorize now." If expired, show destructive banner with "Reauthorize" button calling `POST /api/payments/authorizations/:authId/reauthorize`.

**Vault charge failure retry (Flow 2):**
If `POST /api/vault/:vaultId/charge` returns 4xx/5xx, show PaymentErrorBanner with "Charge failed. Check PayPal sandbox status and retry." Add a "Retry" button on the charge dialog that re-submits the same payload. Log failure to `booking_charges` with `status: 'failed'`.

**Empty states:**
- No bookings: `client/src/pages/Bookings.tsx` — illustration placeholder + "No bookings yet. Browse trips to get started." with CTA link to `/`.
- No trip requests: `client/src/pages/merchant/TripRequests.tsx` — "No custom trip requests yet."
- No invoices: `client/src/pages/merchant/Invoices.tsx` — "No invoices created."
- Dashboard with zero data: KPI cards show "0", charts show empty state message instead of blank canvas.

## 8.8 Documentation Update

Update these files after all tasks complete:

- **`docs/context.md`** — Add final tech stack summary, all three payment flows implemented, and key architecture decisions.
- **`docs/todos.md`** — Check off Section 8 tasks (error handling, loading states, responsive, edge cases, E2E testing).
- **`docs/progress.md`** — Append entry: "Section 8 complete — polish pass with error banners, skeletons, ProcessingOverlay, responsive breakpoints, edge case handling, and full E2E sandbox verification."

**Commit:** `feat: add polish layer — error handling, loading states, responsive layout, edge cases`

---

# Reconciliation Notes

The following adjustments must be applied during implementation to resolve cross-section inconsistencies:

### 1. CSS File Name — Use `index.css`
Section 1.3 creates `client/src/index.css` with Tailwind directives. Section 2.1 references `app.css`. **Use `index.css` everywhere.** Remove color token definitions from Section 2.1 (they're already in Section 1.3).

### 2. PayPal SDK Method Names — Use `ordersCreate` / `ordersCapture`
Section 4 uses `createOrder()` / `captureOrder()`. Section 5 uses `ordersCreate()` / `ordersCapture()`. The `@paypal/paypal-server-sdk` v2 uses `ordersCreate` / `ordersCapture`. **Update Section 4 to match.**

### 3. Create `server/src/services/paypal.ts` in Section 4 (before Task 4.2)
This file initializes the PayPal SDK client and exports `ordersController`, `paymentsController`, and a `getPayPalAccessToken()` helper (needed by Section 6 for direct REST calls to Invoicing API). **Add this as Task 4.1b.**

### 4. Checkout Route Dispatcher
Section 2.7 registers `/checkout/:slug`. Sections 4 and 5 create separate checkout page components (`CheckoutAuthorizePage.tsx`, `CheckoutVaultPage.tsx`). **Create a `CheckoutPage.tsx` dispatcher** that fetches the trip by slug, reads `payment_flow`, and renders the appropriate sub-component. Flow 3 (invoice) doesn't have a checkout page — it uses the request form instead.

### 5. File Name Convention — Use `*Page.tsx` Consistently
Section 8 references `Home.tsx`, `Bookings.tsx`, etc. All page components use the `*Page.tsx` suffix (`HomePage.tsx`, `BookingsPage.tsx`, `TripDetailPage.tsx`, etc.). **Update Section 8 references accordingly.**

### 6. Add Merchant "All Bookings" Page
The spec lists `/merchant/bookings` (filterable list of all bookings). **Add a task in Section 7** (after 7.7) to create `MerchantBookingsPage.tsx` with a table showing all bookings, filterable by payment flow and status.

### 7. Add Reauthorize Endpoint
The spec mentions `POST /api/payments/authorizations/:authId/reauthorize`. **Add a step in Section 4** (after 4.5) implementing this endpoint. It calls PayPal's `POST /v2/payments/authorizations/:authId/reauthorize` and returns the new authorization ID.

### 8. KPI "Pending Captures" Query
Section 7.1 counts bookings in `DEPOSIT_CAPTURED` status for the "Pending Captures" KPI. This is correct — these are bookings where the deposit was captured and the merchant needs to capture the remaining balance. Aligns with user intent.

### 9. Simulation Mode Steps
Plan has 6 steps (expanded from spec's 4). This is an enhancement — more granular demo with city walk guidance and event fees. Accepted as-is.

---

# UX Improvements (from UI/UX Pro Max Review)

Apply these during implementation. See `docs/ui/ux-review-all-flows.html` for full visual review.

### 10. Warning Color Contrast Fix
Change `warning` token from `#D4A054` to `#B8860B` everywhere (Tailwind theme, all mockups). The original fails WCAG AA (3.2:1) on card backgrounds. The new value achieves 4.5:1.

### 11. Shared UX Components (create in Section 2 or early Section 4)

**File:** `client/src/components/ui/confirm-dialog.tsx`
Wrap shadcn/ui `AlertDialog` for reuse across all flows. Props: `title`, `description`, `confirmLabel`, `onConfirm`, `variant` ("default" | "destructive"). Used for: Capture Balance, Void, Delete Vault, Reauthorize, Final Settlement, Send Invoice.

**File:** `client/src/components/ui/action-toast.tsx`
Toast notification component (shadcn/ui `Toast` or `Sonner`). Auto-dismiss 3-5s. `aria-live="polite"`. Show after every payment action: "Balance of $600.00 captured successfully ✓" / "Vault token deleted" / "Invoice sent to bob@email.com".

**File:** `client/src/components/ui/loading-button.tsx`
Wrapper around shadcn/ui `Button` that shows spinner + "Processing..." text and disables during async operations. Prevents double-click.

### 12. Flow 1 — Authorization Progress Bar (Task 4.8b addition)
Add a horizontal progress bar below the countdown timer in `AuthorizeBookingDetailPage.tsx`:
- Green fill showing position in the 29-day window
- Marker line at the 3-day honor period boundary
- Label: "Day X of 29 — Y days remaining"
- Calculate from `authorization_expires_at` and `created_at`

### 13. Flow 2 — Timeline Enhancements (Task 5.6 additions)

**Charge type icons:** Add Lucide icons to each timeline entry by charge type:
- `Key` → setup fee
- `Sparkles` → spa
- `Waves` → diving
- `MapPin` → city walk guidance
- `Ticket` → event
- `CircleDollarSign` → final settlement

Store `charge_icon` (string) in `booking_charges` table or derive from `type`/`description`.

**Running total:** After each entry's amount, show cumulative total in muted text: `$150 — total: $650`.

**Preset add-on dialog:** `ChargeAddonDialog` should render predefined options as clickable cards (Spa $150, Diving $200, Cooking $80, Trek $120) plus a "Custom" tab with free-form name + amount fields.

**Empty state:** When `booking_charges` has only the setup fee, show "No add-on charges yet — use '+ Charge Add-on' to record a service" below the setup fee entry.

### 14. Flow 3 — Invoice Detail Enhancements (Task 6.7 additions)

**Copy feedback:** On "Copy" click, change button text to "Copied ✓" with green background (`#DCFCE7`) for 2 seconds via `setTimeout`, then revert.

**Last checked timestamp:** Store `lastChecked` in component state, update on each `refreshInvoiceStatus()` call. Display "Last checked: X minutes ago" next to the Refresh button using relative time formatting.

**Email sent indicator:** Below the invoice link card, show "Email sent to: {email} ✓" with a `Mail` Lucide icon when invoice status is `AWAITING_DEPOSIT` or later.

### 15. All Flows — Back Navigation and Consistency

**Back link:** Add `<Link to="/merchant/bookings" className="...">← Back to Bookings</Link>` above the booking header on all merchant detail pages.

**Customer card duration:** All customer cards show trip duration in parentheses: "Apr 5 – Apr 11, 2026 (7 days)". Calculate from `start_date` and `end_date`.

**Timeline dot consistency:** All vertical timelines use the same dot component: 16px circle with 6px inner white dot. Colors: Sage (#86A873) for completed, Amber (#B8860B) for pending, Red (#DC2626) for failed.

**Status icons:** Next to amounts in timelines: `CheckCircle` (completed/captured), `Clock` (pending), `XCircle` (failed) — all from Lucide.

