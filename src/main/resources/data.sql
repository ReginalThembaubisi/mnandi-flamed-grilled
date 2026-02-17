INSERT INTO users (username, password, role)
SELECT 'admin', '$2b$10$sZ1uAVGP1sUw.QvnawfxyuUe9Jw9um00/I0KrmGXQIUmwXPE/aEu6', 'ADMIN'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');
