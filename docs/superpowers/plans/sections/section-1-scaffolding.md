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
