-- Demo catalog for local academic development. Safe to run repeatedly.
INSERT INTO products (name, category, price, stock, description)
SELECT seed.name, seed.category, seed.price, seed.stock, seed.description
FROM (VALUES
  ('Headphone Studio Wireless', 'Audio', 429000, 24, 'Headphone wireless dengan suara detail, bantalan nyaman, dan baterai tahan lama.'),
  ('Smartwatch Active Pro', 'Elektronik', 689000, 18, 'Pantau aktivitas harian, notifikasi, dan kesehatan dengan desain minimalis.'),
  ('Jam Tangan Minimalis', 'Aksesori', 315000, 12, 'Jam tangan bergaya minimalis yang cocok untuk aktivitas sehari-hari.'),
  ('Tas Daily Canvas', 'Fashion', 189000, 30, 'Tas serbaguna berbahan canvas dengan ruang penyimpanan yang praktis.'),
  ('Lampu Meja Nordic', 'Rumah', 245000, 9, 'Lampu meja dengan desain modern untuk ruang kerja dan kamar.'),
  ('Kamera Pocket Digital', 'Elektronik', 1250000, 7, 'Kamera ringkas untuk mengabadikan momen dan perjalanan.'),
  ('Sneakers Urban Flex', 'Fashion', 549000, 15, 'Sneakers kasual dengan bantalan empuk dan tampilan kontemporer.'),
  ('Mouse Gaming Precision', 'Gaming', 279000, 20, 'Mouse gaming ergonomis dengan sensor presisi dan tombol responsif.')
) AS seed(name, category, price, stock, description)
WHERE NOT EXISTS (SELECT 1 FROM products existing WHERE LOWER(existing.name) = LOWER(seed.name));
