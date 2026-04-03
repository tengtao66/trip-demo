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
