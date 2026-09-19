export const COLOR_STYLES = ["text", "background", "both"] as const;

export type ColorStyle = (typeof COLOR_STYLES)[number];

export interface PaletteColor {
  id: string;
  name: string;
  /** Hex color, e.g. #1971c2. */
  value: string;
}

export interface ColorAssignment {
  /** Vault path of a file or folder. */
  path: string;
  /** Id of a palette color. */
  colorId: string;
  /** Color everything inside the folder as well, unless it has its own color. Only set for folders. */
  recursive?: boolean;
}

export interface PluginSettings {
  palette: PaletteColor[];
  assignments: ColorAssignment[];
  folderStyle: ColorStyle;
  fileStyle: ColorStyle;
  /** Background strength in percent. */
  backgroundOpacity: number;
  /** Vault path of the JSON file used for export and import. */
  settingsFile: string;
}

/** Portable export format. */
export interface ExportData {
  plugin: "colored-file-names";
  version: 3;
  palette: PaletteColor[];
  assignments: ColorAssignment[];
  folderStyle: ColorStyle;
  fileStyle: ColorStyle;
  backgroundOpacity: number;
}

export const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export function createId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function defaultSettings(): PluginSettings {
  return {
    palette: [
      { id: "red", name: "Red", value: "#e03131" },
      { id: "orange", name: "Orange", value: "#f08c00" },
      { id: "yellow", name: "Yellow", value: "#e8b100" },
      { id: "green", name: "Green", value: "#2f9e44" },
      { id: "blue", name: "Blue", value: "#1971c2" },
      { id: "purple", name: "Purple", value: "#9c36b5" },
    ],
    assignments: [],
    folderStyle: "text",
    fileStyle: "text",
    backgroundOpacity: 15,
    settingsFile: "colored-file-names.json",
  };
}

type UnknownRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isColorStyle(value: unknown): value is ColorStyle {
  return typeof value === "string" && (COLOR_STYLES as readonly string[]).includes(value);
}

export type Styles = Pick<PluginSettings, "folderStyle" | "fileStyle">;

/** Reads the styles for folders and files. Older versions had a single style for both. */
export function parseStyles(data: UnknownRecord): Partial<Styles> {
  const legacy = isColorStyle(data.style) ? data.style : undefined;
  return {
    folderStyle: isColorStyle(data.folderStyle) ? data.folderStyle : legacy,
    fileStyle: isColorStyle(data.fileStyle) ? data.fileStyle : legacy,
  };
}

export function parsePaletteColor(data: unknown): PaletteColor | null {
  if (!isRecord(data) || typeof data.value !== "string" || !HEX_COLOR.test(data.value)) return null;
  return {
    id: typeof data.id === "string" && data.id !== "" ? data.id : createId(),
    name: typeof data.name === "string" ? data.name : "",
    value: data.value.toLowerCase(),
  };
}

export function parseAssignment(data: unknown): ColorAssignment | null {
  if (!isRecord(data) || typeof data.path !== "string" || data.path === "") return null;
  const colorId = typeof data.colorId === "string" ? data.colorId : data.color;
  if (typeof colorId !== "string" || colorId === "") return null;
  return data.recursive === true ? { path: data.path, colorId, recursive: true } : { path: data.path, colorId };
}

/**
 * Older versions and File Color had a single option that colored the contents of all
 * colored folders. It is carried over to every assignment; on files the flag has no effect.
 */
export function applyLegacyCascade(assignments: ColorAssignment[], cascade: unknown): void {
  if (cascade !== true) return;
  for (const assignment of assignments) assignment.recursive = true;
}

function parseOpacity(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : fallback;
}

/** Keeps the first entry per id or path. */
function uniqueBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Drops assignments whose palette color does not exist. */
export function withoutOrphans(assignments: ColorAssignment[], palette: PaletteColor[]): ColorAssignment[] {
  const ids = new Set(palette.map((color) => color.id));
  return assignments.filter((assignment) => ids.has(assignment.colorId));
}

export function parseSettings(data: unknown): PluginSettings {
  const defaults = defaultSettings();
  if (!isRecord(data)) return defaults;

  const palette = Array.isArray(data.palette)
    ? uniqueBy(
        data.palette.map(parsePaletteColor).filter((c): c is PaletteColor => c !== null),
        (c) => c.id,
      )
    : defaults.palette;
  const assignments = Array.isArray(data.assignments)
    ? uniqueBy(
        data.assignments.map(parseAssignment).filter((a): a is ColorAssignment => a !== null),
        (a) => a.path,
      )
    : [];
  applyLegacyCascade(assignments, data.cascade);
  const styles = parseStyles(data);

  return {
    palette,
    assignments: withoutOrphans(assignments, palette),
    folderStyle: styles.folderStyle ?? defaults.folderStyle,
    fileStyle: styles.fileStyle ?? defaults.fileStyle,
    backgroundOpacity: parseOpacity(data.backgroundOpacity, defaults.backgroundOpacity),
    settingsFile: typeof data.settingsFile === "string" && data.settingsFile !== "" ? data.settingsFile : defaults.settingsFile,
  };
}

export function toExportData(settings: PluginSettings): ExportData {
  return {
    plugin: "colored-file-names",
    version: 3,
    palette: settings.palette,
    assignments: settings.assignments,
    folderStyle: settings.folderStyle,
    fileStyle: settings.fileStyle,
    backgroundOpacity: settings.backgroundOpacity,
  };
}
