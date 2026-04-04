INSERT OR IGNORE INTO users (id, email, name, role) VALUES
  ('u-customer-01', 'customer@terra.demo', 'Alex Rivera', 'customer'),
  ('u-merchant-01', 'merchant@terra.demo', 'Terra Travel Co.', 'merchant');

INSERT OR IGNORE INTO trips (id, slug, name, description, duration_days, base_price, deposit_amount, payment_flow, itinerary, image_gradient, category, daily_rate) VALUES
  ('t-tokyo-01', 'tokyo-cherry-blossom', 'Tokyo Cherry Blossom Express', 'Cherry blossom season in Tokyo. Temples, parks, tea ceremonies.', 3, 800, 200, 'authorize',
   '[{"day":1,"title":"Arrival & Shinjuku Gyoen","details":"Welcome dinner, cherry blossom walks"},{"day":2,"title":"Ueno Park & Senso-ji","details":"Tea ceremony, temple visit"},{"day":3,"title":"Chidorigafuchi & Departure","details":"Imperial Palace gardens"}]',
   'linear-gradient(135deg, #FFB7C5 0%, #FF69B4 100%)', 'tour', NULL),
  ('t-bali-01', 'bali-adventure', 'Bali Adventure Retreat', 'Multi-day adventure in Bali. Surfing, temples, rice terraces, spa.', 7, 2500, 500, 'vault',
   '[{"day":1,"title":"Arrival & Seminyak Beach","details":"Check-in, sunset beach"},{"day":2,"title":"Ubud Rice Terraces","details":"Tegallalang, monkey forest"},{"day":3,"title":"Temple Tour","details":"Tanah Lot, Uluwatu"},{"day":4,"title":"Optional Activities","details":"Spa, diving, cooking"},{"day":5,"title":"Optional Activities","details":"Volcano trek, surfing"},{"day":6,"title":"Beach Day","details":"Nusa Dua relaxation"},{"day":7,"title":"Departure","details":"Transfer to airport"}]',
   'linear-gradient(135deg, #87CEEB 0%, #2E8B57 100%)', 'tour', NULL),
  ('t-europe-01', 'custom-european-tour', 'Custom European Grand Tour', 'Design your dream European itinerary.', 14, 10000, 2500, 'invoice',
   '[]',
   'linear-gradient(135deg, #DAA520 0%, #8B4513 100%)', 'tour', NULL);

INSERT OR IGNORE INTO trips (id, slug, name, description, duration_days, base_price, deposit_amount, payment_flow, itinerary, image_gradient, category, daily_rate) VALUES
  ('t-car-01', 'economy-sedan', 'Economy Sedan', 'Compact and fuel-efficient — perfect for city driving and airport runs.', 0, 50, 0, 'instant',
   '[]',
   'linear-gradient(135deg, #94a3b8 0%, #475569 100%)', 'car_rental', 50),
  ('t-car-02', 'suv-rental', 'SUV', 'Spacious SUV with all-wheel drive — ideal for families and road trips.', 0, 100, 0, 'instant',
   '[]',
   'linear-gradient(135deg, #6b7280 0%, #1f2937 100%)', 'car_rental', 100),
  ('t-car-03', 'luxury-convertible', 'Luxury Convertible', 'Turn heads in our premium convertible — the ultimate open-road experience.', 0, 150, 0, 'instant',
   '[]',
   'linear-gradient(135deg, #d97706 0%, #92400e 100%)', 'car_rental', 150);

