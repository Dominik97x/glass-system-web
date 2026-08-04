import type { CalculatorInquirySubmission } from "@/domain/CalculatorInquirySubmission";

export interface SubmitCalculatorInquiryResult {
  success: boolean;
  message: string;
  inquiryId?: string;
  totalGross?: number;
}

export class CalculatorInquiryService {
  async submit(
    submission: CalculatorInquirySubmission
  ): Promise<SubmitCalculatorInquiryResult> {
    const response = await fetch("/api/inquiries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(submission),
    });

    let result: SubmitCalculatorInquiryResult | null = null;

    try {
      result = (await response.json()) as SubmitCalculatorInquiryResult;
    } catch {
      result = null;
    }

    if (!response.ok) {
      return {
        success: false,
        message:
          result?.message ??
          "Nie udało się przygotować zapytania. Spróbuj ponownie później.",
      };
    }

    return (
      result ?? {
        success: false,
        message:
          "Nie udało się odczytać odpowiedzi serwera. Spróbuj ponownie później.",
      }
    );
  }
}
