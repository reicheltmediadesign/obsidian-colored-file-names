import type { PaletteColor } from "./settings/model";

type Rgb = [number, number, number];
type Theme = "light" | "dark";

/** Approximate file explorer backgrounds of the default light and dark themes. */
const BACKGROUNDS: Record<Theme, Rgb> = { light: [246, 246, 246], dark: [38, 38, 38] };
const TOWARDS: Record<Theme, Rgb> = { light: [0, 0, 0], dark: [255, 255, 255] };
/** WCAG AA contrast for normal text. */
const MIN_CONTRAST = 4.5;
const STEPS = 20;

/** Hex colors of a palette color for both themes. */
export interface ThemeColors {
  light: string;
  dark: string;
  /** Text colors, adjusted for readability unless adjustment is off or a dark mode color is set. */
  textLight: string;
  textDark: string;
}

export function themeColors(color: PaletteColor, adjust: boolean): ThemeColors {
  const dark = color.darkValue ?? color.value;
  return {
    light: color.value,
    dark,
    textLight: adjust ? readableText(color.value, "light") : color.value,
    textDark: adjust && color.darkValue === undefined ? readableText(dark, "dark") : dark,
  };
}

/** Darkens (light theme) or lightens (dark theme) a color just enough to reach the minimum contrast. */
function readableText(hex: string, theme: Theme): string {
  const rgb = parseHex(hex);
  for (let step = 0; step <= STEPS; step++) {
    const candidate = mix(rgb, TOWARDS[theme], step / STEPS);
    if (contrast(candidate, BACKGROUNDS[theme]) >= MIN_CONTRAST) return toHex(candidate);
  }
  return toHex(TOWARDS[theme]);
}

function parseHex(hex: string): Rgb {
  return [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16)) as Rgb;
}

function toHex(rgb: Rgb): string {
  return "#" + rgb.map((channel) => Math.round(channel).toString(16).padStart(2, "0")).join("");
}

function mix(from: Rgb, to: Rgb, amount: number): Rgb {
  return from.map((channel, index) => channel + (to[index] - channel) * amount) as Rgb;
}

function luminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: Rgb, b: Rgb): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}
