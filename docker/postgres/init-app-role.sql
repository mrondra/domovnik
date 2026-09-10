-- Runs once, on the first initialisation of the data volume.
-- The application role owns nothing and has no BYPASSRLS, so row level security actually applies
-- to it (ADR 0013). Migrations and seed keep using the owner role from DATABASE_ADMIN_URL.
CREATE ROLE domovnik_app LOGIN PASSWORD 'domovnik';
GRANT USAGE ON SCHEMA public TO domovnik_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO domovnik_app;
CREATE EXTENSION IF NOT EXISTS vector;
