import { Platform } from "react-native";

const DEFAULT_REMOTE_API_BASE = "https://api.keystonelanguages.com";

function isLocalHostname(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function resolveApiBase() {
  const explicitApiBase = process.env.EXPO_PUBLIC_API_BASE?.trim();
  if (explicitApiBase) {
    return explicitApiBase;
  }

  if (Platform.OS !== "web" || typeof window === "undefined") {
    return DEFAULT_REMOTE_API_BASE;
  }

  const { hostname } = window.location;
  if (isLocalHostname(hostname)) {
    return "http://localhost:3000";
  }

  // Hosted web should prefer a same-origin proxy path so static app routes
  // do not collide with backend endpoints and HTTPS pages avoid insecure HTTP calls.
  return "/api";
}

export const API_BASE = resolveApiBase();
