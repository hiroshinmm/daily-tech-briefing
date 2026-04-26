'use strict';

describe('config', () => {
    const EXPECTED_CATEGORIES = [
        'AI', 'SRD / XR', 'Gaming Monitor', 'Production Monitor',
        'Camera Control', 'Projector', 'LED Wall Display', 'TV', 'SONY', 'TCL'
    ];

    let config;

    beforeEach(() => {
        // require cache をクリアして環境変数の変更を反映できるようにする
        jest.resetModules();
        config = require('../../src/config');
    });

    test('CF-01: DAYS_TO_FETCH は正の数値', () => {
        expect(typeof config.DAYS_TO_FETCH).toBe('number');
        expect(config.DAYS_TO_FETCH).toBeGreaterThan(0);
    });

    test('CF-02: GEMINI_MODEL はデフォルト値を持つ非空文字列', () => {
        expect(typeof config.GEMINI_MODEL).toBe('string');
        expect(config.GEMINI_MODEL.length).toBeGreaterThan(0);
    });

    test('CF-03: GEMINI_MODEL は環境変数でオーバーライドできる', () => {
        jest.resetModules();
        process.env.GEMINI_MODEL = 'gemini-2.5-flash';
        const overridden = require('../../src/config');
        expect(overridden.GEMINI_MODEL).toBe('gemini-2.5-flash');
        delete process.env.GEMINI_MODEL;
    });

    test('CF-04: feeds に10カテゴリすべてが存在する', () => {
        EXPECTED_CATEGORIES.forEach(cat => {
            expect(config.feeds[cat]).toBeDefined();
        });
    });

    test('CF-05: 各カテゴリに1件以上のURLがある', () => {
        Object.entries(config.feeds).forEach(([category, urls]) => {
            expect(Array.isArray(urls)).toBe(true);
            expect(urls.length).toBeGreaterThan(0);
        });
    });

    test('CF-06: 全フィードURLが https:// で始まる', () => {
        Object.entries(config.feeds).forEach(([category, urls]) => {
            urls.forEach(url => {
                expect(url).toMatch(/^https:\/\//);
            });
        });
    });
});
