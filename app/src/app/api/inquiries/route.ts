import { FileCalculatorInquiryRepository } from "@/inquiries/repositories/FileCalculatorInquiryRepository";
import { CalculatorInquiryHandler } from "@/inquiries/server/CalculatorInquiryHandler";
import { validateCalculatorInquiryLead } from "@/inquiries/validators/calculator-inquiry-validator";

interface SubmitCalculatorInquiryResponse {
  success: boolean;
  message: string;
  inquiryId?: string;
}

export const runtime = "nodejs";

const inquiryRepository = new FileCalculatorInquiryRepository();
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

  const validation = validateCalculatorInquiryLead(payload);

  if (!validation.success) {
    const response: SubmitCalculatorInquiryResponse = {
      success: false,
      message: validation.message,
    };

    return Response.json(response, { status: 400 });
  }

  const result = await inquiryHandler.handle(validation.lead);

  return Response.json(result);
}