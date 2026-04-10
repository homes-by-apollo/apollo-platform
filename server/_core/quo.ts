/**
 * Quo (formerly OpenPhone) SMS helper.
 *
 * Uses the Quo REST API to send outbound text messages from the Apollo
 * business number. Credentials are injected via environment variables:
 *   QUO_API_KEY        — Workspace API key from Quo Settings → API
 *   QUO_PHONE_NUMBER_ID — The `id` of the phone number to send from (format: PN…)
 *
 * Docs: https://www.quo.com/docs/mdx/api-reference/messages/send-a-text-message
 */

const QUO_API_BASE = "https://api.openphone.com/v1";

export interface QuoSmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an outbound SMS via Quo.
 *
 * @param to   Recipient phone number in E.164 format, e.g. "+17025551234"
 * @param body Text content (max 1600 chars)
 */
export async function sendQuoSms(to: string, body: string): Promise<QuoSmsResult> {
  const apiKey = process.env.QUO_API_KEY;
  const phoneNumberId = process.env.QUO_PHONE_NUMBER_ID;

  if (!apiKey || !phoneNumberId) {
    console.warn("[Quo] QUO_API_KEY or QUO_PHONE_NUMBER_ID not set — SMS skipped");
    return { success: false, error: "Quo credentials not configured" };
  }

  // Normalise phone number to E.164 — strip everything except digits and leading +
  const normalised = normalisePhone(to);
  if (!normalised) {
    console.warn(`[Quo] Invalid phone number: ${to}`);
    return { success: false, error: "Invalid phone number" };
  }

  try {
    const res = await fetch(`${QUO_API_BASE}/messages`, {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: body.slice(0, 1600),
        from: phoneNumberId,
        to: [normalised],
        setInboxStatus: "done", // keep inbox clean — move to Done after sending
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[Quo] SMS failed ${res.status}: ${text}`);
      return { success: false, error: `Quo API ${res.status}: ${text}` };
    }

    const json = await res.json() as { data?: { id?: string } };
    return { success: true, messageId: json.data?.id };
  } catch (err: any) {
    console.error("[Quo] SMS error:", err?.message ?? err);
    return { success: false, error: err?.message ?? "Unknown error" };
  }
}

/**
 * Normalise a phone number to E.164 format.
 * Accepts: (702) 555-1234, 7025551234, +17025551234, etc.
 * Returns null if the number can't be normalised to a plausible US number.
 */
function normalisePhone(raw: string): string | null {
  if (!raw) return null;
  // Already E.164
  if (/^\+[1-9]\d{7,14}$/.test(raw)) return raw;
  // Strip all non-digits
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}
