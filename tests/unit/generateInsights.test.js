'use strict';

// puppeteer と外部依存をモック（require時にブラウザが起動しないようにする）
jest.mock('puppeteer', () => ({
    launch: jest.fn().mockResolvedValue({
        newPage: jest.fn(),
        close: jest.fn()
    })
}));

const { generateContentWithRetry } = require('../../src/generateInsights');

describe('generateContentWithRetry', () => {
    let setTimeoutSpy;

    beforeEach(() => {
        // リトライ待機をスキップ
        setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation((fn) => { fn(); return 0; });
    });

    afterEach(() => {
        setTimeoutSpy.mockRestore();
    });

    test('GI-01: 初回成功でレスポンスを返す（1回呼び出し）', async () => {
        const mockResponse = { text: () => '{"title":"test"}' };
        const mockModel = {
            generateContent: jest.fn().mockResolvedValue({ response: mockResponse })
        };

        const result = await generateContentWithRetry(mockModel, 'test prompt');
        expect(result).toBe(mockResponse);
        expect(mockModel.generateContent).toHaveBeenCalledTimes(1);
    });

    test('GI-02: 429エラー後に2回目で成功する', async () => {
        const mockResponse = { text: () => '{"title":"test"}' };
        const mockModel = {
            generateContent: jest.fn()
                .mockRejectedValueOnce(new Error('429 Too Many Requests rate limit exceeded'))
                .mockResolvedValueOnce({ response: mockResponse })
        };

        const result = await generateContentWithRetry(mockModel, 'test prompt', 3);
        expect(result).toBe(mockResponse);
        expect(mockModel.generateContent).toHaveBeenCalledTimes(2);
    });

    test('GI-03: maxRetries回失敗後に例外をスローする', async () => {
        const error = new Error('429 rate limit');
        const mockModel = {
            generateContent: jest.fn().mockRejectedValue(error)
        };

        await expect(generateContentWithRetry(mockModel, 'test', 2)).rejects.toThrow('429 rate limit');
        expect(mockModel.generateContent).toHaveBeenCalledTimes(2);
    });

    test('GI-04: 非レートリミットエラーは即座にスローする（1回呼び出し）', async () => {
        const error = new Error('Invalid API key');
        const mockModel = {
            generateContent: jest.fn().mockRejectedValue(error)
        };

        await expect(generateContentWithRetry(mockModel, 'test', 3)).rejects.toThrow('Invalid API key');
        expect(mockModel.generateContent).toHaveBeenCalledTimes(1);
    });

    test('GI-05: 503サーバーエラー後にリトライして成功する', async () => {
        const mockResponse = { text: () => '{"title":"test"}' };
        const mockModel = {
            generateContent: jest.fn()
                .mockRejectedValueOnce(new Error('503 Service Unavailable'))
                .mockResolvedValueOnce({ response: mockResponse })
        };

        const result = await generateContentWithRetry(mockModel, 'test prompt', 3);
        expect(result).toBe(mockResponse);
        expect(mockModel.generateContent).toHaveBeenCalledTimes(2);
    });
});
