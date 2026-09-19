# Colored File Names

Color folders and files in the file explorer from the context menu. Manage your own color palette, and export or import your colors to back them up or move them to another device.

## Features

- **Color from the context menu**: right-click a file or folder and select **Colorize**. Works with several selected items at once.
- **Palette**: define named colors in the settings. Changing a palette color updates every file and folder that uses it.
- **Light and dark themes**: colored names are darkened or lightened where needed so that they stay readable in both themes. Optionally give a palette color its own color for dark themes.
- **Style**: color the name, the background of the row, or both, with adjustable background strength. Folders and files have their own style, for example backgrounds for folders and colored names for files. Colored folder names can be shown in bold.
- **Recursive folder colors**: per folder, choose whether files and subfolders inside take its color, unless they have their own.
- **Follows your files**: colors move along when you rename or move files and folders, including everything inside a moved folder.
- **Export and import**: save your colors to a JSON file inside your vault, load them again, copy them to the clipboard or paste them from JSON.
- **Import from File Color**: take over the palette and colors of the File Color plugin.
- **Command**: colorize the current file from the command palette.

## Usage

1. Right-click a file or folder in the file explorer.
2. Select **Colorize**.
3. For folders, check **Recursive** to color everything inside the folder as well. For files the checkbox is disabled.
4. Pick a color, or **No color** to remove it.

To color several items, select them with <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> or <kbd>Shift</kbd>, right-click and select **Colorize n items**.

## Settings

### Appearance

| Setting             | Description                                           | Default             |
| ------------------- | ----------------------------------------------------- | ------------------- |
| Folder style        | Text, background, or text and background for folders. | Text and background |
| File style          | Text, background, or text and background for files.   | Background          |
| Bold folder names   | Show the names of colored folders in bold.            | Off                 |
| Readable text colors | Darken or lighten colored names where needed so that they stay readable in light and dark themes. | On |
| Background strength | Opacity of the background color, 5 to 60 percent.     | 10 percent          |

### Palette

Add, rename, recolor, reorder and remove colors. The order is used in the color picker. Removing a color also removes it from all files and folders.

Each color has a second color picker for dark themes. By default it matches the first one. Once you change it, the palette color uses that color in dark themes as it is, without adjusting it for readability. The reset button next to it goes back to the same color.

### Colored files and folders

Lists every colored file and folder, with the color and whether a folder is colored recursively. Remove single entries, or clean up colors of files that no longer exist.

### Export and import

| Action                  | Description                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| Settings file           | Path of a JSON file in your vault, `colored-file-names.json` by default.                                     |
| Save to settings file   | Writes palette, colors and appearance to the settings file.                                                  |
| Load from settings file | Replaces palette, colors and appearance with the content of the settings file.                               |
| Copy to clipboard       | Copies palette, colors and appearance as JSON.                                                               |
| Import from JSON        | Adds colors from pasted JSON. Palette colors with the same id and colors for the same path are overwritten. |
| Import from File Color  | Shown when File Color is installed. Adds its palette, colors and options. With its "Cascade colors" option on, imported folders are colored recursively. |

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

A colored item in the file explorer (`.tree-item`) gets the class `cfn-colored` and the custom properties `--cfn-color` (the palette color for the current theme, used for backgrounds) and `--cfn-text-color` (the color of the name, adjusted for readability). Folders colored with **Recursive** get `cfn-cascade`, items that take the color of such a folder additionally get `cfn-inherited`. The file explorer gets `cfn-folder-style-<style>` and `cfn-file-style-<style>`, where `<style>` is `text`, `background` or `both`, and `cfn-bold-folders` when **Bold folder names** is on.

```css
/* Italic names for items that take the color of a recursively colored folder */
.cfn-inherited > .tree-item-self {
  font-style: italic;
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

## Acknowledgements

Inspired by [File Color](https://github.com/ecustic/obsidian-file-color) by ecustic. This plugin is a separate implementation and does not contain its code.

## License

[MIT](LICENSE)
