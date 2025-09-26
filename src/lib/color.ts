const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function expandHex(hex: string): string {
  if (hex.length === 4) {
    const [, r, g, b] = hex;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return hex;
}

export function parseHexColor(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!HEX_COLOR_REGEX.test(trimmed)) {
    return null;
  }
  return expandHex(trimmed);
}

type Rgb = { r: number; g: number; b: number };

export function hexToRgb(hex: string): Rgb | null {
  const normalized = parseHexColor(hex);
  if (!normalized) {
    return null;
  }
  const value = normalized.slice(1);
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return { r, g, b };
}

export function hexToRgba(hex: string, alpha: number): string | null {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return null;
  }
  const clampedAlpha = Number.isFinite(alpha) ? Math.min(Math.max(alpha, 0), 1) : 1;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clampedAlpha})`;
}

function luminanceComponent(value: number): number {
  const channel = value / 255;
  return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
}

export function getReadableTextColor(hex: string): "#000000" | "#FFFFFF" {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return "#000000";
  }
  const luminance =
    0.2126 * luminanceComponent(rgb.r) + 0.7152 * luminanceComponent(rgb.g) + 0.0722 * luminanceComponent(rgb.b);
  return luminance > 0.55 ? "#000000" : "#FFFFFF";
}
