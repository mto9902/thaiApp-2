type NamedProfile = {
  id?: number | null;
  email?: string | null;
  display_name?: string | null;
};

export function getEmailLocalPart(email?: string | null) {
  const trimmed = typeof email === "string" ? email.trim() : "";
  if (!trimmed) return "";
  return trimmed.split("@")[0]?.trim() || "";
}

export function getProfileDisplayName(profile?: NamedProfile | null) {
  const explicit = profile?.display_name?.trim();
  if (explicit) return explicit;

  const emailLocalPart = getEmailLocalPart(profile?.email);
  if (emailLocalPart) return emailLocalPart;

  return `User #${profile?.id || "..."}`;
}
