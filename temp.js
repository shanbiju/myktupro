const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres.yauscubichhabeuoxvmz:ChoiceKTU123!@aws-0-ap-south-1.pooler.supabase.com:6543/postgres'
});

async function run() {
    await client.connect();
    try {
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
    `);
        console.log('Success');
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

run();
