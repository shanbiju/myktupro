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
        const res = await client.query('SELECT * FROM admin_settings;');
        console.log('Admin Settings:', res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

run();
