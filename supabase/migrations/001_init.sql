-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Categories table (editable from frontend)
CREATE TABLE categories (
  id   serial PRIMARY KEY,
  name text UNIQUE NOT NULL
);

INSERT INTO categories (name) VALUES
  ('Création vidéo & image'),
  ('Design & branding'),
  ('Dev & code'),
  ('Productivité'),
  ('Automatisation');

-- Tools table
CREATE TABLE tools (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  url                 text NOT NULL UNIQUE,
  type                text NOT NULL CHECK (type IN ('Outil', 'Plugin', 'Skill', 'Tip', 'Ressource')),
  category            text NOT NULL,
  keywords            text[] NOT NULL DEFAULT '{}',
  interest            text NOT NULL CHECK (interest IN ('Faible', 'Moyen', 'Élevé', 'Très élevé')),
  implementation_time text,
  what_is_it          text NOT NULL,
  what_for            text NOT NULL,
  studio_interest     text NOT NULL,
  added_by            text,
  added_at            timestamptz NOT NULL DEFAULT now()
);

-- Allow public read/write (no auth per spec)
ALTER TABLE tools     ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all_tools"      ON tools      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_categories" ON categories FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for tools table
ALTER PUBLICATION supabase_realtime ADD TABLE tools;
