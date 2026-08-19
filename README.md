# git-split-diffs

GitHub style split (side by side) diffs with syntax highlighting in your terminal.

![Screenshot of dark theme](screenshots/dark.png?raw=true)

![Screenshot of github-light theme](screenshots/github-light.png?raw=true)

[Demo 1](https://asciinema.org/a/Bsk7CFtZkDZ4Ea89BwDcbD8LA) | [Demo 2](https://asciinema.org/a/7HrYqF2vjfrKXt28bv6BUAcym)

## Usage

This currently requires `node` version 18 or newer to run.

### Install globally

```sh
npm install -g git-split-diffs
# or
pnpm add -g git-split-diffs

git config --global core.pager "git-split-diffs --color | less -RFX"
```

### Install locally

```sh
npm install git-split-diffs
# or
pnpm add git-split-diffs

git config core.pager "npx git-split-diffs --color | less -RFX"
# or
git config core.pager "pnpm exec git-split-diffs --color | less -RFX"
```

### Install with Nix

```sh
nix profile install github:banga/git-split-diffs

git config --global core.pager "git-split-diffs --color | less -RFX"
```

You can also run it directly without installing:

```sh
git diff | nix run github:banga/git-split-diffs -- --color | less -RFX
```

### Use manually

```sh
git diff | git-split-diffs --color | less -RFX
```

## Customization

### Line wrapping

By default, lines are wrapped to fit in the screen. If you prefer to truncate them, update the `wrap-lines` setting:

```
git config split-diffs.wrap-lines false
```

### Inline changes

By default, salient changes within lines are also highlighted:
![Screenshot of inline changes](screenshots/inline-changes.png?raw=true)

You can disable this with the `highlight-line-changes` setting:

```
git config split-diffs.highlight-line-changes false
```

### Enable scrolling in the terminal

```sh
git config --global core.pager "git-split-diffs --color | less -+LFX"
```

(note the difference from the main configuration with the added `+` to the `less` command)

### Navigate between files

`less` can use the `■■` file-heading marker to jump directly to the next or
previous file. Create a dedicated [lesskey source file](https://man7.org/linux/man-pages/man1/lesskey.1.html)
so the bindings only affect the `git-split-diffs` pager:

```sh
mkdir -p ~/.config/git-split-diffs
cat > ~/.config/git-split-diffs/lesskey.source <<'EOF'
#command
f  forw-search \^ ■■ \n
F  back-search \^ ■■ \n
EOF

lesskey -o ~/.config/git-split-diffs/lesskey \
  ~/.config/git-split-diffs/lesskey.source
```

Point only the Git pager at that compiled lesskey file and add `-A -G -j2`:

```sh
git config --global core.pager \
  "git-split-diffs --color | less --lesskey-file=$HOME/.config/git-split-diffs/lesskey -A -G -j2 -+LFX"
```

Press `f` to go down one file and `F` to go up one file. The options make
searches advance past the current file, suppress match highlighting, and
position the heading on the second screen line so its upper divider sits at the
top edge.

The anchored `^ ■■ ` pattern matches the exact file-heading prefix rather than
arbitrary square characters in diff content.

These entries only replace the bindings for `f` and `F`; all other commands
continue to use the default `less` bindings. Omit `#stop` from the file to
preserve those defaults.

### Syntax highlighting

Syntax highlighting is supported via [shiki](https://github.com/shikijs/shiki/), which uses the same grammars and themes as vscode. Each theme specifies a default syntax highlighting theme to use, which can be overridden by:

```
git config split-diffs.syntax-highlighting-theme <name>
```

The supported syntax highlighting themes are listed at https://github.com/shikijs/textmate-grammars-themes/tree/main/packages/tm-themes#tm-themes

You can disable syntax highlighting by setting the name to empty:

```
git config split-diffs.syntax-highlighting-theme ''
```

### Narrow terminals

Split diffs can be hard to read on narrow terminals, so we revert to unified diffs if we cannot fit two lines of `min-line-width` on screen. This value is configurable:

```
git config split-diffs.min-line-width 40
```

This defaults to `80`, so screens below `160` characters will display unified diffs. Set it to `0` to always show split diffs.

## Themes

By default, git-split-diffs queries your terminal background color and chooses `transparent-dark` or `transparent-light`. You can force a single theme or configure separate dark/light themes with:

```
git config split-diffs.theme-name <name>
git config split-diffs.theme-name "dark:<dark-theme>,light:<light-theme>"
```

Use `auto` to restore the default automatic transparent dark/light selection:

```
git config split-diffs.theme-name auto
```

You can pick between several [themes](themes/):

### Transparent Dark

This is the default dark theme.

```
git config split-diffs.theme-name transparent-dark
```

### Transparent Light

This is the default light theme.

```
git config split-diffs.theme-name transparent-light
```

### Arctic

Based on https://www.nordtheme.com/

```
git config split-diffs.theme-name arctic
```

![Screenshot of GitHub Dark (Dim) theme](screenshots/arctic.png?raw=true)

### Dark

```
git config split-diffs.theme-name dark
```

![Screenshot of dark theme](screenshots/dark.png?raw=true)

### Light

```
git config split-diffs.theme-name light
```

![Screenshot of light theme](screenshots/light.png?raw=true)

### GitHub Dark (Dim)

```
git config split-diffs.theme-name github-dark-dim
```

![Screenshot of GitHub Dark (Dim) theme](screenshots/github-dark-dim.png?raw=true)

### GitHub Light

```
git config split-diffs.theme-name github-light
```

![Screenshot of GitHub Light theme](screenshots/github-light.png?raw=true)

### Solarized Dark

As seen on https://github.com/altercation/solarized

```
git config split-diffs.theme-name solarized-dark
```

![Screenshot of Solarized Dark theme](screenshots/solarized-dark.png?raw=true)

### Solarized Light

```
git config split-diffs.theme-name solarized-light
```

![Screenshot of Solarized Light theme](screenshots/solarized-light.png?raw=true)

### Monochrome Dark

```
git config split-diffs.theme-name monochrome-dark
```

![Screenshot of Monochrome Dark theme](screenshots/monochrome-dark.png?raw=true)

### Monochrome Light

```
git config split-diffs.theme-name monochrome-light
```

![Screenshot of Monochrome Light theme](screenshots/monochrome-light.png?raw=true)

## Custom Themes

Default themes are loaded from the `git-split-diffs` bundle. To load a custom theme, set `theme-directory` in git config and create a `{theme-name}.json` file in that directory with the theme's definition. You can use one of the existing themes in [themes/](https://github.com/banga/git-split-diffs/tree/main/themes) as a starting point.

```
git config split-diffs.theme-directory </path/to/theme>
git config split-diffs.theme-name <name>
```

This will use `/path/to/theme/name.json` as the theme.

You can also configure separate custom themes for dark and light terminals:

```
git config split-diffs.theme-name "dark:<dark-theme>,light:<light-theme>"
```

## Performance

Tested by measuring the time it took to pipe the output `git log -p` to `/dev/null` via `git-split-diffs` with the default theme:

| Features enabled                                      | ms/kloc |
| ----------------------------------------------------- | ------- |
| Everything                                            | 45      |
| No syntax highlighting                                | 15      |
| No syntax highlighting, no inline change highlighting | 13      |

## Troubleshooting

### Not seeing diffs side-by-side?

See [#narrow-terminals](#narrow-terminals)

### Not seeing colors, or seeing fewer colors?

Text coloring is implemented using Chalk which supports [various levels of color](https://github.com/chalk/chalk#supportscolor). If Chalk is producing fewer colors than your terminal supports, try overriding Chalk's detection using a variation of the `--color` flag, e.g. `--color=16m` for true color. See Chalk's documentation or [this useful gist on terminal support](https://gist.github.com/XVilka/8346728) if issues persist.

### Want to remove background colors from a theme?

See [#custom-themes](#custom-themes) for instructions on customizing themes. Removing `backgroundColor` should usually work.

## Acknowledgements

-   [diff-so-fancy](https://github.com/so-fancy/diff-so-fancy) for showing what's possible
-   [shikijs](https://github.com/shikijs/shiki) for making it easy to do high quality syntax highlighting
-   [chalk](https://github.com/chalk/chalk) for making it easy to do terminal styling reliably
-   [delta](https://github.com/dandavison/delta) which approaches the same problem in Rust
