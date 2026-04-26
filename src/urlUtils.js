/**
 * URLユーティリティ: fetchNews.js と generateInsights.js が共有する
 * Google News URL の解決ロジック、および共通のブラウザ設定
 */

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
];

function getRandomUA() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

const PUPPETEER_ARGS = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-blink-features=AutomationControlled',
    '--disable-dev-shm-usage',
    '--disable-gpu'
];

/**
 * Google NewsのリンクからオリジナルのURLをオフラインで抽出する
 * Protobuf エンコードされた CBM... 形式に対応
 */
function decodeGoogleNewsUrl(encodedUrl) {
    if (!encodedUrl.includes('news.google.com')) return encodedUrl;
    try {
        const urlObj = new URL(encodedUrl);
        const pathParts = urlObj.pathname.split('/');
        const base64Str = pathParts.find(p => p.startsWith('CBM')) || pathParts[pathParts.length - 1];
        const actualBase64 = base64Str.startsWith('CBM') ? base64Str.substring(3) : base64Str;
        const buffer = Buffer.from(actualBase64, 'base64');
        const raw = buffer.toString('latin1');
        const start = raw.indexOf('http');
        if (start === -1) return encodedUrl;
        let url = '';
        for (let i = start; i < raw.length; i++) {
            const code = raw.charCodeAt(i);
            if (code < 32 || code > 126 || [34, 39, 60, 62].includes(code)) break;
            url += raw[i];
        }
        return url;
    } catch (e) {
        return encodedUrl;
    }
}

/**
 * オンラインで Google News リダイレクトを追跡して元の URL を解決する
 * CBMi (新フォーマット): /rss/articles/ → /articles/ にアクセスしてリダイレクト追跡
 * CBM  (旧フォーマット): fetch後のHTMLから data-n-au 等を抽出
 * ※ タイムアウト 10 秒でハング防止
 */
async function resolveUrlOnline(googleUrl) {
    const commonUAs = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
    ];

    const userAgent = commonUAs[0];

    try {
        if (googleUrl.includes('/rss/articles/')) {
            const articlesUrl = googleUrl
                .replace('/rss/articles/', '/articles/')
                .replace(/\?.*$/, '');
            try {
                const res = await fetch(articlesUrl, {
                    method: 'GET',
                    headers: {
                        'User-Agent': userAgent,
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
                        'Referer': 'https://news.google.com/',
                        'DNT': '1',
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1'
                    },
                    redirect: 'follow',
                    signal: AbortSignal.timeout(10000)
                });

                if (res.url && (res.url.includes('google.com/sorry') || res.url.includes('consent.google.com'))) {
                    const res2 = await fetch(articlesUrl, {
                        method: 'GET',
                        headers: { 'User-Agent': commonUAs[1], 'Referer': 'https://news.google.com/' },
                        redirect: 'follow',
                        signal: AbortSignal.timeout(10000)
                    });
                    if (res2.url && !res2.url.includes('google.com')) return res2.url;
                }

                if (res.url && !res.url.includes('google.com')) {
                    return res.url;
                }
            } catch (_) { /* fallthrough */ }
        }

        try {
            const response = await fetch(googleUrl, {
                method: 'GET',
                headers: { 'User-Agent': commonUAs[1], 'Referer': 'https://news.google.com/' },
                redirect: 'follow',
                signal: AbortSignal.timeout(10000)
            });

            if (response.url && !response.url.includes('google.com')) return response.url;

            const text = await response.text();
            const nauMatch = text.match(/data-n-au="([^"]+)"/);
            if (nauMatch) return nauMatch[1];

            const pMatch = text.match(/data-p="([^"]+)"/);
            if (pMatch && pMatch[1].startsWith('http')) return pMatch[1];
        } catch (e) {
            // Ignore
        }
        return googleUrl;
    } catch (e) {
        return googleUrl;
    }
}

module.exports = { decodeGoogleNewsUrl, resolveUrlOnline, USER_AGENTS, getRandomUA, PUPPETEER_ARGS };
