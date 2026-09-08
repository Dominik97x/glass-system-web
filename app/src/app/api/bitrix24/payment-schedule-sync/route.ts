import { Bitrix24Client } from "@/integrations/bitrix24/Bitrix24Client";
import { getBitrix24Config } from "@/integrations/bitrix24/Bitrix24Config";
import { Bitrix24PaymentScheduleSyncService } from "@/integrations/bitrix24/Bitrix24PaymentScheduleSyncService";

export const runtime = "nodejs";

interface ParsedRequest {
  kind: "bitrix_event" | "local_test";
  dealId: number;
  dryRun: boolean;
  event?: string;
  applicationToken?: string;
  domain?: string;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const parsed = await parseRequest(request);
    const config = getBitrix24Config();

    if (!config.enabled) {
      return Response.json(
        {
          success: false,
          message: "Integracja Bitrix24 jest wyłączona.",
        },
        { status: 503 }
      );
    }

    if (parsed.kind === "bitrix_event") {
      const securityError = validateBitrixEvent(parsed, config.webhookUrl);
      if (securityError) {
        return Response.json(
          { success: false, message: securityError },
          { status: 401 }
        );
      }
    }

    const client = new Bitrix24Client(config);
    const service = new Bitrix24PaymentScheduleSyncService(client, config);

    const result = await service.syncDeal(parsed.dealId, {
      apply: parsed.kind === "bitrix_event" && !parsed.dryRun,
    });

    return Response.json({
      success: true,
      source: parsed.kind,
      event: parsed.event ?? null,
      result,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Nieznany błąd synchronizacji 30/50/20.",
      },
      { status: 500 }
    );
  }
}

async function parseRequest(request: Request): Promise<ParsedRequest> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = (await request.json()) as Record<string, unknown>;

    // Lokalny test jest celowo dostępny tylko poza produkcją.
    if (
      process.env.NODE_ENV !== "production" &&
      payload.dealId !== undefined
    ) {
      return {
        kind: "local_test",
        dealId: parseDealId(payload.dealId),
        dryRun: true,
      };
    }

    const data = asRecord(payload.data);
    const fields = asRecord(data.FIELDS);
    const auth = asRecord(payload.auth);

    return {
      kind: "bitrix_event",
      dealId: parseDealId(fields.ID),
      dryRun: false,
      event: String(payload.event ?? ""),
      applicationToken: String(auth.application_token ?? ""),
      domain: String(auth.domain ?? ""),
    };
  }

  const form = await request.formData();

  return {
    kind: "bitrix_event",
    dealId: parseDealId(
      form.get("data[FIELDS][ID]") ??
        form.get("data[FIELDS][Id]") ??
        form.get("FIELDS[ID]")
    ),
    dryRun: false,
    event: String(form.get("event") ?? ""),
    applicationToken: String(
      form.get("auth[application_token]") ??
        form.get("application_token") ??
        ""
    ),
    domain: String(form.get("auth[domain]") ?? form.get("domain") ?? ""),
  };
}

function validateBitrixEvent(
  parsed: ParsedRequest,
  webhookUrl: string
): string | null {
  if ((parsed.event ?? "").toUpperCase() !== "ONCRMDEALUPDATE") {
    return `Nieobsługiwane zdarzenie: ${parsed.event || "[puste]"}.`;
  }

  const expectedToken = process.env.BITRIX24_OUTGOING_WEBHOOK_TOKEN?.trim();
  if (!expectedToken) {
    return "Brak BITRIX24_OUTGOING_WEBHOOK_TOKEN po stronie serwera.";
  }

  if (!constantTimeEqual(parsed.applicationToken ?? "", expectedToken)) {
    return "Nieprawidłowy application_token webhooka.";
  }

  const expectedDomain = new URL(webhookUrl).hostname.toLowerCase();
  const receivedDomain = (parsed.domain ?? "").trim().toLowerCase();

  if (receivedDomain && receivedDomain !== expectedDomain) {
    return "Webhook pochodzi z nieoczekiwanej domeny Bitrix24.";
  }

  return null;
}

function parseDealId(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`Nieprawidłowe ID deala: ${String(value)}`);
  }
  return parsed;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function constantTimeEqual(left: string, right: string): boolean {
  const encoder = new TextEncoder();
  const a = encoder.encode(left);
  const b = encoder.encode(right);

  if (a.length !== b.length) return false;

  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a[index] ^ b[index];
  }
  return diff === 0;
}
