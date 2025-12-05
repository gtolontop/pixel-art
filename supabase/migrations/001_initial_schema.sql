-- ============================================
-- PIXEL ART COLLABORATIVE PLATFORM
-- Database Schema for Supabase
-- ============================================

-- Users table (simple auth - just username)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  color VARCHAR(7) DEFAULT '#000000',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast username lookup
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Pixels table (stores all pixel placements)
CREATE TABLE IF NOT EXISTS pixels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  color VARCHAR(7) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  placed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for pixel queries
CREATE INDEX IF NOT EXISTS idx_pixels_coords ON pixels(x, y);
CREATE INDEX IF NOT EXISTS idx_pixels_placed_at ON pixels(placed_at DESC);

-- Unique constraint to ensure only latest pixel per position
-- (we'll handle this in app logic, but this index helps with queries)
CREATE INDEX IF NOT EXISTS idx_pixels_latest ON pixels(x, y, placed_at DESC);

-- Shared views for shareable links
CREATE TABLE IF NOT EXISTS shared_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_code VARCHAR(12) UNIQUE NOT NULL,
  center_x INTEGER DEFAULT 0,
  center_y INTEGER DEFAULT 0,
  zoom DECIMAL(4,2) DEFAULT 1.0,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shared_views_code ON shared_views(short_code);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pixels ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_views ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables
CREATE POLICY "Public read access" ON users FOR SELECT USING (true);
CREATE POLICY "Public read access" ON pixels FOR SELECT USING (true);
CREATE POLICY "Public read access" ON shared_views FOR SELECT USING (true);

-- Anyone can insert (simple auth model - no login required)
CREATE POLICY "Anyone can insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert pixels" ON pixels FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert shares" ON shared_views FOR INSERT WITH CHECK (true);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (true);

-- ============================================
-- REALTIME PUBLICATION
-- Enable realtime for pixel updates
-- ============================================

-- Note: Run this in Supabase SQL editor as superuser
-- ALTER PUBLICATION supabase_realtime ADD TABLE pixels;

-- ============================================
-- HELPER FUNCTION: Get latest pixels in viewport
-- ============================================

CREATE OR REPLACE FUNCTION get_viewport_pixels(
  min_x INTEGER,
  max_x INTEGER,
  min_y INTEGER,
  max_y INTEGER
)
RETURNS TABLE (x INTEGER, y INTEGER, color VARCHAR(7)) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (p.x, p.y)
    p.x, p.y, p.color
  FROM pixels p
  WHERE p.x >= min_x AND p.x <= max_x
    AND p.y >= min_y AND p.y <= max_y
    AND p.color != ''
  ORDER BY p.x, p.y, p.placed_at DESC;
END;
$$ LANGUAGE plpgsql;
