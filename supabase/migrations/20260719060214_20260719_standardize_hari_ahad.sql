-- Standardize 'Minggu' → 'Ahad' in real tables with hari columns
UPDATE jadwal_mengajar SET hari = 'Ahad' WHERE hari = 'Minggu';
UPDATE jadwal SET hari = 'Ahad' WHERE hari = 'Minggu';