INSERT OR IGNORE INTO trips (id, slug, name, description, duration_days, base_price, deposit_amount, payment_flow, itinerary, image_gradient, category, daily_rate) VALUES
  ('t-cruise-01', 'caribbean-cruise', 'Caribbean Island Hopper', 'Island-hop through the Caribbean with stops in Cozumel, Grand Cayman, and Jamaica.', 7, 2800, 700, 'authorize',
   '[{"day":1,"title":"Miami Departure","details":"Board the ship, welcome dinner, safety briefing"},{"day":2,"title":"At Sea","details":"Pool deck, spa, entertainment shows"},{"day":3,"title":"Cozumel, Mexico","details":"Snorkeling at Palancar Reef, downtown shopping"},{"day":4,"title":"Grand Cayman","details":"Seven Mile Beach, stingray sandbar excursion"},{"day":5,"title":"Jamaica","details":"Dunn''s River Falls, jerk chicken tasting"},{"day":6,"title":"At Sea","details":"Captain''s gala dinner, sunset deck party"},{"day":7,"title":"Return to Miami","details":"Disembark, farewell brunch"}]',
   'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)', 'cruise', NULL),
  ('t-cruise-02', 'mediterranean-cruise', 'Mediterranean Explorer', 'Sail the Mediterranean from Barcelona to the Greek islands.', 10, 4500, 1125, 'authorize',
   '[{"day":1,"title":"Barcelona Departure","details":"Board the ship, welcome cocktails, Sagrada Familia views from deck"},{"day":2,"title":"Marseille, France","details":"Old Port walking tour, bouillabaisse lunch"},{"day":3,"title":"Genoa, Italy","details":"Cinque Terre day trip, pesto cooking class"},{"day":4,"title":"Rome (Civitavecchia)","details":"Colosseum tour, Vatican Museums, Roman gelato"},{"day":5,"title":"Naples, Italy","details":"Pompeii ruins, Neapolitan pizza, Amalfi Coast views"},{"day":6,"title":"At Sea","details":"Wine tasting seminar, pool day, sunset meditation"},{"day":7,"title":"Mykonos, Greece","details":"Windmills, Little Venice, beach club afternoon"},{"day":8,"title":"Santorini, Greece","details":"Oia sunset, caldera hike, local wine tour"},{"day":9,"title":"At Sea","details":"Captain''s farewell dinner, photo gallery, live music"},{"day":10,"title":"Return to Barcelona","details":"Disembark, farewell brunch, La Rambla stroll"}]',
   'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', 'cruise', NULL),
  ('t-cruise-03', 'alaska-cruise', 'Alaska Glacier Discovery', 'Cruise through Alaska''s Inside Passage with glacier viewing and wildlife spotting.', 5, 1900, 475, 'authorize',
   '[{"day":1,"title":"Seattle Departure","details":"Board the ship, welcome dinner, Inside Passage briefing"},{"day":2,"title":"At Sea (Inside Passage)","details":"Whale watching from deck, glacier documentary, hot cocoa bar"},{"day":3,"title":"Juneau, Alaska","details":"Mendenhall Glacier hike, whale watching excursion, salmon bake"},{"day":4,"title":"Glacier Bay","details":"Full-day glacier cruising, ranger talks, wildlife spotting (bears, eagles)"},{"day":5,"title":"Return to Seattle","details":"Disembark, farewell brunch, Pike Place Market visit"}]',
   'linear-gradient(135deg, #0891b2 0%, #155e75 100%)', 'cruise', NULL);

-- ============================================
-- MOCK BOOKINGS FOR DASHBOARD
-- ============================================

INSERT OR IGNORE INTO users (id, email, name, role) VALUES
  ('u-customer-02', 'sarah@example.com', 'Sarah Chen', 'customer'),
  ('u-customer-03', 'mike@example.com', 'Mike Johnson', 'customer'),
  ('u-customer-04', 'emma@example.com', 'Emma Wilson', 'customer'),
  ('u-customer-05', 'james@example.com', 'James Park', 'customer');

-- Authorize: Tokyo fully captured (20 days ago)
INSERT OR IGNORE INTO bookings (id, booking_reference, user_id, trip_id, status, payment_flow, total_amount, paid_amount, paypal_order_id, authorization_id, created_at, updated_at)
VALUES ('mock-auth-01', 'TERRA-1001', 'u-customer-02', 't-tokyo-01', 'FULLY_CAPTURED', 'authorize', 800, 800, 'mock_order_1', 'mock_auth_1', datetime('now', '-20 days'), datetime('now', '-18 days'));
INSERT OR IGNORE INTO booking_charges (id, booking_id, type, description, amount, paypal_capture_id, status, created_at) VALUES
  ('mc-auth-01a', 'mock-auth-01', 'deposit', 'Deposit for Tokyo Cherry Blossom Express', 200, 'mock_cap_1a', 'completed', datetime('now', '-20 days')),
  ('mc-auth-01b', 'mock-auth-01', 'balance', 'Balance for Tokyo Cherry Blossom Express', 600, 'mock_cap_1b', 'completed', datetime('now', '-18 days'));

-- Authorize: Tokyo deposit only (5 days ago)
INSERT OR IGNORE INTO bookings (id, booking_reference, user_id, trip_id, status, payment_flow, total_amount, paid_amount, paypal_order_id, authorization_id, authorization_expires_at, created_at, updated_at)
VALUES ('mock-auth-02', 'TERRA-1042', 'u-customer-03', 't-tokyo-01', 'DEPOSIT_CAPTURED', 'authorize', 800, 200, 'mock_order_2', 'mock_auth_2', datetime('now', '+24 days'), datetime('now', '-5 days'), datetime('now', '-5 days'));
INSERT OR IGNORE INTO booking_charges (id, booking_id, type, description, amount, paypal_capture_id, status, created_at) VALUES
  ('mc-auth-02a', 'mock-auth-02', 'deposit', 'Deposit for Tokyo Cherry Blossom Express', 200, 'mock_cap_2a', 'completed', datetime('now', '-5 days'));

