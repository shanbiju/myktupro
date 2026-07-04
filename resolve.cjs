const { Resolver } = require('dns').promises;
const resolver = new Resolver();
resolver.setServers(['8.8.8.8']);

async function run() {
    try {
        const hostnames = await resolver.reverse('2406:da1a:314:7101:5c04:90f4:e2f3:d2b4');
        console.log('Hostnames:', hostnames);
    } catch (err) {
        console.error('Reverse Lookup Error:', err);
    }
}

run();
