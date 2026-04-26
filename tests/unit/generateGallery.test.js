'use strict';

const fs = require('fs');

// puppeteer をモック（require時にブラウザが起動しないようにする）
jest.mock('puppeteer', () => ({
    launch: jest.fn().mockResolvedValue({
        newPage: jest.fn(),
        close: jest.fn()
    })
}));

const { downloadImageToFile } = require('../../src/generateGallery');

describe('downloadImageToFile', () => {
    let originalFetch;
    let writeFileSyncSpy;

    beforeEach(() => {
        originalFetch = global.fetch;
        writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
    });

    afterEach(() => {
        global.fetch = originalFetch;
        writeFileSyncSpy.mockRestore();
    });

    test('GG-01: imageUrlがnullの場合はnullを返す', async () => {
        const result = await downloadImageToFile(null, null, '/tmp/test.jpg');
        expect(result).toBeNull();
    });

    test('GG-02: fetchが非OKレスポンスの場合はnullを返す', async () => {
        global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });
        const result = await downloadImageToFile('https://example.com/img.jpg', 'https://example.com', '/tmp/test.jpg');
        expect(result).toBeNull();
    });

    test('GG-03: fetchが成功した場合はdestPathを返す', async () => {
        const fakeBuffer = new ArrayBuffer(8);
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            arrayBuffer: jest.fn().mockResolvedValue(fakeBuffer)
        });

        const result = await downloadImageToFile('https://example.com/img.jpg', 'https://example.com', '/tmp/test.jpg');
        expect(result).toBe('/tmp/test.jpg');
        expect(writeFileSyncSpy).toHaveBeenCalledTimes(1);
    });

    test('GG-04: fetchがネットワークエラーの場合はnullを返す', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));
        const result = await downloadImageToFile('https://example.com/img.jpg', 'https://example.com', '/tmp/test.jpg');
        expect(result).toBeNull();
    });
});