-- Authorize: Caribbean cruise fully captured (15 days ago)
INSERT OR IGNORE INTO bookings (id, booking_reference, user_id, trip_id, status, payment_flow, total_amount, paid_amount, paypal_order_id, authorization_id, created_at, updated_at)
VALUES ('mock-auth-03', 'TERRA-2010', 'u-customer-04', 't-cruise-01', 'FULLY_CAPTURED', 'authorize', 2800, 2800, 'mock_order_3', 'mock_auth_3', datetime('now', '-15 days'), datetime('now', '-10 days'));
INSERT OR IGNORE INTO booking_charges (id, booking_id, type, description, amount, paypal_capture_id, status, created_at) VALUES
  ('mc-auth-03a', 'mock-auth-03', 'deposit', 'Deposit for Caribbean Island Hopper', 700, 'mock_cap_3a', 'completed', datetime('now', '-15 days')),
  ('mc-auth-03b', 'mock-auth-03', 'balance', 'Balance for Caribbean Island Hopper', 2100, 'mock_cap_3b', 'completed', datetime('now', '-10 days'));

-- Authorize: Mediterranean deposit only (7 days ago)
INSERT OR IGNORE INTO bookings (id, booking_reference, user_id, trip_id, status, payment_flow, total_amount, paid_amount, paypal_order_id, authorization_id, authorization_expires_at, created_at, updated_at)
VALUES ('mock-auth-04', 'TERRA-2055', 'u-customer-05', 't-cruise-02', 'DEPOSIT_CAPTURED', 'authorize', 4500, 1125, 'mock_order_4', 'mock_auth_4', datetime('now', '+22 days'), datetime('now', '-7 days'), datetime('now', '-7 days'));
INSERT OR IGNORE INTO booking_charges (id, booking_id, type, description, amount, paypal_capture_id, status, created_at) VALUES
  ('mc-auth-04a', 'mock-auth-04', 'deposit', 'Deposit for Mediterranean Explorer', 1125, 'mock_cap_4a', 'completed', datetime('now', '-7 days'));

-- Authorize: Alaska cruise fully captured (25 days ago)
INSERT OR IGNORE INTO bookings (id, booking_reference, user_id, trip_id, status, payment_flow, total_amount, paid_amount, paypal_order_id, authorization_id, created_at, updated_at)
VALUES ('mock-auth-05', 'TERRA-2078', 'u-customer-02', 't-cruise-03', 'FULLY_CAPTURED', 'authorize', 1900, 1900, 'mock_order_5', 'mock_auth_5', datetime('now', '-25 days'), datetime('now', '-20 days'));
INSERT OR IGNORE INTO booking_charges (id, booking_id, type, description, amount, paypal_capture_id, status, created_at) VALUES
  ('mc-auth-05a', 'mock-auth-05', 'deposit', 'Deposit for Alaska Glacier Discovery', 475, 'mock_cap_5a', 'completed', datetime('now', '-25 days')),
  ('mc-auth-05b', 'mock-auth-05', 'balance', 'Balance for Alaska Glacier Discovery', 1425, 'mock_cap_5b', 'completed', datetime('now', '-20 days'));

-- Vault: Bali completed (12 days ago, full lifecycle)
INSERT OR IGNORE INTO bookings (id, booking_reference, user_id, trip_id, status, payment_flow, total_amount, paid_amount, vault_token_id, created_at, updated_at)
VALUES ('mock-vault-01', 'TERRA-3001', 'u-customer-03', 't-bali-01', 'COMPLETED', 'vault', 2500, 2500, NULL, datetime('now', '-12 days'), datetime('now', '-5 days'));
INSERT OR IGNORE INTO booking_charges (id, booking_id, type, description, amount, paypal_capture_id, status, created_at) VALUES
  ('mc-vault-01a', 'mock-vault-01', 'setup_fee', 'Setup Fee for Bali Adventure Retreat', 500, 'mock_cap_v1a', 'completed', datetime('now', '-12 days')),
  ('mc-vault-01b', 'mock-vault-01', 'addon', 'Balinese Spa Treatment', 150, 'mock_cap_v1b', 'completed', datetime('now', '-10 days')),
  ('mc-vault-01c', 'mock-vault-01', 'addon', 'Scuba Diving Session', 200, 'mock_cap_v1c', 'completed', datetime('now', '-9 days')),
  ('mc-vault-01d', 'mock-vault-01', 'addon', 'Ubud City Walk Guidance', 80, 'mock_cap_v1d', 'completed', datetime('now', '-8 days')),
  ('mc-vault-01e', 'mock-vault-01', 'addon', 'Kecak Fire Dance Event', 120, 'mock_cap_v1e', 'completed', datetime('now', '-7 days')),
  ('mc-vault-01f', 'mock-vault-01', 'final', 'Final Settlement', 1450, 'mock_cap_v1f', 'completed', datetime('now', '-5 days'));

