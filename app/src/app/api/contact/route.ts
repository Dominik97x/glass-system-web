interface ContactPayload {
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
  website: string;
}

const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const MAX_PHONE_LENGTH = 40;
const MAX_MESSAGE_LENGTH = 2000;

const TOPICS: Record<string, string> = {
  general: "Zapytanie ogólne",
  winter_garden: "Ogród zimowy",
  terrace_roof: "Zadaszenie tarasu",
  calculator: "Konfiguracja z kalkulatora",
  other: "Inny temat",
};

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json(
      {
        success: false,
        message: "Nieprawidłowy format wiadomości.",
      },
      { status: 400 }
    );
  }

  const validation = validatePayload(payload);

  if (!validation.success) {
    return Response.json(
      {
        success: false,
        message: validation.message,
      },
      { status: 400 }
    );
  }

  const data = validation.data;

  // Honeypot — bot wypełni ukryte pole.
  if (data.website.length > 0) {
    return Response.json({
      success: true,
      message: "Wiadomość została wysłana.",
    });
  }

  const apiKey = process.env.RESEND_API_KEY;

  const from =
    process.env.CONTACT_FORM_FROM ??
    process.env.CALCULATOR_INQUIRY_NOTIFICATION_FROM;

  const recipients = parseRecipients(
    process.env.CONTACT_FORM_TO ??
      process.env.CALCULATOR_INQUIRY_NOTIFICATION_TO
  );

  if (!apiKey || !from || recipients.length === 0) {
    console.error("Contact form email configuration is incomplete.");

    return Response.json(
      {
        success: false,
        message:
          "Formularz jest chwilowo niedostępny. Skontaktuj się z nami telefonicznie lub e-mailem.",
      },
      { status: 500 }
    );
  }

  const topicLabel = TOPICS[data.topic] ?? TOPICS.general;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: recipients,
      reply_to: data.email,
      subject: `MoonGlass — nowe zapytanie: ${topicLabel}`,
      text: [
        "Nowe zapytanie ze strony MoonGlass",
        "",
        `Imię i nazwisko: ${data.name}`,
        `Telefon: ${data.phone}`,
        `E-mail: ${data.email}`,
        `Temat: ${topicLabel}`,
        "",
        "Wiadomość:",
        data.message,
      ].join("\n"),
      html: `
        <h2>Nowe zapytanie ze strony MoonGlass</h2>

        <p><strong>Imię i nazwisko:</strong> ${escapeHtml(data.name)}</p>
        <p><strong>Telefon:</strong> ${escapeHtml(data.phone)}</p>
        <p><strong>E-mail:</strong> ${escapeHtml(data.email)}</p>
        <p><strong>Temat:</strong> ${escapeHtml(topicLabel)}</p>

        <hr />

        <p><strong>Wiadomość:</strong></p>
        <p>${escapeHtml(data.message).replace(/\n/g, "<br />")}</p>
      `,
    }),
  });

  if (!response.ok) {
    const body = await response.text();

    console.error("Contact form Resend error:", {
      status: response.status,
      body,
    });

    return Response.json(
      {
        success: false,
        message:
          "Nie udało się wysłać wiadomości. Spróbuj ponownie później.",
      },
      { status: 500 }
    );
  }

  return Response.json({
    success: true,
    message: "Wiadomość została wysłana.",
  });
}

function validatePayload(
  payload: unknown
):
  | { success: true; data: ContactPayload }
  | { success: false; message: string } {
  if (
    typeof payload !== "object" ||
    payload === null ||
    Array.isArray(payload)
  ) {
    return {
      success: false,
      message: "Nieprawidłowe dane formularza.",
    };
  }

  const value = payload as Record<string, unknown>;

  const name = normalizeString(value.name);
  const email = normalizeString(value.email);
  const phone = normalizeString(value.phone);
  const topic = normalizeString(value.topic);
  const message = normalizeString(value.message);
  const website = normalizeString(value.website);

  if (!name || name.length > MAX_NAME_LENGTH) {
    return {
      success: false,
      message: "Podaj poprawne imię i nazwisko.",
    };
  }

  if (
    !email ||
    email.length > MAX_EMAIL_LENGTH ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return {
      success: false,
      message: "Podaj poprawny adres e-mail.",
    };
  }

  if (!phone || phone.length > MAX_PHONE_LENGTH) {
    return {
      success: false,
      message: "Podaj numer telefonu.",
    };
  }

  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    return {
      success: false,
      message: "Wiadomość jest pusta lub zbyt długa.",
    };
  }

  return {
    success: true,
    data: {
      name,
      email,
      phone,
      topic,
      message,
      website,
    },
  };
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseRecipients(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((recipient) => recipient.trim())
    .filter(Boolean);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}