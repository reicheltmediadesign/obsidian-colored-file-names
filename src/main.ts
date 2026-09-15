import { normalizePath, Notice, Plugin, type TAbstractFile, TFolder } from "obsidian";
import { ColorModal } from "./color-modal";
import { ExplorerColorizer } from "./explorer";
import { removePaths, renamePaths } from "./paths";
import { type ImportedColors, mergeInto, parseImport, replaceWith } from "./settings/import";
import { defaultSettings, parseSettings, type PluginSettings, toExportData } from "./settings/model";
import { ColoredFileNamesSettingTab } from "./settings/settings-tab";

const FILE_COLOR_ID = "obsidian-file-color";

export default class ColoredFileNamesPlugin extends Plugin {
  settings!: PluginSettings;
  /** Path of the File Color configuration, if that plugin is installed. */
  fileColorDataPath: string | null = null;

  private colorsByPath = new Map<string, string>();
  private settingTab!: ColoredFileNamesSettingTab;
  private explorer!: ExplorerColorizer;

  async onload(): Promise<void> {
    this.settings = parseSettings(await this.loadData());
    this.updateColorMap();

    this.explorer = new ExplorerColorizer(this.app.workspace, () => ({
      colors: this.colorsByPath,
      style: this.settings.style,
      cascade: this.settings.cascade,
      backgroundOpacity: this.settings.backgroundOpacity,
    }));
    this.register(() => this.explorer.detach());

    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (isVaultRoot(file)) return;
        menu.addItem((item) =>
          item
            .setTitle("Set color")
            .setIcon("palette")
            .onClick(() => this.openColorModal([file])),
        );
      }),
    );

    this.registerEvent(
      this.app.workspace.on("files-menu", (menu, files) => {
        const targets = files.filter((file) => !isVaultRoot(file));
        if (targets.length === 0) return;
        menu.addItem((item) =>
          item
            .setTitle(`Set color for ${targets.length} items`)
            .setIcon("palette")
            .onClick(() => this.openColorModal(targets)),
        );
      }),
    );

    this.addCommand({
      id: "set-color-of-current-file",
      name: "Set color of current file",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return false;
        if (!checking) this.openColorModal([file]);
        return true;
      },
    });

    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => {
        if (renamePaths(this.settings.assignments, oldPath, file.path)) void this.saveSettings();
      }),
    );

    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        const remaining = removePaths(this.settings.assignments, file.path);
        if (remaining.length !== this.settings.assignments.length) {
          this.settings.assignments = remaining;
          void this.saveSettings();
        }
      }),
    );

    this.settingTab = new ColoredFileNamesSettingTab(this.app, this);
    this.addSettingTab(this.settingTab);

    this.app.workspace.onLayoutReady(() => {
      this.explorer.attach();
      this.registerEvent(this.app.workspace.on("layout-change", () => this.explorer.attach()));
      void this.detectFileColor();
    });
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.updateColorMap();
    this.explorer.refresh();
  }

  async removeMissingPaths(): Promise<void> {
    const before = this.settings.assignments.length;
    this.settings.assignments = this.settings.assignments.filter(
      (assignment) => this.app.vault.getAbstractFileByPath(assignment.path) !== null,
    );
    await this.saveSettings();
    new Notice(`Removed ${before - this.settings.assignments.length} colors of missing files.`);
  }

  async saveToSettingsFile(): Promise<void> {
    const path = normalizePath(this.settings.settingsFile);
    const json = JSON.stringify(toExportData(this.settings), null, 2) + "\n";
    try {
      const file = this.app.vault.getFileByPath(path);
      if (file) {
        await this.app.vault.process(file, () => json);
      } else {
        await this.ensureParentFolder(path);
        await this.app.vault.create(path, json);
      }
      new Notice(`Colors saved to ${path}.`);
    } catch (error) {
      new Notice(`Could not save colors: ${errorMessage(error)}`);
    }
  }

  async loadFromSettingsFile(): Promise<void> {
    const path = normalizePath(this.settings.settingsFile);
    const file = this.app.vault.getFileByPath(path);
    if (!file) {
      new Notice(`Settings file ${path} not found.`);
      return;
    }
    try {
      const imported = parseImport(await this.app.vault.read(file));
      replaceWith(this.settings, imported);
      await this.saveSettings();
      new Notice(`Loaded ${imported.assignments.length} colors from ${path}.`);
    } catch (error) {
      new Notice(`Could not load colors: ${errorMessage(error)}`);
    }
  }

  async copyToClipboard(): Promise<void> {
    try {
      await navigator.clipboard.writeText(JSON.stringify(toExportData(this.settings), null, 2));
      new Notice("Colors copied to the clipboard.");
    } catch {
      new Notice("Could not access the clipboard.");
    }
  }

  /** Merges pasted JSON into the settings. Returns true on success. */
  async importJson(json: string): Promise<boolean> {
    try {
      await this.merge(parseImport(json));
      return true;
    } catch (error) {
      new Notice(`Import failed: ${errorMessage(error)}`);
      return false;
    }
  }

  async importFromFileColor(): Promise<void> {
    if (this.fileColorDataPath === null) return;
    try {
      await this.merge(parseImport(await this.app.vault.adapter.read(this.fileColorDataPath)));
    } catch (error) {
      new Notice(`Import failed: ${errorMessage(error)}`);
    }
  }

  private async merge(imported: ImportedColors): Promise<void> {
    // On a fresh install, replace the default palette instead of adding to it.
    const untouched =
      this.settings.assignments.length === 0 &&
      JSON.stringify(this.settings.palette) === JSON.stringify(defaultSettings().palette);
    if (untouched) replaceWith(this.settings, imported);
    else mergeInto(this.settings, imported);
    await this.saveSettings();
    new Notice(`Imported ${imported.palette.length} palette colors and ${imported.assignments.length} colored items.`);
  }

  private openColorModal(files: TAbstractFile[]): void {
    const current = files.length === 1 ? this.colorIdOf(files[0].path) : null;
    const label = files.length === 1 ? files[0].name : `${files.length} items`;
    new ColorModal(this.app, this.settings.palette, current, label, (colorId) => {
      void this.setColor(files, colorId);
    }).open();
  }

  private async setColor(files: TAbstractFile[], colorId: string | null): Promise<void> {
    const paths = new Set(files.map((file) => file.path));
    this.settings.assignments = this.settings.assignments.filter((assignment) => !paths.has(assignment.path));
    if (colorId !== null) {
      for (const path of paths) this.settings.assignments.push({ path, colorId });
    }
    await this.saveSettings();
  }

  private colorIdOf(path: string): string | null {
    return this.settings.assignments.find((assignment) => assignment.path === path)?.colorId ?? null;
  }

  private updateColorMap(): void {
    const values = new Map(this.settings.palette.map((color) => [color.id, color.value]));
    this.colorsByPath = new Map();
    for (const { path, colorId } of this.settings.assignments) {
      const value = values.get(colorId);
      if (value) this.colorsByPath.set(path, value);
    }
  }

  private async ensureParentFolder(path: string): Promise<void> {
    const index = path.lastIndexOf("/");
    if (index <= 0) return;
    const folder = path.slice(0, index);
    if (!this.app.vault.getFolderByPath(folder)) await this.app.vault.createFolder(folder);
  }

  private async detectFileColor(): Promise<void> {
    const path = normalizePath(`${this.app.vault.configDir}/plugins/${FILE_COLOR_ID}/data.json`);
    this.fileColorDataPath = (await this.app.vault.adapter.exists(path)) ? path : null;
    if (this.fileColorDataPath !== null) this.settingTab.update();
  }
}

function isVaultRoot(file: TAbstractFile): boolean {
  return file instanceof TFolder && file.isRoot();
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
