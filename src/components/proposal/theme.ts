import { getReadableTextColor, hexToRgba, parseHexColor } from "@/lib/color";

import type { ProposalTheme } from "./types";

const DEFAULT_PRIMARY = "#1E40AF";
const DEFAULT_SECONDARY = "#F97316";
const DEFAULT_BACKGROUND = "#0B1120";

export type ProposalThemeTokens = {
  brandColor: string;
  brandSurface: string;
  brandForeground: string;
  accentColor: string;
  accentSurface: string;
  accentForeground: string;
  backgroundColor: string;
  logo?: string | null;
};

export function coerceProposalTheme(value: unknown): ProposalTheme | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const theme = value as Record<string, unknown>;
  const primary = typeof theme.primary === "string" ? theme.primary : null;
  const secondary = typeof theme.secondary === "string" ? theme.secondary : null;
  const logo = typeof theme.logo === "string" ? theme.logo : null;
  const background = typeof theme.background === "string" ? theme.background : null;
  if (!primary && !secondary && !logo && !background) {
    return null;
  }
  return { primary, secondary, logo, background };
}

export function buildThemeTokens(theme: ProposalTheme | null | undefined): ProposalThemeTokens {
  const primary = parseHexColor(theme?.primary) ?? DEFAULT_PRIMARY;
  const secondary = parseHexColor(theme?.secondary) ?? DEFAULT_SECONDARY;
  const background = parseHexColor(theme?.background) ?? DEFAULT_BACKGROUND;

  const brandSurface = hexToRgba(primary, 0.12) ?? "rgba(30, 64, 175, 0.12)";
  const accentSurface = hexToRgba(secondary, 0.16) ?? "rgba(249, 115, 22, 0.16)";

  return {
    brandColor: primary,
    brandSurface,
    brandForeground: getReadableTextColor(primary),
    accentColor: secondary,
    accentSurface,
    accentForeground: getReadableTextColor(secondary),
    backgroundColor: background,
    logo: theme?.logo ?? null,
  };
}
