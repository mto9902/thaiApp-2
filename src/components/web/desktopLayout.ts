export const DESKTOP_PAGE_WIDTHS = {
  standard: 1340,
  wide: 1480,
  utility: 1080,
  auth: 760,
} as const;

export type DesktopWidthVariant = keyof typeof DESKTOP_PAGE_WIDTHS;

export function resolveDesktopPageWidth(
  widthVariant: DesktopWidthVariant = "standard",
  maxWidth?: number,
) {
  return maxWidth ?? DESKTOP_PAGE_WIDTHS[widthVariant];
}
