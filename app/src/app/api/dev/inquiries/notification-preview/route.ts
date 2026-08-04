import type { ProductConfiguration } from "@/domain/ProductConfiguration";
import type { StoredCalculatorInquiryLead } from "@/domain/StoredCalculatorInquiryLead";
import { createCalculatorInquiryNotificationMessage } from "@/inquiries/notifications/CalculatorInquiryNotificationMessage";
import { getConfigurationSummaryRows } from "@/lib/configuration-summary";

export const runtime = "nodejs";

const exampleConfiguration: ProductConfiguration = {
  width: 306,
  length: 300,
  walls: "glass_clear",
  roof: "polycarbonate_clear",
  hasFrontZip: true,
  hasLeftZip: false,
  hasRightZip: false,
  hasAwning: true,
  hasLed: true,
  hasCob: false,
  hasHandles: true,
  hasBrushes: true,
  hasLevelingProfile: true,
};

const exampleLead: StoredCalculatorInquiryLead = {
  id: "inq_preview_001",
  source: "calculator",
  createdAt: "2026-07-06T12:00:00.000Z",
  receivedAt: "2026-07-06T12:00:01.000Z",
  status: "new",

  customer: {
    name: "Jan Kowalski",
    email: "jan.kowalski@example.com",
    phone: "500600700",
    message: "Proszę o kontakt w sprawie ogrodu zimowego.",
  },

  quote: {
    configuration: exampleConfiguration,
    configurationSummary: getConfigurationSummaryRows(exampleConfiguration),

    items: [
      {
        id: "construction",
        name: "Konstrukcja",
        category: "construction",
        quantity: 1,
        unitPriceGross: 8383,
        totalPriceGross: 8383,
      },
      {
        id: "walls",
        name: "Ściany przesuwne",
        category: "walls",
        quantity: 1,
        unitPriceGross: 15029,
        totalPriceGross: 15029,
      },
      {
        id: "zip",
        name: "Rolety ZIP",
        category: "zip",
        quantity: 1,
        unitPriceGross: 3079,
        totalPriceGross: 3079,
      },
      {
        id: "awning",
        name: "Markiza",
        category: "awning",
        quantity: 1,
        unitPriceGross: 5532,
        totalPriceGross: 5532,
      },
      {
        id: "lighting",
        name: "Oświetlenie LED",
        category: "lighting",
        quantity: 1,
        unitPriceGross: 999,
        totalPriceGross: 999,
      },
      {
        id: "accessories",
        name: "Akcesoria",
        category: "accessory",
        quantity: 1,
        unitPriceGross: 2397,
        totalPriceGross: 2397,
      },
    ],

    totalGross: 35419,
    currency: "PLN",
  },
};

export async function GET(request: Request): Promise<Response> {
  if (process.env.NODE_ENV === "production") {
    return Response.json(
      {
        success: false,
        message: "Ten endpoint jest dostępny tylko w trybie developerskim.",
      },
      { status: 404 }
    );
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format");
  const message = createCalculatorInquiryNotificationMessage(exampleLead);

  if (format === "html") {
    return new Response(message.html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  }

  if (format === "text") {
    return new Response(message.text, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  return Response.json({
    success: true,
    preview: message,
    previewUrls: {
      html: "/api/dev/inquiries/notification-preview?format=html",
      text: "/api/dev/inquiries/notification-preview?format=text",
    },
  });
}
