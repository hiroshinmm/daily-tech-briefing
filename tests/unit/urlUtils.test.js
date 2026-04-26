'use strict';

const { decodeGoogleNewsUrl, getRandomUA, USER_AGENTS, PUPPETEER_ARGS, resolveUrlOnline } = require('../../src/urlUtils');

// UU-01〜04: decodeGoogleNewsUrl
describe('decodeGoogleNewsUrl', () => {
    test('UU-01: Google News以外のURLはそのまま返す', () => {
        const url = 'https://example.com/article/123';
        expect(decodeGoogleNewsUrl(url)).toBe(url);
    });

    test('UU-02: CBMペイロードからhttpURLを抽出する', () => {
        // バイナリプレフィックス + ターゲットURL をbase64エンコードしてCBM形式に組み立て
        const target = 'https://example.com/article';
        const payload = Buffer.from('\x0a\x0c' + target, 'binary');
        const b64 = payload.toString('base64').replace(/\//g, '_').replace(/\+/g, '-').replace(/=/g, '');
        const googleUrl = `https://news.google.com/rss/articles/CBM${b64}`;
        expect(decodeGoogleNewsUrl(googleUrl)).toBe(target);
    });

    test('UU-03: httpを含まないCBMペイロードは元のURLを返す', () => {
        const payload = Buffer.from('\x01\x02no-url-here', 'binary');
        const b64 = payload.toString('base64').replace(/\//g, '_');
        const url = `https://news.google.com/rss/articles/CBM${b64}`;
        expect(decodeGoogleNewsUrl(url)).toBe(url);
    });

    test('UU-04: 不正なURLでも例外をスローせず元の文字列を返す', () => {
        const badUrl = 'https://news.google.com/rss/articles/CBM!!!invalid!!!';
        expect(() => decodeGoogleNewsUrl(badUrl)).not.toThrow();
        expect(decodeGoogleNewsUrl(badUrl)).toBe(badUrl);
    });
});

// UU-05〜07: getRandomUA / USER_AGENTS / PUPPETEER_ARGS
describe('getRandomUA', () => {
    test('UU-05: USER_AGENTS内の文字列を返す', () => {
        const ua = getRandomUA();
        expect(USER_AGENTS).toContain(ua);
    });
});

describe('USER_AGENTS', () => {
    test('UU-06: 1件以上の非空文字列配列', () => {
        expect(Array.isArray(USER_AGENTS)).toBe(true);
        expect(USER_AGENTS.length).toBeGreaterThan(0);
        USER_AGENTS.forEach(ua => {
            expect(typeof ua).toBe('string');
            expect(ua.length).toBeGreaterThan(0);
        });
    });
});

describe('PUPPETEER_ARGS', () => {
    test('UU-07: --no-sandbox を含む配列', () => {
        expect(Array.isArray(PUPPETEER_ARGS)).toBe(true);
        expect(PUPPETEER_ARGS).toContain('--no-sandbox');
        expect(PUPPETEER_ARGS).toContain('--disable-setuid-sandbox');
    });
});

// UU-08〜10: resolveUrlOnline
describe('resolveUrlOnline', () => {
    let originalFetch;

    beforeEach(() => {
        originalFetch = global.fetch;
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    test('UU-08: /rss/articles/ URLで非GoogleのURLに解決できる', async () => {
        const resolved = 'https://techcrunch.com/article/123';
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            url: resolved,
            text: jest.fn().mockResolvedValue('')
        });

        const input = 'https://news.google.com/rss/articles/CBMabc?hl=en';
        const result = await resolveUrlOnline(input);
        expect(result).toBe(resolved);
    });

    test('UU-09: fetchがエラーを投げた場合は元のURLを返す', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
        const input = 'https://news.google.com/rss/articles/CBMabc';
        const result = await resolveUrlOnline(input);
        expect(result).toBe(input);
    });

    test('UU-10: 全fetchがgoogle.com URLを返す場合は元のURLを返す', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            url: 'https://consent.google.com/ml?continue=...',
            text: jest.fn().mockResolvedValue('<html>no data-n-au here</html>')
        });
        const input = 'https://news.google.com/rss/articles/CBMabc';
        const result = await resolveUrlOnline(input);
        expect(result).toBe(input);
    });
});
