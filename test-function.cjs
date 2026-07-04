

const SUPABASE_URL = "https://yauscubichhabeuoxvmz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhdXNjdWJpY2hoYWJldW94dm16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5MDkyNDcsImV4cCI6MjA4ODQ4NTI0N30.BlNmZXW0Q_yzdt8OfJTvv-3odKc0M5NNLsNub4VlqRE";

async function run() {
    try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-api`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: 'verify', password: 'admin123' })
        });
        
        console.log('Status Code:', res.status);
        const text = await res.text();
        console.log('Response Body:', text);
    } catch (err) {
        console.error(err);
    }
}

run();
