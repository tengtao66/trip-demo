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
