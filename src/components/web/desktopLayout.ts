export const DESKTOP_PAGE_WIDTH = 1320;
export const MOBILE_WEB_BREAKPOINT = 960;

export function resolveDesktopPageWidth(maxWidth?: number) {
  return maxWidth ?? DESKTOP_PAGE_WIDTH;
}
