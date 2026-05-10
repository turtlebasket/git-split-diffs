import * as fs from 'fs';
import * as process from 'process';
import * as tty from 'tty';

export type TerminalMode = 'dark' | 'light';

/**
 * Compute relative luminance from RGB values (0-255 each).
 * Uses the sRGB luminance formula from WCAG.
 */
function luminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map((c) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Parse an OSC 11 response to extract RGB values.
 * Response format: \x1b]11;rgb:RRRR/GGGG/BBBB\x1b\\ or \x1b]11;rgb:RRRR/GGGG/BBBB\x07
 */
export function parseOsc11Response(response: string): TerminalMode | null {
    const match = response.match(
        /\]11;rgb:([0-9a-fA-F]+)\/([0-9a-fA-F]+)\/([0-9a-fA-F]+)/
    );
    if (!match) {
        return null;
    }

    const r = parseRgbComponent(match[1]);
    const g = parseRgbComponent(match[2]);
    const b = parseRgbComponent(match[3]);

    return luminance(r, g, b) > 0.5 ? 'light' : 'dark';
}

function parseRgbComponent(hex: string): number {
    const max = Math.pow(16, hex.length) - 1;
    return Math.round((parseInt(hex, 16) / max) * 255);
}

/**
 * Try to detect terminal background using the COLORFGBG environment variable.
 * Format: "fg;bg" where bg < 8 typically means dark.
 */
export function detectFromColorfgbg(
    colorfgbg = process.env['COLORFGBG']
): TerminalMode | null {
    if (!colorfgbg) {
        return null;
    }

    const parts = colorfgbg.split(';');
    const bg = parseInt(parts[parts.length - 1], 10);
    if (isNaN(bg)) {
        return null;
    }

    return (bg >= 0 && bg <= 6) || bg === 8 ? 'dark' : 'light';
}

/**
 * Query the terminal for its background color using OSC 11.
 * Returns a promise that resolves to 'dark', 'light', or null if detection fails.
 */
function detectFromOsc11(timeoutMs: number = 200): Promise<TerminalMode | null> {
    return new Promise((resolve) => {
        // We need a writable TTY to send the query
        if (!process.stderr.isTTY) {
            resolve(null);
            return;
        }

        // Open /dev/tty directly for reading the response, since stdin is
        // typically piped (we receive diff content on stdin)
        let ttyFd: number;
        let ttyReadStream: tty.ReadStream;
        try {
            ttyFd = fs.openSync('/dev/tty', 'r');
            ttyReadStream = new tty.ReadStream(ttyFd);
        } catch {
            resolve(null);
            return;
        }

        ttyReadStream.setRawMode(true);
        ttyReadStream.resume();

        let responseData = '';

        const cleanup = () => {
            clearTimeout(timer);
            ttyReadStream.setRawMode(false);
            ttyReadStream.destroy();
            try {
                fs.closeSync(ttyFd);
            } catch {
                // ignore
            }
        };

        const timer = setTimeout(() => {
            cleanup();
            resolve(null);
        }, timeoutMs);

        ttyReadStream.on('data', (data: Buffer) => {
            responseData += data.toString();

            // Check if we have a complete response (ends with BEL or ST)
            if (responseData.includes('\x07') || responseData.includes('\x1b\\')) {
                cleanup();
                resolve(parseOsc11Response(responseData));
            }
        });

        ttyReadStream.on('error', () => {
            cleanup();
            resolve(null);
        });

        // Send the query via stderr (since stdout may be piped too)
        process.stderr.write('\x1b]11;?\x1b\\');
    });
}

/**
 * Detect whether the terminal has a dark or light background.
 * Tries OSC 11 first, then falls back to COLORFGBG env var.
 * Returns null if detection fails.
 */
export async function detectTerminalBackground(): Promise<TerminalMode | null> {
    const osc11Result = await detectFromOsc11();
    if (osc11Result) {
        return osc11Result;
    }

    return detectFromColorfgbg();
}
