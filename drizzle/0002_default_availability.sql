-- Starter consultation hours (America/Chicago). Edit them any time in
-- /admin/availability; this only runs once and only if no hours exist yet.
--   Mon–Fri 5:00–7:30 pm, Sat 9:00 am–3:00 pm
INSERT INTO "availability_rules" ("weekday", "start_minute", "end_minute")
SELECT * FROM (VALUES
  (1, 1020, 1170), (2, 1020, 1170), (3, 1020, 1170), (4, 1020, 1170), (5, 1020, 1170),
  (6, 540, 900)
) AS v(weekday, start_minute, end_minute)
WHERE NOT EXISTS (SELECT 1 FROM "availability_rules");
