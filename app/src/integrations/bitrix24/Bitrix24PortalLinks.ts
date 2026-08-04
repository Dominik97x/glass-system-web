function getPortalOrigin(): string | null {
  const explicitUrl = process.env.BITRIX24_PORTAL_URL?.trim();
  const webhookUrl = process.env.BITRIX24_WEBHOOK_URL?.trim();

  for (const candidate of [explicitUrl, webhookUrl]) {
    if (!candidate) continue;

    try {
      return new URL(candidate).origin;
    } catch {
      // Nie ujawniamy ani nie logujemy niepoprawnego adresu webhooka.
    }
  }

  return null;
}

export function getBitrix24ContactUrl(
  contactId: number | null | undefined
): string | null {
  return createCrmDetailsUrl("contact", contactId);
}

export function getBitrix24DealUrl(
  dealId: number | null | undefined
): string | null {
  return createCrmDetailsUrl("deal", dealId);
}

function createCrmDetailsUrl(
  entity: "contact" | "deal",
  id: number | null | undefined
): string | null {
  if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) {
    return null;
  }

  const origin = getPortalOrigin();
  return origin ? `${origin}/crm/${entity}/details/${id}/` : null;
}
