import {
    detectFromColorfgbg,
    parseOsc11Response,
} from './detectTerminalBackground';

describe('parseOsc11Response', () => {
    test('detects dark 16-bit rgb responses', () => {
        expect(parseOsc11Response('\x1b]11;rgb:0000/0000/0000\x1b\\')).toBe(
            'dark'
        );
    });

    test('detects light 16-bit rgb responses', () => {
        expect(parseOsc11Response('\x1b]11;rgb:ffff/ffff/ffff\x07')).toBe(
            'light'
        );
    });

    test('detects light 8-bit rgb responses', () => {
        expect(parseOsc11Response('\x1b]11;rgb:ff/ff/ff\x1b\\')).toBe(
            'light'
        );
    });

    test('detects light 4-bit rgb responses', () => {
        expect(parseOsc11Response('\x1b]11;rgb:f/f/f\x1b\\')).toBe('light');
    });

    test('ignores unrelated terminal responses', () => {
        expect(parseOsc11Response('\x1b]10;rgb:ffff/ffff/ffff\x1b\\')).toBe(
            null
        );
    });
});

describe('detectFromColorfgbg', () => {
    test('detects dark background indexes', () => {
        expect(detectFromColorfgbg('15;0')).toBe('dark');
        expect(detectFromColorfgbg('15;8')).toBe('dark');
    });

    test('detects light background indexes', () => {
        expect(detectFromColorfgbg('0;7')).toBe('light');
        expect(detectFromColorfgbg('0;15')).toBe('light');
    });

    test('ignores invalid values', () => {
        expect(detectFromColorfgbg('0;foo')).toBe(null);
        expect(detectFromColorfgbg('')).toBe(null);
    });
});
