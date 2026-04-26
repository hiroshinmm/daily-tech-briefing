const http = require('http');
const https = require('https');
const config = require('./src/config');

async function checkUrl(urlStr) {
    return new Promise((resolve) => {
        const parsed = new URL(urlStr);
        const client = parsed.protocol === 'https:' ? https : http;
        const req = client.get(urlStr, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
            if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
                resolve(checkUrl(new URL(res.headers.location, urlStr).toString()));
                return;
            }
            resolve(res.statusCode);
        }).on('error', (err) => {
            resolve('ERROR ' + err.message);
        });
        req.setTimeout(5000, () => {
            req.destroy();
            resolve('TIMEOUT');
        });
    });
}

async function main() {
    for (const [category, urls] of Object.entries(config.feeds)) {
        console.log(`\n--- ${category} ---`);
        for (const url of urls) {
            const status = await checkUrl(url);
            console.log(`[${status}] ${url}`);
        }
    }
}

main();