-- Vault: Bali in progress (3 days ago)
INSERT OR IGNORE INTO bookings (id, booking_reference, user_id, trip_id, status, payment_flow, total_amount, paid_amount, vault_token_id, created_at, updated_at)
VALUES ('mock-vault-02', 'TERRA-3025', 'u-customer-05', 't-bali-01', 'IN_PROGRESS', 'vault', 2500, 850, 'sim_vault_mock_02', datetime('now', '-3 days'), datetime('now', '-1 days'));
INSERT OR IGNORE INTO booking_charges (id, booking_id, type, description, amount, paypal_capture_id, status, created_at) VALUES
  ('mc-vault-02a', 'mock-vault-02', 'setup_fee', 'Setup Fee for Bali Adventure Retreat', 500, 'mock_cap_v2a', 'completed', datetime('now', '-3 days')),
  ('mc-vault-02b', 'mock-vault-02', 'addon', 'Balinese Spa Treatment', 150, 'mock_cap_v2b', 'completed', datetime('now', '-2 days')),
  ('mc-vault-02c', 'mock-vault-02', 'addon', 'Scuba Diving Session', 200, 'mock_cap_v2c', 'completed', datetime('now', '-1 days'));

-- Invoice: European tour awaiting deposit (8 days ago)
INSERT OR IGNORE INTO bookings (id, booking_reference, user_id, trip_id, status, payment_flow, total_amount, paid_amount, invoice_id, invoice_url, created_at, updated_at)
VALUES ('mock-inv-01', 'TERRA-4001', 'u-customer-04', 't-europe-01', 'AWAITING_DEPOSIT', 'invoice', 8500, 0, 'INV2-MOCK-001', 'https://www.sandbox.paypal.com/invoice/p/#INV2-MOCK-001', datetime('now', '-8 days'), datetime('now', '-8 days'));

-- Invoice: European tour fully paid (22 days ago)
INSERT OR IGNORE INTO bookings (id, booking_reference, user_id, trip_id, status, payment_flow, total_amount, paid_amount, invoice_id, created_at, updated_at)
VALUES ('mock-inv-02', 'TERRA-4015', 'u-customer-02', 't-europe-01', 'FULLY_PAID', 'invoice', 12000, 12000, 'INV2-MOCK-002', datetime('now', '-22 days'), datetime('now', '-18 days'));
INSERT OR IGNORE INTO booking_charges (id, booking_id, type, description, amount, paypal_capture_id, status, created_at) VALUES
  ('mc-inv-02a', 'mock-inv-02', 'deposit', 'Deposit for Custom European Grand Tour', 4800, 'mock_cap_i2a', 'completed', datetime('now', '-20 days')),
  ('mc-inv-02b', 'mock-inv-02', 'balance', 'Balance for Custom European Grand Tour', 7200, 'mock_cap_i2b', 'completed', datetime('now', '-18 days'));

-- Instant: Economy sedan 3-day (10 days ago)
INSERT OR IGNORE INTO bookings (id, booking_reference, user_id, trip_id, status, payment_flow, total_amount, paid_amount, pickup_date, dropoff_date, created_at, updated_at)
VALUES ('mock-car-01', 'TERRA-5001', 'u-customer-03', 't-car-01', 'CONFIRMED', 'instant', 150, 150, date('now', '-7 days'), date('now', '-4 days'), datetime('now', '-10 days'), datetime('now', '-10 days'));
INSERT OR IGNORE INTO booking_charges (id, booking_id, type, description, amount, paypal_capture_id, status, created_at) VALUES
  ('mc-car-01a', 'mock-car-01', 'full_payment', 'Full payment for Economy Sedan (3 days)', 150, 'mock_cap_c1a', 'completed', datetime('now', '-10 days'));

-- Instant: SUV 5-day (6 days ago)
INSERT OR IGNORE INTO bookings (id, booking_reference, user_id, trip_id, status, payment_flow, total_amount, paid_amount, pickup_date, dropoff_date, created_at, updated_at)
VALUES ('mock-car-02', 'TERRA-5018', 'u-customer-04', 't-car-02', 'CONFIRMED', 'instant', 500, 500, date('now', '-3 days'), date('now', '+2 days'), datetime('now', '-6 days'), datetime('now', '-6 days'));
INSERT OR IGNORE INTO booking_charges (id, booking_id, type, description, amount, paypal_capture_id, status, created_at) VALUES
  ('mc-car-02a', 'mock-car-02', 'full_payment', 'Full payment for SUV (5 days)', 500, 'mock_cap_c2a', 'completed', datetime('now', '-6 days'));

