// Shared theme for the DOM card (StatsCard) and the Satori OG image.
// Keeping every color/size here prevents the two renderers from drifting.
export const cardTheme = {
  bg: "#101418",
  panel: "#161c22",
  chipBg: "#1a1f2e",
  text: "#e6edf3",
  muted: "#8b949e",
  accent: "#5DCAA5",
  chipText: "#AFA9EC",
  link: "#58a6ff",
  radius: 16,
  panelRadius: 8,
  mono: "'JetBrains Mono', 'SFMono-Regular', Consolas, monospace",
} as const;
