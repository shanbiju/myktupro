const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres.yauscubichhabeuoxvmz:Shan@biju2025@aws-1-ap-south-1.pooler.supabase.com:6543/postgres',
    ssl: {
        rejectUnauthorized: false
    }
});

async function run() {
    try {
        await client.connect();
        const res = await client.query(`
      CREATE TABLE IF NOT EXISTS admin_announcements (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title TEXT NOT NULL,
        link TEXT,
        published_date TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      ALTER TABLE admin_announcements ENABLE ROW LEVEL SECURITY;
      
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Access Admin Announcements' AND tablename = 'admin_announcements') THEN
          CREATE POLICY "Public Read Access Admin Announcements" ON admin_announcements FOR SELECT USING (true);
        END IF;
      END
      $$;

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

      CREATE TABLE IF NOT EXISTS admin_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      INSERT INTO admin_settings (key, value) VALUES ('admin_password', 'admin123')
      ON CONFLICT (key) DO NOTHING;

      ALTER TABLE exam_timetable ENABLE ROW LEVEL SECURITY;
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Access' AND tablename = 'exam_timetable') THEN
          CREATE POLICY "Public Read Access" ON exam_timetable FOR SELECT USING (true);
        END IF;
      END
      $$;

      ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Access Settings' AND tablename = 'admin_settings') THEN
          CREATE POLICY "Public Read Access Settings" ON admin_settings FOR SELECT USING (key != 'admin_password');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow Public Insert Settings' AND tablename = 'admin_settings') THEN
          CREATE POLICY "Allow Public Insert Settings" ON admin_settings FOR INSERT WITH CHECK (key != 'admin_password');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow Public Update Settings' AND tablename = 'admin_settings') THEN
          CREATE POLICY "Allow Public Update Settings" ON admin_settings FOR UPDATE USING (key != 'admin_password');
        END IF;
      END
      $$;
    `);
        console.log('Success');
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

run();
