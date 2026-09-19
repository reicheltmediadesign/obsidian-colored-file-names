import {
  applyLegacyCascade,
  type ColorAssignment,
  isRecord,
  type PaletteColor,
  parseAssignment,
  parsePaletteColor,
  parseStyles,
  type PluginSettings,
  type Styles,
  withoutOrphans,
} from "./model";

export interface ImportedColors extends Partial<Styles> {
  source: "colored-file-names" | "file-color";
  palette: PaletteColor[];
  assignments: ColorAssignment[];
  backgroundOpacity?: number;
}

function parseList<T>(value: unknown, parse: (item: unknown) => T | null): T[] {
  return Array.isArray(value) ? value.map(parse).filter((item): item is T => item !== null) : [];
}

/**
 * Reads an export of this plugin or the data.json of the File Color plugin.
 * Throws if the JSON has neither format.
 */
export function parseImport(json: string): ImportedColors {
  const data: unknown = JSON.parse(json);
  if (!isRecord(data) || !Array.isArray(data.palette)) throw new Error("Unknown format.");

  const palette = parseList(data.palette, parsePaletteColor);

  // Export of this plugin
  if (Array.isArray(data.assignments)) {
    const assignments = parseList(data.assignments, parseAssignment);
    applyLegacyCascade(assignments, data.cascade);
    return {
      source: "colored-file-names",
      palette,
      assignments: withoutOrphans(assignments, palette),
      ...parseStyles(data),
      backgroundOpacity: typeof data.backgroundOpacity === "number" ? data.backgroundOpacity : undefined,
    };
  }

  // File Color: { palette: [{id, name, value}], fileColors: [{path, color}], cascadeColors, colorBackground }
  if (Array.isArray(data.fileColors)) {
    const assignments = parseList(data.fileColors, parseAssignment);
    applyLegacyCascade(assignments, data.cascadeColors);
    const style = typeof data.colorBackground === "boolean" ? (data.colorBackground ? "background" : "text") : undefined;
    return {
      source: "file-color",
      palette,
      assignments: withoutOrphans(assignments, palette),
      folderStyle: style,
      fileStyle: style,
    };
  }

  throw new Error("Unknown format.");
}

/** Replaces palette, colors and options with the imported ones. */
export function replaceWith(settings: PluginSettings, imported: ImportedColors): void {
  settings.palette = imported.palette;
  settings.assignments = imported.assignments;
  applyStyles(settings, imported);
  if (imported.backgroundOpacity !== undefined) settings.backgroundOpacity = imported.backgroundOpacity;
}

/**
 * Adds imported palette colors and colors to the existing ones.
 * Palette colors with the same id and colors for the same path are overwritten.
 */
export function mergeInto(settings: PluginSettings, imported: ImportedColors): void {
  for (const color of imported.palette) {
    const existing = settings.palette.find((c) => c.id === color.id);
    if (existing) {
      existing.name = color.name;
      existing.value = color.value;
    } else {
      settings.palette.push(color);
    }
  }
  for (const assignment of imported.assignments) {
    const index = settings.assignments.findIndex((a) => a.path === assignment.path);
    if (index >= 0) settings.assignments[index] = assignment;
    else settings.assignments.push(assignment);
  }
  applyStyles(settings, imported);
}

function applyStyles(settings: PluginSettings, imported: ImportedColors): void {
  if (imported.folderStyle) settings.folderStyle = imported.folderStyle;
  if (imported.fileStyle) settings.fileStyle = imported.fileStyle;
}
