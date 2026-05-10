import path from 'path';
import { fileURLToPath } from 'url';

export type ConditionalTheme = {
    dark: string;
    light: string;
};

export type ThemeName = string | ConditionalTheme;

export type GitConfig = {
    MIN_LINE_WIDTH: number;
    WRAP_LINES: boolean;
    HIGHLIGHT_LINE_CHANGES: boolean;
    THEME_DIRECTORY: string;
    THEME_NAME: ThemeName;
    SYNTAX_HIGHLIGHTING_THEME?: string;
};

export const DEFAULT_MIN_LINE_WIDTH = 80;
export const DEFAULT_THEME_DIRECTORY = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    'themes'
);
export const DEFAULT_THEME_NAME: ConditionalTheme = {
    dark: 'transparent-dark',
    light: 'transparent-light',
};

const GIT_CONFIG_KEY_PREFIX = 'split-diffs';
const GIT_CONFIG_LINE_REGEX = new RegExp(
    `${GIT_CONFIG_KEY_PREFIX}\\.([^=]+)=(.*)`
);

/**
 * Parse a theme-name value, which can be either:
 * - A plain theme name: "arctic"
 * - A conditional theme: "dark:solarized-dark,light:solarized-light"
 */
export function parseThemeName(value: string): ThemeName {
    if (value === 'auto') {
        return DEFAULT_THEME_NAME;
    }

    if (value.includes(':')) {
        const parts = value.split(',').map((s) => s.trim());
        let dark: string | undefined;
        let light: string | undefined;
        for (const part of parts) {
            const [prefix, name] = part.split(':').map((s) => s.trim());
            if (prefix === 'dark') {
                dark = name;
            } else if (prefix === 'light') {
                light = name;
            }
        }
        if (dark && light) {
            return { dark, light };
        }
    }
    return value;
}

function extractFromGitConfigString(configString: string) {
    const rawConfig: Record<string, string> = {};
    for (const line of configString.trim().split('\n')) {
        const match = line.match(GIT_CONFIG_LINE_REGEX);
        if (!match) {
            continue;
        }
        const [, key, value] = match;
        rawConfig[key] = value;
    }
    return rawConfig;
}

export function getGitConfig(configString: string): GitConfig {
    const rawConfig = extractFromGitConfigString(configString);

    let minLineWidth = DEFAULT_MIN_LINE_WIDTH;
    try {
        const parsedMinLineWidth = parseInt(rawConfig['min-line-width'], 10);
        if (!isNaN(parsedMinLineWidth)) {
            minLineWidth = parsedMinLineWidth;
        }
    } catch {
        // Ignore invalid values
    }

    return {
        MIN_LINE_WIDTH: minLineWidth,
        WRAP_LINES: rawConfig['wrap-lines'] !== 'false',
        HIGHLIGHT_LINE_CHANGES: rawConfig['highlight-line-changes'] !== 'false',
        THEME_DIRECTORY:
            rawConfig['theme-directory'] ?? DEFAULT_THEME_DIRECTORY,
        THEME_NAME: rawConfig['theme-name']
            ? parseThemeName(rawConfig['theme-name'])
            : DEFAULT_THEME_NAME,
        SYNTAX_HIGHLIGHTING_THEME: rawConfig['syntax-highlighting-theme'],
    };
}
