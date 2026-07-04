import { Bitrix24Client } from "@/integrations/bitrix24/Bitrix24Client";
import { getBitrix24Config } from "@/integrations/bitrix24/Bitrix24Config";
import { Bitrix24MetadataInspector } from "@/integrations/bitrix24/Bitrix24MetadataInspector";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  if (process.env.NODE_ENV === "production") {
    return Response.json(
      {
        success: false,
        message: "Ten endpoint jest dostępny tylko w trybie developerskim.",
      },
      { status: 404 }
    );
  }

  try {
    const config = getBitrix24Config();

    if (!config.enabled) {
      return Response.json(
        {
          success: false,
          message:
            "Bitrix24 integration is disabled. Set BITRIX24_ENABLED=true and BITRIX24_WEBHOOK_URL in .env.local.",
        },
        { status: 400 }
      );
    }

    const client = new Bitrix24Client(config);
    const inspector = new Bitrix24MetadataInspector(client, config);
    const metadata = await inspector.inspectDealMetadata();

    return Response.json({
      success: true,
      metadata,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unknown Bitrix24 metadata inspection error.",
      },
      { status: 500 }
    );
  }
}