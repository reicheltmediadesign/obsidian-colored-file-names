# Colored File Names

Color folders and files in the file explorer from the context menu. Manage your own color palette, and export or import your colors to back them up or move them to another device.

## Features

- **Color from the context menu**: right-click a file or folder and select **Colorize**. Works with several selected items at once.
- **Palette**: define named colors in the settings. Changing a palette color updates every file and folder that uses it.
- **Style**: color the name, the background of the row, or both, with adjustable background strength.
- **Color folder contents**: files and subfolders inside a colored folder can take its color, unless they have their own.
- **Follows your files**: colors move along when you rename or move files and folders, including everything inside a moved folder.
- **Export and import**: save your colors to a JSON file inside your vault, load them again, copy them to the clipboard or paste them from JSON.
- **Import from File Color**: take over the palette and colors of the File Color plugin.
- **Command**: colorize the current file from the command palette.

## Usage

1. Right-click a file or folder in the file explorer.
2. Select **Colorize**.
3. Pick a color, or **No color** to remove it.

To color several items, select them with <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> or <kbd>Shift</kbd>, right-click and select **Colorize n items**.

## Settings

### Appearance

| Setting               | Description                                                                          |
| --------------------- | ------------------------------------------------------------------------------------ |
| Style                 | Text, background, or text and background.                                            |
| Background strength   | Opacity of the background color, 5 to 60 percent.                                    |
| Color folder contents | Files and subfolders inside a colored folder take its color, unless they have their own. |

### Palette

Add, rename, recolor, reorder and remove colors. The order is used in the color picker. Removing a color also removes it from all files and folders.

### Colored files and folders

Lists every colored file and folder. Remove single entries, or clean up colors of files that no longer exist.

### Export and import

| Action                  | Description                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| Settings file           | Path of a JSON file in your vault, `colored-file-names.json` by default.                                     |
| Save to settings file   | Writes palette, colors and appearance to the settings file.                                                  |
| Load from settings file | Replaces palette, colors and appearance with the content of the settings file.                               |
| Copy to clipboard       | Copies palette, colors and appearance as JSON.                                                               |
| Import from JSON        | Adds colors from pasted JSON. Palette colors with the same id and colors for the same path are overwritten. |
| Import from File Color  | Shown when File Color is installed. Adds its palette, colors and options.                                    |

#### Moving colors to another device

Plugin settings are stored in the `.obsidian` folder, which many sync tools skip. The settings file is a normal file in your vault and is synced with your notes:

1. On the first device, select **Save to settings file**.
2. Let your notes sync.
3. On the other device, install the plugin and select **Load from settings file**.

## Migrating from File Color

1. Keep File Color installed and open **Settings → Colored File Names**.
2. Under **Export and import**, select **Import from File Color**. On a fresh installation the palette is replaced; otherwise the colors are added to your palette.
3. Disable File Color.

## Styling with CSS snippets

A colored item in the file explorer (`.tree-item`) gets the class `cfn-colored` and the custom property `--cfn-color`. Colored folders get `cfn-cascade` when **Color folder contents** is on. The file explorer gets `cfn-style-text`, `cfn-style-background` or `cfn-style-both`.

```css
/* Bold names for colored items */
.cfn-colored > .tree-item-self {
  font-weight: var(--font-semibold);
}
```

## Privacy

The plugin works entirely offline. It makes no network requests and collects no data. It writes to your vault only when you select **Save to settings file**, and reads the File Color configuration only when you import from it.

## Installation

### From the community plugins directory

1. Open **Settings → Community plugins** and turn off restricted mode.
2. Select **Browse**, search for **Colored File Names** and select **Install**.
3. Select **Enable**.

### Manual installation

1. Download `main.js`, `manifest.json` and `styles.css` from the latest release.
2. Copy them into `<your vault>/.obsidian/plugins/colored-file-names/`.
3. Reload Obsidian and enable **Colored File Names** under **Settings → Community plugins**.

Requires Obsidian 1.13.0 or later.

## Development

Requires Node.js 22 or later.

```bash
npm install
npm run dev     # rebuild main.js on every change
npm run build   # type check and production build
npm run lint    # lint with eslint-plugin-obsidianmd
```

### Releasing a new version

1. Run `npm version patch`, `npm version minor` or `npm version major`. This updates `package.json`, `manifest.json` and `versions.json` and creates a Git tag without a `v` prefix.
2. Push the commit and the tag: `git push --follow-tags`.
3. The release workflow lints and builds the plugin and creates a draft release with `main.js`, `manifest.json` and `styles.css`. Review and publish it on GitHub.

## Acknowledgements

Inspired by [File Color](https://github.com/ecustic/obsidian-file-color) by ecustic. This plugin is a separate implementation and does not contain its code.

## License

[MIT](LICENSE)
