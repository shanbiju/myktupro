const { Client } = require('pg');

const regions = [
    'ap-south-1',
    'ap-southeast-1',
    'ap-southeast-2',
    'ap-northeast-1',
    'ap-northeast-2',
    'eu-west-1',
    'eu-west-2',
    'eu-west-3',
    'eu-central-1',
    'us-east-1',
    'us-east-2',
    'us-west-1',
    'us-west-2',
    'sa-east-1',
    'ca-central-1'
];

async function test() {
    for (const region of regions) {
        const host = `aws-0-${region}.pooler.supabase.com`;
        const connectionString = `postgresql://postgres.yauscubichhabeuoxvmz:ChoiceKTU123!@${host}:6543/postgres`;
        const client = new Client({ 
            connectionString,
            ssl: {
                rejectUnauthorized: false
            }
        });
        
        try {
            await client.connect();
            console.log(`\n>>> SUCCESS: Connected to region ${region}! Host: ${host}`);
            await client.end();
            return;
        } catch (err) {
            if (err.message && err.message.includes('tenant/user postgres.yauscubichhabeuoxvmz not found')) {
                console.log(`[-] Region ${region}: Tenant not found`);
            } else {
                console.log(`[!] Region ${region}: ${err.message}`);
            }
        }
    }
    console.log('\nAll regions finished testing.');
}

test();