-- Instant: Luxury 2-day (2 days ago)
INSERT OR IGNORE INTO bookings (id, booking_reference, user_id, trip_id, status, payment_flow, total_amount, paid_amount, pickup_date, dropoff_date, created_at, updated_at)
VALUES ('mock-car-03', 'TERRA-5030', 'u-customer-05', 't-car-03', 'CONFIRMED', 'instant', 300, 300, date('now', '+1 days'), date('now', '+3 days'), datetime('now', '-2 days'), datetime('now', '-2 days'));
INSERT OR IGNORE INTO booking_charges (id, booking_id, type, description, amount, paypal_capture_id, status, created_at) VALUES
  ('mc-car-03a', 'mock-car-03', 'full_payment', 'Full payment for Luxury Convertible (2 days)', 300, 'mock_cap_c3a', 'completed', datetime('now', '-2 days'));

-- Instant: Economy 7-day (18 days ago)
INSERT OR IGNORE INTO bookings (id, booking_reference, user_id, trip_id, status, payment_flow, total_amount, paid_amount, pickup_date, dropoff_date, created_at, updated_at)
VALUES ('mock-car-04', 'TERRA-5045', 'u-customer-02', 't-car-01', 'CONFIRMED', 'instant', 350, 350, date('now', '-15 days'), date('now', '-8 days'), datetime('now', '-18 days'), datetime('now', '-18 days'));
INSERT OR IGNORE INTO booking_charges (id, booking_id, type, description, amount, paypal_capture_id, status, created_at) VALUES
  ('mc-car-04a', 'mock-car-04', 'full_payment', 'Full payment for Economy Sedan (7 days)', 350, 'mock_cap_c4a', 'completed', datetime('now', '-18 days'));

-- Voided: Tokyo cancelled (14 days ago)
INSERT OR IGNORE INTO bookings (id, booking_reference, user_id, trip_id, status, payment_flow, total_amount, paid_amount, paypal_order_id, authorization_id, created_at, updated_at)
VALUES ('mock-void-01', 'TERRA-6001', 'u-customer-04', 't-tokyo-01', 'VOIDED', 'authorize', 800, 200, 'mock_order_void', 'mock_auth_void', datetime('now', '-14 days'), datetime('now', '-12 days'));
INSERT OR IGNORE INTO booking_charges (id, booking_id, type, description, amount, paypal_capture_id, status, created_at) VALUES
  ('mc-void-01a', 'mock-void-01', 'deposit', 'Deposit for Tokyo Cherry Blossom Express', 200, 'mock_cap_void', 'completed', datetime('now', '-14 days'));

-- ============================================
-- JANUARY 2026 MOCK BOOKINGS
-- ============================================

-- Jan: Tokyo fully captured
INSERT OR IGNORE INTO bookings (id, booking_reference, user_id, trip_id, status, payment_flow, total_amount, paid_amount, paypal_order_id, authorization_id, created_at, updated_at)
VALUES ('mock-jan-01', 'TERRA-7001', 'u-customer-02', 't-tokyo-01', 'FULLY_CAPTURED', 'authorize', 800, 800, 'mock_order_j1', 'mock_auth_j1', '2026-01-05 10:00:00', '2026-01-08 14:00:00');
INSERT OR IGNORE INTO booking_charges (id, booking_id, type, description, amount, paypal_capture_id, status, created_at) VALUES
  ('mc-jan-01a', 'mock-jan-01', 'deposit', 'Deposit for Tokyo Cherry Blossom Express', 200, 'mock_cap_j1a', 'completed', '2026-01-05 10:00:00'),
  ('mc-jan-01b', 'mock-jan-01', 'balance', 'Balance for Tokyo Cherry Blossom Express', 600, 'mock_cap_j1b', 'completed', '2026-01-08 14:00:00');

-- Jan: Bali vault completed
INSERT OR IGNORE INTO bookings (id, booking_reference, user_id, trip_id, status, payment_flow, total_amount, paid_amount, vault_token_id, created_at, updated_at)
VALUES ('mock-jan-02', 'TERRA-7010', 'u-customer-03', 't-bali-01', 'COMPLETED', 'vault', 2500, 2500, NULL, '2026-01-10 09:00:00', '2026-01-18 16:00:00');
INSERT OR IGNORE INTO booking_charges (id, booking_id, type, description, amount, paypal_capture_id, status, created_at) VALUES
  ('mc-jan-02a', 'mock-jan-02', 'setup_fee', 'Setup Fee for Bali Adventure Retreat', 500, 'mock_cap_j2a', 'completed', '2026-01-10 09:00:00'),
  ('mc-jan-02b', 'mock-jan-02', 'addon', 'Balinese Spa Treatment', 150, 'mock_cap_j2b', 'completed', '2026-01-12 11:00:00'),
  ('mc-jan-02c', 'mock-jan-02', 'addon', 'Scuba Diving Session', 200, 'mock_cap_j2c', 'completed', '2026-01-14 10:00:00'),
  ('mc-jan-02d', 'mock-jan-02', 'final', 'Final Settlement', 1650, 'mock_cap_j2d', 'completed', '2026-01-18 16:00:00');

