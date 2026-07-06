import type { StoredCalculatorInquiryLead } from "@/domain/StoredCalculatorInquiryLead";
import { createCalculatorInquiryNotificationMessage } from "@/inquiries/notifications/CalculatorInquiryNotificationMessage";

export const runtime = "nodejs";

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
    productKind: "winter_garden",
    configuration: {
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
    },
    items: [
      {
        name: "Konstrukcja",
        category: "construction",
        quantity: 1,
        unitPriceGross: 8383,
        totalGross: 8383,
      },
      {
        name: "Ściany przesuwne",
        category: "walls",
        quantity: 1,
        unitPriceGross: 15029,
        totalGross: 15029,
      },
      {
        name: "Rolety ZIP",
        category: "zip",
        quantity: 1,
        unitPriceGross: 3079,
        totalGross: 3079,
      },
      {
        name: "Markiza",
        category: "awning",
        quantity: 1,
        unitPriceGross: 5532,
        totalGross: 5532,
      },
      {
        name: "Oświetlenie LED",
        category: "lighting",
        quantity: 1,
        unitPriceGross: 999,
        totalGross: 999,
      },
      {
        name: "Akcesoria",
        category: "accessory",
        quantity: 1,
        unitPriceGross: 2397,
        totalGross: 2397,
      },
    ],
    totalGross: 35419,
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