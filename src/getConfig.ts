import type { ConditionalTheme, GitConfig, ThemeName } from './getGitConfig';
import { Theme, loadTheme } from './themes';
import { detectTerminalBackground } from './detectTerminalBackground';
import * as shiki from 'shiki';

export type Config = Theme & {
    MIN_LINE_WIDTH: number;
    WRAP_LINES: boolean;
    HIGHLIGHT_LINE_CHANGES: boolean;
};

export const CONFIG_DEFAULTS: Omit<Config, keyof Theme> = {
    MIN_LINE_WIDTH: 80,
    WRAP_LINES: true,
    HIGHLIGHT_LINE_CHANGES: true,
};

function isConditionalTheme(
    themeName: ThemeName
): themeName is ConditionalTheme {
    return typeof themeName === 'object';
}

async function resolveThemeName(
    themeName: ThemeName
): Promise<string> {
    if (!isConditionalTheme(themeName)) {
        return themeName;
    }

    const mode = await detectTerminalBackground();
    // Default to dark if detection fails
    return mode === 'light' ? themeName.light : themeName.dark;
}

export async function getConfig(gitConfig: GitConfig): Promise<Config> {
    const resolvedThemeName = await resolveThemeName(gitConfig.THEME_NAME);
    const theme = loadTheme(gitConfig.THEME_DIRECTORY, resolvedThemeName);

    return {
        ...CONFIG_DEFAULTS,
        ...theme,
        ...gitConfig,
        SYNTAX_HIGHLIGHTING_THEME: (gitConfig.SYNTAX_HIGHLIGHTING_THEME ??
            theme.SYNTAX_HIGHLIGHTING_THEME) as shiki.BundledTheme,
    };
}
