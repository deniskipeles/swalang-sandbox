-- Supabase Schema for Swalang Modules

-- 1. Create a table for package authors
-- This table stores unique authors to avoid data duplication.
CREATE TABLE authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create a table for packages
-- This is the main table for package information. It links to an author.
CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  readme TEXT,
  author_id UUID REFERENCES authors(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create a table for package versions
-- This table stores version history for each package.
CREATE TABLE versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  version_string TEXT NOT NULL,
  published_at DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(package_id, version_string) -- A package can only have a specific version string once
);

-- 4. Create a table for keywords
-- Stores unique keywords for categorization and search.
CREATE TABLE keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Create a join table for the many-to-many relationship between packages and keywords
CREATE TABLE package_keywords (
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  PRIMARY KEY (package_id, keyword_id)
);

-- 6. Add indexes for performance on frequently queried columns
CREATE INDEX idx_packages_name ON packages(name);
CREATE INDEX idx_authors_name ON authors(name);
CREATE INDEX idx_keywords_name ON keywords(name);
CREATE INDEX idx_versions_package_id ON versions(package_id);

-- 7. Set up Row Level Security (RLS) for all tables
-- This is a Supabase best practice to ensure your data is secure by default.
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_keywords ENABLE ROW LEVEL SECURITY;

-- 8. Create policies to allow public read access to all data.
-- This makes the data viewable by anyone, which is typical for a public package registry.
CREATE POLICY "Allow public read access on authors"
  ON authors FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access on packages"
  ON packages FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access on versions"
  ON versions FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access on keywords"
  ON keywords FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access on package_keywords"
  ON package_keywords FOR SELECT
  USING (true);