-- Jan: Caribbean cruise fully captured
INSERT OR IGNORE INTO bookings (id, booking_reference, user_id, trip_id, status, payment_flow, total_amount, paid_amount, paypal_order_id, authorization_id, created_at, updated_at)
VALUES ('mock-jan-03', 'TERRA-7020', 'u-customer-04', 't-cruise-01', 'FULLY_CAPTURED', 'authorize', 2800, 2800, 'mock_order_j3', 'mock_auth_j3', '2026-01-15 14:00:00', '2026-01-22 10:00:00');
INSERT OR IGNORE INTO booking_charges (id, booking_id, type, description, amount, paypal_capture_id, status, created_at) VALUES
  ('mc-jan-03a', 'mock-jan-03', 'deposit', 'Deposit for Caribbean Island Hopper', 700, 'mock_cap_j3a', 'completed', '2026-01-15 14:00:00'),
  ('mc-jan-03b', 'mock-jan-03', 'balance', 'Balance for Caribbean Island Hopper', 2100, 'mock_cap_j3b', 'completed', '2026-01-22 10:00:00');

-- Jan: Economy sedan 5-day rental
INSERT OR IGNORE INTO bookings (id, booking_reference, user_id, trip_id, status, payment_flow, total_amount, paid_amount, pickup_date, dropoff_date, created_at, updated_at)
VALUES ('mock-jan-04', 'TERRA-7030', 'u-customer-05', 't-car-01', 'CONFIRMED', 'instant', 250, 250, '2026-01-20', '2026-01-25', '2026-01-18 12:00:00', '2026-01-18 12:00:00');
INSERT OR IGNORE INTO booking_charges (id, booking_id, type, description, amount, paypal_capture_id, status, created_at) VALUES
  ('mc-jan-04a', 'mock-jan-04', 'full_payment', 'Full payment for Economy Sedan (5 days)', 250, 'mock_cap_j4a', 'completed', '2026-01-18 12:00:00');

-- Jan: European invoice fully paid
INSERT OR IGNORE INTO bookings (id, booking_reference, user_id, trip_id, status, payment_flow, total_amount, paid_amount, invoice_id, created_at, updated_at)
VALUES ('mock-jan-05', 'TERRA-7040', 'u-customer-02', 't-europe-01', 'FULLY_PAID', 'invoice', 9500, 9500, 'INV2-MOCK-J01', '2026-01-08 11:00:00', '2026-01-20 15:00:00');
INSERT OR IGNORE INTO booking_charges (id, booking_id, type, description, amount, paypal_capture_id, status, created_at) VALUES
  ('mc-jan-05a', 'mock-jan-05', 'deposit', 'Deposit for Custom European Grand Tour', 3800, 'mock_cap_j5a', 'completed', '2026-01-10 09:00:00'),
  ('mc-jan-05b', 'mock-jan-05', 'balance', 'Balance for Custom European Grand Tour', 5700, 'mock_cap_j5b', 'completed', '2026-01-20 15:00:00');

-- Jan: Luxury convertible 3-day rental
INSERT OR IGNORE INTO bookings (id, booking_reference, user_id, trip_id, status, payment_flow, total_amount, paid_amount, pickup_date, dropoff_date, created_at, updated_at)
VALUES ('mock-jan-06', 'TERRA-7050', 'u-customer-03', 't-car-03', 'CONFIRMED', 'instant', 450, 450, '2026-01-25', '2026-01-28', '2026-01-23 10:00:00', '2026-01-23 10:00:00');
INSERT OR IGNORE INTO booking_charges (id, booking_id, type, description, amount, paypal_capture_id, status, created_at) VALUES
  ('mc-jan-06a', 'mock-jan-06', 'full_payment', 'Full payment for Luxury Convertible (3 days)', 450, 'mock_cap_j6a', 'completed', '2026-01-23 10:00:00');

-- Jan: Alaska cruise fully captured
INSERT OR IGNORE INTO bookings (id, booking_reference, user_id, trip_id, status, payment_flow, total_amount, paid_amount, paypal_order_id, authorization_id, created_at, updated_at)
VALUES ('mock-jan-07', 'TERRA-7060', 'u-customer-05', 't-cruise-03', 'FULLY_CAPTURED', 'authorize', 1900, 1900, 'mock_order_j7', 'mock_auth_j7', '2026-01-20 16:00:00', '2026-01-27 11:00:00');
INSERT OR IGNORE INTO booking_charges (id, booking_id, type, description, amount, paypal_capture_id, status, created_at) VALUES
  ('mc-jan-07a', 'mock-jan-07', 'deposit', 'Deposit for Alaska Glacier Discovery', 475, 'mock_cap_j7a', 'completed', '2026-01-20 16:00:00'),
  ('mc-jan-07b', 'mock-jan-07', 'balance', 'Balance for Alaska Glacier Discovery', 1425, 'mock_cap_j7b', 'completed', '2026-01-27 11:00:00');

