import {
  type ColorAssignment,
  isColorStyle,
  isRecord,
  type PaletteColor,
  parseAssignment,
  parsePaletteColor,
  type PluginSettings,
  withoutOrphans,
} from "./model";

export interface ImportedColors {
  source: "colored-file-names" | "file-color";
  palette: PaletteColor[];
  assignments: ColorAssignment[];
  style?: PluginSettings["style"];
  cascade?: boolean;
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
    return {
      source: "colored-file-names",
      palette,
      assignments: withoutOrphans(parseList(data.assignments, parseAssignment), palette),
      style: isColorStyle(data.style) ? data.style : undefined,
      cascade: typeof data.cascade === "boolean" ? data.cascade : undefined,
      backgroundOpacity: typeof data.backgroundOpacity === "number" ? data.backgroundOpacity : undefined,
    };
  }

  // File Color: { palette: [{id, name, value}], fileColors: [{path, color}], cascadeColors, colorBackground }
  if (Array.isArray(data.fileColors)) {
    return {
      source: "file-color",
      palette,
      assignments: withoutOrphans(parseList(data.fileColors, parseAssignment), palette),
      style: typeof data.colorBackground === "boolean" ? (data.colorBackground ? "background" : "text") : undefined,
      cascade: typeof data.cascadeColors === "boolean" ? data.cascadeColors : undefined,
    };
  }

  throw new Error("Unknown format.");
}

/** Replaces palette, colors and options with the imported ones. */
export function replaceWith(settings: PluginSettings, imported: ImportedColors): void {
  settings.palette = imported.palette;
  settings.assignments = imported.assignments;
  if (imported.style) settings.style = imported.style;
  if (imported.cascade !== undefined) settings.cascade = imported.cascade;
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
    const existing = settings.assignments.find((a) => a.path === assignment.path);
    if (existing) existing.colorId = assignment.colorId;
    else settings.assignments.push(assignment);
  }
  if (imported.style) settings.style = imported.style;
  if (imported.cascade !== undefined) settings.cascade = imported.cascade;
}
