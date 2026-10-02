/**
 * WhyCODE Global Design Tokens — single source of truth.
 * Mirrors Stitch asset `WhyCODE Global - Obsidian Precision`
 * (assets/1419793660107307880) so Stitch screens and the Next.js
 * app use the same colors, fonts, sizes, spacing and radii.
 */

export const colors = {
  canvas: "#0b0f17",
  surfaceNeutral: "#0e131f",
  surfaceRaised: "#141b2d",
  surfaceOverlay: "#1a2238",

  borderDefault: "#232d45",
  borderHighlight: "#2d3752",

  primary: "#6366f1",
  primaryHover: "#4f46e5",
  primaryGlow: "#818cf8",

  secondary: "#38bdf8",
  tertiary: "#10b981",

  textPrimary: "#f8fafc",
  textSecondary: "#94a3b8",
  textTertiary: "#64748b",
  textDisabled: "#334155",

  status: {
    pending: "#f59e0b",
    cloning: "#38bdf8",
    ready: "#10b981",
    error: "#f43f5e",
  },
} as const;

export const fonts = {
  sans: "Geist, system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
} as const;

/** fontSize / lineHeight / fontWeight per Obsidian Precision scale */
export const typography = {
  headlineXl: { fontSize: "32px", lineHeight: "40px", fontWeight: 600 },
  headlineLg: { fontSize: "24px", lineHeight: "32px", fontWeight: 600 },
  headlineMd: { fontSize: "18px", lineHeight: "24px", fontWeight: 600 },
  headlineSm: { fontSize: "15px", lineHeight: "20px", fontWeight: 600 },
  bodyLg: { fontSize: "15px", lineHeight: "22px", fontWeight: 400 },
  bodyMd: { fontSize: "13px", lineHeight: "18px", fontWeight: 400 },
  bodySm: { fontSize: "12px", lineHeight: "16px", fontWeight: 400 },
  codeMd: { fontSize: "13px", lineHeight: "18px", fontWeight: 400 },
  codeSm: { fontSize: "11px", lineHeight: "15px", fontWeight: 400 },
  kbdSm: { fontSize: "10px", lineHeight: "12px", fontWeight: 500 },
  badgeLabel: { fontSize: "11px", lineHeight: "14px", fontWeight: 500 },
} as const;

export const spacing = {
  xs: "0.25rem", // 4px
  sm: "0.5rem", // 8px
  md: "0.75rem", // 12px
  lg: "1rem", // 16px
  xl: "1.5rem", // 24px
  gutter: "1rem",
  gutterDesktop: "1.5rem",
  margin: "1rem",
  marginDesktop: "2rem",
} as const;

export const radius = {
  sm: "0.125rem", // 2px — badges, kbd, micro elements
  DEFAULT: "0.25rem", // 4px — standard
  md: "0.375rem", // 6px — buttons, inputs, cards
  lg: "0.5rem", // 8px — modals, command palette
  xl: "0.75rem", // 12px
  full: "9999px", // pills, avatars, status pips
} as const;

export const layout = {
  toolbarHeight: "36px",
  breadcrumbHeight: "28px",
  treeItemHeight: "28px",
  buttonHeight: "32px",
  buttonHeightDense: "26px",
  inputHeight: "32px",
  commandPaletteWidth: "640px",
} as const;
