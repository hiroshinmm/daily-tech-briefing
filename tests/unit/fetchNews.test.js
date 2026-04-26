'use strict';

const { isRecent } = require('../../src/fetchNews');

describe('isRecent', () => {
    test('FN-01: null は false を返す', () => {
        expect(isRecent(null, 7)).toBe(false);
    });

    test('FN-02: undefined は false を返す', () => {
        expect(isRecent(undefined, 7)).toBe(false);
    });

    test('FN-03: 今日の日時は true', () => {
        expect(isRecent(new Date().toISOString(), 7)).toBe(true);
    });

    test('FN-04: 昨日の日時は true (window=7)', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        expect(isRecent(yesterday.toISOString(), 7)).toBe(true);
    });

    test('FN-05: 8日前の日時は false (window=7)', () => {
        const old = new Date();
        old.setDate(old.getDate() - 8);
        expect(isRecent(old.toISOString(), 7)).toBe(false);
    });

    test('FN-06: 6日前の日時は true (window=7)', () => {
        const recent = new Date();
        recent.setDate(recent.getDate() - 6);
        expect(isRecent(recent.toISOString(), 7)).toBe(true);
    });
});
