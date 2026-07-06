import type { StoredCalculatorInquiryLead } from "@/domain/StoredCalculatorInquiryLead";
import { createCalculatorInquiryNotificationMessage } from "./CalculatorInquiryNotificationMessage";
import type { CalculatorInquiryNotificationService } from "./CalculatorInquiryNotificationService";

interface ResendCalculatorInquiryNotificationConfig {
  apiKey?: string;
  from?: string;
  to: string[];
}

interface ResendEmailResponse {
  id?: string;
  name?: string;
  message?: string;
  statusCode?: number;
}

export class ResendCalculatorInquiryNotificationService
  implements CalculatorInquiryNotificationService
{
  constructor(
    private readonly config: ResendCalculatorInquiryNotificationConfig =
      getResendCalculatorInquiryNotificationConfig()
  ) {}

  async notify(lead: StoredCalculatorInquiryLead): Promise<void> {
    const message = createCalculatorInquiryNotificationMessage(lead);

    if (!this.config.apiKey) {
      throw new Error("Missing RESEND_API_KEY for inquiry notifications.");
    }

    if (!this.config.from) {
      throw new Error(
        "Missing CALCULATOR_INQUIRY_NOTIFICATION_FROM for inquiry notifications."
      );
    }

    if (this.config.to.length === 0) {
      throw new Error(
        "Missing CALCULATOR_INQUIRY_NOTIFICATION_TO for inquiry notifications."
      );
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.config.from,
        to: this.config.to,
        subject: message.subject,
        text: message.text,
        reply_to: lead.customer.email,
      }),
    });

    const data = await readJsonSafely(response);

    if (!response.ok) {
      throw new Error(createResendErrorMessage(response.status, data));
    }

    console.log("Calculator inquiry email notification sent:", {
      inquiryId: lead.id,
      provider: "resend",
      responseId: data.id,
    });
  }
}

function getResendCalculatorInquiryNotificationConfig(): ResendCalculatorInquiryNotificationConfig {
  return {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.CALCULATOR_INQUIRY_NOTIFICATION_FROM,
    to: parseRecipientList(process.env.CALCULATOR_INQUIRY_NOTIFICATION_TO),
  };
}

function parseRecipientList(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((recipient) => recipient.trim())
    .filter((recipient) => recipient.length > 0);
}

async function readJsonSafely(response: Response): Promise<ResendEmailResponse> {
  try {
    return (await response.json()) as ResendEmailResponse;
  } catch {
    return {};
  }
}

function createResendErrorMessage(
  status: number,
  data: ResendEmailResponse
): string {
  const name = data.name ?? "unknown_error";
  const message = data.message ?? "No error message returned by Resend.";

  return `Resend email notification failed. HTTP status: ${status}. Error: ${name}. Message: ${message}`;
}