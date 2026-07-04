-- Create exam timetable table
CREATE TABLE IF NOT EXISTS exam_timetable (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  day TEXT,
  semester TEXT NOT NULL,
  subject_code TEXT,
  scheme TEXT DEFAULT '2019',
  slot TEXT,
  session TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin password (change this later through the app)
INSERT INTO admin_settings (key, value) VALUES ('admin_password', 'admin123')
ON CONFLICT (key) DO NOTHING;

-- Allow public read access to timetable
ALTER TABLE exam_timetable ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Access' AND tablename = 'exam_timetable') THEN
    CREATE POLICY "Public Read Access" ON exam_timetable FOR SELECT USING (true);
  END IF;
END
$$;
