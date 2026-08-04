import { createCalculatorInquiryRepository } from "@/inquiries/repositories/CalculatorInquiryRepositoryFactory";
import { CalculatorInquiryHandler } from "@/inquiries/server/CalculatorInquiryHandler";
import { InvalidCalculatorInquiryConfigurationError } from "@/inquiries/server/CalculatorInquiryQuoteService";
import { validateCalculatorInquirySubmission } from "@/inquiries/validators/calculator-inquiry-validator";

interface SubmitCalculatorInquiryResponse {
  success: boolean;
  message: string;
  inquiryId?: string;
  totalGross?: number;
}

export const runtime = "nodejs";

const inquiryRepository = createCalculatorInquiryRepository();
const inquiryHandler = new CalculatorInquiryHandler(inquiryRepository);

export async function GET(): Promise<Response> {
  const inquiries = await inquiryRepository.findAll();

  return Response.json({
    inquiries,
  });
}

export async function POST(request: Request): Promise<Response> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    const response: SubmitCalculatorInquiryResponse = {
      success: false,
      message: "Nieprawidłowy format JSON.",
    };

    return Response.json(response, { status: 400 });
  }

  const validation = validateCalculatorInquirySubmission(payload);

  if (!validation.success) {
    const response: SubmitCalculatorInquiryResponse = {
      success: false,
      message: validation.message,
    };

    return Response.json(response, { status: 400 });
  }

  try {
    const result = await inquiryHandler.handle(validation.submission);
    return Response.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidCalculatorInquiryConfigurationError) {
      const response: SubmitCalculatorInquiryResponse = {
        success: false,
        message: error.message,
      };

      return Response.json(response, { status: 400 });
    }

    console.error("Calculator inquiry submission failed:", error);

    const response: SubmitCalculatorInquiryResponse = {
      success: false,
      message:
        "Nie udało się zapisać zapytania. Spróbuj ponownie później.",
    };

    return Response.json(response, { status: 500 });
  }
}
