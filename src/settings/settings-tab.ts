import { type App, PluginSettingTab, type SettingDefinitionItem } from "obsidian";
import type ColoredFileNamesPlugin from "../main";
import { ImportModal } from "./import-modal";
import { type ColorStyle, createId, isColorStyle } from "./model";

const STYLE_OPTIONS: Record<ColorStyle, string> = {
  text: "Text",
  background: "Background",
  both: "Text and background",
};

type ControlKey = "folderStyle" | "fileStyle" | "backgroundOpacity" | "settingsFile";

export class ColoredFileNamesSettingTab extends PluginSettingTab {
  private readonly plugin: ColoredFileNamesPlugin;

  constructor(app: App, plugin: ColoredFileNamesPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    const { settings } = this.plugin;
    const colorName = (colorId: string): string =>
      settings.palette.find((color) => color.id === colorId)?.name || colorId;

    return [
      {
        type: "group",
        heading: "Appearance",
        items: [
          {
            name: "Folder style",
            desc: "Color the name of folders, the background of the row, or both.",
            control: { type: "dropdown", key: "folderStyle", options: STYLE_OPTIONS },
          },
          {
            name: "File style",
            desc: "Color the name of files, the background of the row, or both.",
            control: { type: "dropdown", key: "fileStyle", options: STYLE_OPTIONS },
          },
          {
            name: "Background strength",
            desc: "Opacity of the background color in percent.",
            visible: () => settings.folderStyle !== "text" || settings.fileStyle !== "text",
            control: { type: "slider", key: "backgroundOpacity", min: 5, max: 60, step: 5 },
          },
        ],
      },
      {
        type: "list",
        heading: "Palette",
        emptyState: "No colors yet. Add a color to use it in the context menu of the file explorer.",
        addItem: {
          name: "Add color",
          action: () => {
            settings.palette.push({ id: createId(), name: "New color", value: "#868e96" });
            void this.saveAndUpdate();
          },
        },
        onDelete: (index) => {
          const [removed] = settings.palette.splice(index, 1);
          if (removed) settings.assignments = settings.assignments.filter((a) => a.colorId !== removed.id);
          void this.saveAndUpdate();
        },
        onReorder: (oldIndex, newIndex) => {
          const [moved] = settings.palette.splice(oldIndex, 1);
          if (moved) settings.palette.splice(newIndex, 0, moved);
          void this.saveAndUpdate();
        },
        items: settings.palette.map((color) => ({
          name: color.name || color.value,
          desc: "Removing a color also removes it from all files and folders.",
          render: (setting) => {
            setting
              .addText((text) =>
                text
                  .setPlaceholder("Color name")
                  .setValue(color.name)
                  .onChange(async (value) => {
                    color.name = value;
                    await this.plugin.saveSettings();
                  }),
              )
              .addColorPicker((picker) =>
                picker.setValue(color.value).onChange(async (value) => {
                  color.value = value;
                  await this.plugin.saveSettings();
                }),
              );
          },
        })),
      },
      {
        type: "page",
        name: "Colored files and folders",
        desc: "Review and remove colors of individual files and folders.",
        items: [
          {
            name: "Remove colors of missing files",
            desc: "Clean up colors of files and folders that no longer exist in the vault.",
            action: () => void this.plugin.removeMissingPaths().then(() => this.update()),
          },
          {
            type: "list",
            emptyState: "No files or folders are colored yet.",
            onDelete: (index) => {
              settings.assignments.splice(index, 1);
              void this.saveAndUpdate();
            },
            items: settings.assignments.map((assignment) => ({
              name: assignment.path,
              desc: assignment.recursive ? `${colorName(assignment.colorId)}, recursive` : colorName(assignment.colorId),
            })),
          },
        ],
      },
      {
        type: "group",
        heading: "Export and import",
        items: [
          {
            name: "Settings file",
            desc: "JSON file in your vault for saving and loading colors. Unlike plugin settings, it is synced along with your notes.",
            control: { type: "text", key: "settingsFile", placeholder: "colored-file-names.json", validate: validateJsonPath },
          },
          {
            name: "Save to settings file",
            desc: "Write palette, colors and appearance to the settings file.",
            action: () => void this.plugin.saveToSettingsFile(),
          },
          {
            name: "Load from settings file",
            desc: "Replace palette, colors and appearance with the content of the settings file.",
            action: () => void this.plugin.loadFromSettingsFile().then(() => this.update()),
          },
          {
            name: "Copy to clipboard",
            desc: "Copy palette, colors and appearance as JSON.",
            action: () => void this.plugin.copyToClipboard(),
          },
          {
            name: "Import from JSON",
            desc: "Add colors from pasted JSON, exported by this plugin or by File Color.",
            action: () =>
              new ImportModal(this.app, async (json) => {
                const ok = await this.plugin.importJson(json);
                if (ok) this.update();
                return ok;
              }).open(),
          },
          {
            name: "Import from File Color",
            desc: "Add the palette and colors of the installed File Color plugin.",
            visible: () => this.plugin.fileColorDataPath !== null,
            action: () => void this.plugin.importFromFileColor().then(() => this.update()),
          },
        ],
      },
    ];
  }

  getControlValue(key: string): unknown {
    return this.plugin.settings[key as ControlKey];
  }

  async setControlValue(key: string, value: unknown): Promise<void> {
    const { settings } = this.plugin;
    switch (key as ControlKey) {
      case "folderStyle":
      case "fileStyle":
        if (isColorStyle(value)) settings[key as "folderStyle" | "fileStyle"] = value;
        this.refreshDomState();
        break;
      case "backgroundOpacity":
        if (typeof value === "number") settings.backgroundOpacity = value;
        break;
      case "settingsFile":
        if (typeof value === "string" && validateJsonPath(value) === undefined) settings.settingsFile = value.trim();
        break;
      default:
        return;
    }
    await this.plugin.saveSettings();
  }

  private async saveAndUpdate(): Promise<void> {
    await this.plugin.saveSettings();
    this.update();
  }
}

function validateJsonPath(value: string): string | undefined {
  const path = value.trim();
  if (path === "") return "Enter a file path.";
  if (!path.toLowerCase().endsWith(".json")) return "The file name must end with .json.";
  return undefined;
}
