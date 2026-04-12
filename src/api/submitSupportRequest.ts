import { API_BASE } from "@/src/config";
import { getAuthToken } from "@/src/utils/authStorage";

type SubmitSupportRequestInput = {
  message: string;
  email?: string | null;
};

type SubmitSupportRequestResult = {
  success?: boolean;
  deliveredByEmail?: boolean;
};

export async function submitSupportRequest({
  message,
  email,
}: SubmitSupportRequestInput): Promise<SubmitSupportRequestResult> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const payload: Record<string, string> = {
    message,
  };

  const normalizedEmail = email?.trim().toLowerCase();
  if (normalizedEmail) {
    payload.email = normalizedEmail;
  }

  const res = await fetch(`${API_BASE}/support/request`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `Failed to send support request (${res.status})`);
  }

  return data ?? {};
}
