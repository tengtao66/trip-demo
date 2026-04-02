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
