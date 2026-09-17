import type { CalculatorInquiryLead } from "@/domain/CalculatorInquiryLead";
import type { CalculatorInquirySubmission } from "@/domain/CalculatorInquirySubmission";
import { createQuoteSnapshot } from "@/lib/quote-snapshot";
import { QuoteService } from "@/pricing/services/QuoteService";

export class InvalidCalculatorInquiryConfigurationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "InvalidCalculatorInquiryConfigurationError";
  }
}

/**
 * Creates the trusted lead persisted by the server.
 *
 * The browser never decides the final items or total. They are always rebuilt
 * from the submitted configuration and the published pricing JSON.
 */
export class CalculatorInquiryQuoteService {
  constructor(private readonly quoteService: QuoteService = new QuoteService()) {}

  createTrustedLead(
    submission: CalculatorInquirySubmission
  ): CalculatorInquiryLead {
    try {
      const quote = this.quoteService.createQuote(submission.configuration);

      return {
        source: "calculator",
        createdAt: new Date().toISOString(),
        customer: {
          ...submission.customer,
        },
        quote: createQuoteSnapshot(quote),
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nie udało się przeliczyć wybranej konfiguracji.";

      throw new InvalidCalculatorInquiryConfigurationError(message, {
        cause: error,
      });
    }
  }
}
