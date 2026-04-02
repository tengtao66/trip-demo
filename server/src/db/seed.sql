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
