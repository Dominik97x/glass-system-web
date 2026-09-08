import type { StoredCalculatorInquiryLead } from "@/domain/StoredCalculatorInquiryLead";
import { createCalculatorInquiryQuotePdf } from "@/inquiries/pdf/CalculatorInquiryQuotePdf";
import {
  createCalculatorInquiryCustomerMessage,
  createCalculatorInquiryNotificationMessage,
  type CalculatorInquiryNotificationMessage,
} from "./CalculatorInquiryNotificationMessage";
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

interface ResendEmailAttachment {
  filename: string;
  content: string;
  content_type?: string;
}

interface ResendEmailPayload {
  to: string[];
  message: CalculatorInquiryNotificationMessage;
  replyTo?: string;
  attachments?: ResendEmailAttachment[];
}

export class ResendCalculatorInquiryNotificationService
  implements CalculatorInquiryNotificationService
{
  constructor(
    private readonly config: ResendCalculatorInquiryNotificationConfig =
      getResendCalculatorInquiryNotificationConfig()
  ) {}

  async notify(lead: StoredCalculatorInquiryLead): Promise<void> {
    this.validateConfig();

    const internalMessage = createCalculatorInquiryNotificationMessage(lead);
    const customerMessage = createCalculatorInquiryCustomerMessage(lead);
    const businessReplyTo = this.config.to[0];

    const internalEmailPromise = this.sendEmail({
      to: this.config.to,
      message: internalMessage,
      replyTo: lead.customer.email,
    }).then((responseId) => {
      console.log("Calculator inquiry internal email sent:", {
        inquiryId: lead.id,
        provider: "resend",
        responseId,
      });
    });

    const customerEmailPromise = this.sendCustomerEmailWithPdf(
      lead,
      customerMessage,
      businessReplyTo
    );

    const results = await Promise.allSettled([
      internalEmailPromise,
      customerEmailPromise,
    ]);

    const errors = results
      .filter(
        (result): result is PromiseRejectedResult =>
          result.status === "rejected"
      )
      .map((result) => formatUnknownError(result.reason));

    if (errors.length > 0) {
      throw new Error(
        `One or more calculator inquiry emails failed: ${errors.join(" | ")}`
      );
    }
  }

  private async sendCustomerEmailWithPdf(
    lead: StoredCalculatorInquiryLead,
    message: CalculatorInquiryNotificationMessage,
    replyTo: string | undefined
  ): Promise<void> {
    const pdf = await createCalculatorInquiryQuotePdf(lead);

    const responseId = await this.sendEmail({
      to: [lead.customer.email],
      message,
      replyTo,
      attachments: [
        {
          filename: pdf.filename,
          content: Buffer.from(pdf.bytes).toString("base64"),
          content_type: "application/pdf",
        },
      ],
    });

    console.log("Calculator inquiry customer email sent:", {
      inquiryId: lead.id,
      customerEmail: lead.customer.email,
      provider: "resend",
      responseId,
      attachment: pdf.filename,
      documentNumber: pdf.documentNumber,
    });
  }

  private validateConfig(): void {
    if (!this.config.apiKey) {
      throw new Error("Missing RESEND_API_KEY for inquiry notifications.");
    }

    if (!this.config.from) {
      throw new Error(
        "Missing CALCULATOR_INQUIRY_NOTIFICATION_FROM or CONTACT_FORM_FROM for inquiry notifications."
      );
    }

    if (this.config.to.length === 0) {
      throw new Error(
        "Missing CALCULATOR_INQUIRY_NOTIFICATION_TO or CONTACT_FORM_TO for inquiry notifications."
      );
    }
  }

  private async sendEmail(payload: ResendEmailPayload): Promise<string | undefined> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.config.from,
        to: payload.to,
        subject: payload.message.subject,
        text: payload.message.text,
        html: payload.message.html,
        ...(payload.replyTo ? { reply_to: payload.replyTo } : {}),
        ...(payload.attachments && payload.attachments.length > 0
          ? { attachments: payload.attachments }
          : {}),
      }),
    });

    const data = await readJsonSafely(response);

    if (!response.ok) {
      throw new Error(createResendErrorMessage(response.status, data));
    }

    return data.id;
  }
}

function getResendCalculatorInquiryNotificationConfig(): ResendCalculatorInquiryNotificationConfig {
  const explicitTo = process.env.CALCULATOR_INQUIRY_NOTIFICATION_TO;
  const contactFormTo = process.env.CONTACT_FORM_TO;

  return {
    apiKey: process.env.RESEND_API_KEY,
    from:
      process.env.CALCULATOR_INQUIRY_NOTIFICATION_FROM ??
      process.env.CONTACT_FORM_FROM,
    to: parseRecipientList(explicitTo ?? contactFormTo),
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

function formatUnknownError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
