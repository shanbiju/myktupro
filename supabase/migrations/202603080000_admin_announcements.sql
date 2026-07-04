CREATE TABLE IF NOT EXISTS admin_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  link TEXT,
  published_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Allow public read access so everyone can see announcements
ALTER TABLE admin_announcements ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Access Admin Announcements' AND tablename = 'admin_announcements') THEN
    CREATE POLICY "Public Read Access Admin Announcements" ON admin_announcements FOR SELECT USING (true);
  END IF;
END
$$;
