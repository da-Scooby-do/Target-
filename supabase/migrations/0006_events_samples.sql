-- Example events so the Events tab isn't empty. They show an "Example" label until staff edit them
-- (saving an event in the admin clears is_example). Replace or delete them before real promotion.

insert into public.events
  (slug, kind, title, summary, description, starts_at, ends_at, online, venue, city, country, image, capacity, price_note, language, status, is_example)
values
  ('shipping-to-the-middle-east-webinar', 'webinar',
   'Shipping to the Middle East: customs and Incoterms',
   'A one-hour online session on documents, duties and choosing the right Incoterm for Gulf shipments.',
   E'What you will learn:\n• Which documents Gulf customs ask for, and when\n• How Incoterms such as FOB, CIF and DAP change your costs and risks\n• Common delays and how to avoid them\n\nThere is time for questions at the end. You get the slides by email afterwards.',
   '2026-10-29 14:00:00+00', '2026-10-29 15:00:00+00', true, null, null, null,
   '/photos/container-ship.jpg', 300, 'Free', 'English', 'published', true),
  ('netherlands-gulf-trade-forum', 'conference',
   'Netherlands–Gulf Trade & Logistics Forum',
   'A day of talks and meetings for companies trading between the Netherlands and the Gulf region.',
   E'Programme:\n09:30 Welcome and coffee\n10:00 Trade outlook: Netherlands and the Gulf\n11:00 Panel: sea and air routes, costs and lead times\n13:00 Lunch and one-to-one meetings\n15:00 Workshop: sourcing and quality control\n16:30 Drinks\n\nSpeakers and venue will be announced. Registration is free; places are limited.',
   '2026-11-19 08:30:00+00', '2026-11-19 16:00:00+00', false, 'Venue to be announced', 'Rotterdam', 'Netherlands',
   '/photos/conference-hall.jpg', 120, 'Free', 'English and Arabic', 'published', true),
  ('zoetermeer-import-export-breakfast', 'networking',
   'Import & export breakfast',
   'An informal morning meeting for local companies that ship abroad.',
   E'Meet other importers and exporters from the region over breakfast. Our team shares this season''s freight market update and answers your questions about routes, customs and storage.',
   '2026-12-10 07:00:00+00', '2026-12-10 09:00:00+00', false, 'TFS office', 'Zoetermeer', 'Netherlands',
   '/photos/warehouse.jpg', 40, 'Free', 'English and Dutch', 'published', true),
  ('building-materials-trade-mission-turkey', 'trade_mission',
   'Trade mission: building materials in Turkey',
   'Four days visiting factories for doors, tiles and wood products, with meetings arranged for you.',
   E'Who it is for: buyers of doors, ceramics, wood and other building materials.\n\nWhat we arrange:\n• Visits to selected factories\n• One-to-one meetings with suppliers that match your needs\n• Local transport and interpreters\n\nFlights and hotels are booked by participants; we advise on both. The price depends on the number of participants.',
   '2027-02-09 07:00:00+00', '2027-02-12 16:00:00+00', false, null, 'Istanbul', 'Turkey',
   '/photos/port.jpg', 15, 'On request', 'English and Arabic', 'published', true);