-- ============================================
-- FEBRUARY 2026 MOCK BOOKINGS
-- ============================================

-- Feb: Tokyo fully captured
INSERT OR IGNORE INTO bookings (id, booking_reference, user_id, trip_id, status, payment_flow, total_amount, paid_amount, paypal_order_id, authorization_id, created_at, updated_at)
VALUES ('mock-feb-01', 'TERRA-8001', 'u-customer-04', 't-tokyo-01', 'FULLY_CAPTURED', 'authorize', 800, 800, 'mock_order_f1', 'mock_auth_f1', '2026-02-02 09:00:00', '2026-02-05 12:00:00');
INSERT OR IGNORE INTO booking_charges (id, booking_id, type, description, amount, paypal_capture_id, status, created_at) VALUES
  ('mc-feb-01a', 'mock-feb-01', 'deposit', 'Deposit for Tokyo Cherry Blossom Express', 200, 'mock_cap_f1a', 'completed', '2026-02-02 09:00:00'),
  ('mc-feb-01b', 'mock-feb-01', 'balance', 'Balance for Tokyo Cherry Blossom Express', 600, 'mock_cap_f1b', 'completed', '2026-02-05 12:00:00');

-- Feb: Mediterranean cruise fully captured
INSERT OR IGNORE INTO bookings (id, booking_reference, user_id, trip_id, status, payment_flow, total_amount, paid_amount, paypal_order_id, authorization_id, created_at, updated_at)
VALUES ('mock-feb-02', 'TERRA-8010', 'u-customer-02', 't-cruise-02', 'FULLY_CAPTURED', 'authorize', 4500, 4500, 'mock_order_f2', 'mock_auth_f2', '2026-02-05 15:00:00', '2026-02-14 10:00:00');
INSERT OR IGNORE INTO booking_charges (id, booking_id, type, description, amount, paypal_capture_id, status, created_at) VALUES
  ('mc-feb-02a', 'mock-feb-02', 'deposit', 'Deposit for Mediterranean Explorer', 1125, 'mock_cap_f2a', 'completed', '2026-02-05 15:00:00'),
  ('mc-feb-02b', 'mock-feb-02', 'balance', 'Balance for Mediterranean Explorer', 3375, 'mock_cap_f2b', 'completed', '2026-02-14 10:00:00');

-- Feb: Bali vault completed
INSERT OR IGNORE INTO bookings (id, booking_reference, user_id, trip_id, status, payment_flow, total_amount, paid_amount, vault_token_id, created_at, updated_at)
VALUES ('mock-feb-03', 'TERRA-8020', 'u-customer-05', 't-bali-01', 'COMPLETED', 'vault', 2500, 2500, NULL, '2026-02-08 10:00:00', '2026-02-16 14:00:00');
INSERT OR IGNORE INTO booking_charges (id, booking_id, type, description, amount, paypal_capture_id, status, created_at) VALUES
  ('mc-feb-03a', 'mock-feb-03', 'setup_fee', 'Setup Fee for Bali Adventure Retreat', 500, 'mock_cap_f3a', 'completed', '2026-02-08 10:00:00'),
  ('mc-feb-03b', 'mock-feb-03', 'addon', 'Balinese Spa Treatment', 150, 'mock_cap_f3b', 'completed', '2026-02-10 09:00:00'),
  ('mc-feb-03c', 'mock-feb-03', 'addon', 'Kecak Fire Dance Event', 120, 'mock_cap_f3c', 'completed', '2026-02-12 18:00:00'),
  ('mc-feb-03d', 'mock-feb-03', 'addon', 'Scuba Diving Session', 200, 'mock_cap_f3d', 'completed', '2026-02-13 10:00:00'),
  ('mc-feb-03e', 'mock-feb-03', 'final', 'Final Settlement', 1530, 'mock_cap_f3e', 'completed', '2026-02-16 14:00:00');

-- Feb: SUV 4-day rental
INSERT OR IGNORE INTO bookings (id, booking_reference, user_id, trip_id, status, payment_flow, total_amount, paid_amount, pickup_date, dropoff_date, created_at, updated_at)
VALUES ('mock-feb-04', 'TERRA-8030', 'u-customer-03', 't-car-02', 'CONFIRMED', 'instant', 400, 400, '2026-02-12', '2026-02-16', '2026-02-10 11:00:00', '2026-02-10 11:00:00');
INSERT OR IGNORE INTO booking_charges (id, booking_id, type, description, amount, paypal_capture_id, status, created_at) VALUES
  ('mc-feb-04a', 'mock-feb-04', 'full_payment', 'Full payment for SUV (4 days)', 400, 'mock_cap_f4a', 'completed', '2026-02-10 11:00:00');

