'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

jest.mock('puppeteer', () => ({
    launch: jest.fn().mockResolvedValue({
        newPage: jest.fn(),
        close: jest.fn()
    })
}));

const { downloadImageToFile, pruneArchives } = require('../../src/generateGallery');

// ---- downloadImageToFile ----

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

// ---- pruneArchives ----

function makeTmpArchive(baseDir, dateStr, content = '{}') {
    const [year, month, day] = dateStr.split('-');
    const dir = path.join(baseDir, year, month);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${day}.json`), content);
}

describe('pruneArchives', () => {
    let tmpDir;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'archives-test-'));
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    test('GG-05: cutoff より新しいファイルは削除しない', () => {
        const today = new Date();
        const recentDate = new Date(today);
        recentDate.setDate(today.getDate() - 10);
        const dateStr = recentDate.toISOString().slice(0, 10);

        makeTmpArchive(tmpDir, dateStr);
        const cutoff = new Date(today);
        cutoff.setDate(today.getDate() - 90);

        const deleted = pruneArchives(tmpDir, cutoff);
        expect(deleted).toBe(0);

        const [y, m, d] = dateStr.split('-');
        expect(fs.existsSync(path.join(tmpDir, y, m, `${d}.json`))).toBe(true);
    });

    test('GG-06: cutoff より古いファイルを削除する', () => {
        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 100);
        const dateStr = oldDate.toISOString().slice(0, 10);

        makeTmpArchive(tmpDir, dateStr);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 90);

        const deleted = pruneArchives(tmpDir, cutoff);
        expect(deleted).toBe(1);

        const [y, m, d] = dateStr.split('-');
        expect(fs.existsSync(path.join(tmpDir, y, m, `${d}.json`))).toBe(false);
    });

    test('GG-07: ファイル削除後に空ディレクトリも除去する', () => {
        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 100);
        const dateStr = oldDate.toISOString().slice(0, 10);
        const [y, m] = dateStr.split('-');

        makeTmpArchive(tmpDir, dateStr);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 90);

        pruneArchives(tmpDir, cutoff);

        // 空になった月ディレクトリと年ディレクトリも消えていること
        expect(fs.existsSync(path.join(tmpDir, y, m))).toBe(false);
        expect(fs.existsSync(path.join(tmpDir, y))).toBe(false);
    });

    test('GG-08: 新旧が混在する場合は古いものだけ削除する', () => {
        const today = new Date();

        const oldDate = new Date(today);
        oldDate.setDate(today.getDate() - 100);

        const newDate = new Date(today);
        newDate.setDate(today.getDate() - 10);

        makeTmpArchive(tmpDir, oldDate.toISOString().slice(0, 10));
        makeTmpArchive(tmpDir, newDate.toISOString().slice(0, 10));

        const cutoff = new Date(today);
        cutoff.setDate(today.getDate() - 90);

        const deleted = pruneArchives(tmpDir, cutoff);
        expect(deleted).toBe(1);
    });
});