-- Feb: European invoice fully paid
INSERT OR IGNORE INTO bookings (id, booking_reference, user_id, trip_id, status, payment_flow, total_amount, paid_amount, invoice_id, created_at, updated_at)
VALUES ('mock-feb-05', 'TERRA-8040', 'u-customer-04', 't-europe-01', 'FULLY_PAID', 'invoice', 11000, 11000, 'INV2-MOCK-F01', '2026-02-04 13:00:00', '2026-02-18 10:00:00');
INSERT OR IGNORE INTO booking_charges (id, booking_id, type, description, amount, paypal_capture_id, status, created_at) VALUES
  ('mc-feb-05a', 'mock-feb-05', 'deposit', 'Deposit for Custom European Grand Tour', 4400, 'mock_cap_f5a', 'completed', '2026-02-06 09:00:00'),
  ('mc-feb-05b', 'mock-feb-05', 'balance', 'Balance for Custom European Grand Tour', 6600, 'mock_cap_f5b', 'completed', '2026-02-18 10:00:00');

-- Feb: Economy sedan 10-day rental
INSERT OR IGNORE INTO bookings (id, booking_reference, user_id, trip_id, status, payment_flow, total_amount, paid_amount, pickup_date, dropoff_date, created_at, updated_at)
VALUES ('mock-feb-06', 'TERRA-8050', 'u-customer-02', 't-car-01', 'CONFIRMED', 'instant', 500, 500, '2026-02-15', '2026-02-25', '2026-02-13 14:00:00', '2026-02-13 14:00:00');
INSERT OR IGNORE INTO booking_charges (id, booking_id, type, description, amount, paypal_capture_id, status, created_at) VALUES
  ('mc-feb-06a', 'mock-feb-06', 'full_payment', 'Full payment for Economy Sedan (10 days)', 500, 'mock_cap_f6a', 'completed', '2026-02-13 14:00:00');

-- Feb: Caribbean cruise fully captured
INSERT OR IGNORE INTO bookings (id, booking_reference, user_id, trip_id, status, payment_flow, total_amount, paid_amount, paypal_order_id, authorization_id, created_at, updated_at)
VALUES ('mock-feb-07', 'TERRA-8060', 'u-customer-03', 't-cruise-01', 'FULLY_CAPTURED', 'authorize', 2800, 2800, 'mock_order_f7', 'mock_auth_f7', '2026-02-18 10:00:00', '2026-02-24 16:00:00');
INSERT OR IGNORE INTO booking_charges (id, booking_id, type, description, amount, paypal_capture_id, status, created_at) VALUES
  ('mc-feb-07a', 'mock-feb-07', 'deposit', 'Deposit for Caribbean Island Hopper', 700, 'mock_cap_f7a', 'completed', '2026-02-18 10:00:00'),
  ('mc-feb-07b', 'mock-feb-07', 'balance', 'Balance for Caribbean Island Hopper', 2100, 'mock_cap_f7b', 'completed', '2026-02-24 16:00:00');

-- Feb: Tokyo voided (cancelled booking)
INSERT OR IGNORE INTO bookings (id, booking_reference, user_id, trip_id, status, payment_flow, total_amount, paid_amount, paypal_order_id, authorization_id, created_at, updated_at)
VALUES ('mock-feb-08', 'TERRA-8070', 'u-customer-05', 't-tokyo-01', 'VOIDED', 'authorize', 800, 200, 'mock_order_f8', 'mock_auth_f8', '2026-02-20 09:00:00', '2026-02-22 11:00:00');
INSERT OR IGNORE INTO booking_charges (id, booking_id, type, description, amount, paypal_capture_id, status, created_at) VALUES
  ('mc-feb-08a', 'mock-feb-08', 'deposit', 'Deposit for Tokyo Cherry Blossom Express', 200, 'mock_cap_f8a', 'completed', '2026-02-20 09:00:00');

-- Feb: Luxury convertible 2-day rental
INSERT OR IGNORE INTO bookings (id, booking_reference, user_id, trip_id, status, payment_flow, total_amount, paid_amount, pickup_date, dropoff_date, created_at, updated_at)
VALUES ('mock-feb-09', 'TERRA-8080', 'u-customer-04', 't-car-03', 'CONFIRMED', 'instant', 300, 300, '2026-02-26', '2026-02-28', '2026-02-24 15:00:00', '2026-02-24 15:00:00');
INSERT OR IGNORE INTO booking_charges (id, booking_id, type, description, amount, paypal_capture_id, status, created_at) VALUES
  ('mc-feb-09a', 'mock-feb-09', 'full_payment', 'Full payment for Luxury Convertible (2 days)', 300, 'mock_cap_f9a', 'completed', '2026-02-24 15:00:00');
