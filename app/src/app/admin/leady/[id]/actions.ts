"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/auth/admin-session";
import type { CalculatorInquiryStatus } from "@/domain/StoredCalculatorInquiryLead";
import { CalculatorInquiryAdminService } from "@/inquiries/server/CalculatorInquiryAdminService";

const inquiryAdminService = new CalculatorInquiryAdminService();

const allowedStatuses: CalculatorInquiryStatus[] = [
  "new",
  "contacted",
  "quoted",
  "won",
  "lost",
];

function isCalculatorInquiryStatus(
  value: FormDataEntryValue | null
): value is CalculatorInquiryStatus {
  return (
    typeof value === "string" &&
    allowedStatuses.includes(value as CalculatorInquiryStatus)
  );
}

export async function updateInquiryStatusAction(
  formData: FormData
): Promise<void> {
  await requireAdminSession("/admin/leady");

  const id = formData.get("id");
  const status = formData.get("status");

  if (typeof id !== "string" || id.trim().length === 0) {
    return;
  }

  if (!isCalculatorInquiryStatus(status)) {
    return;
  }

  await inquiryAdminService.updateInquiryStatus(id, status);

  revalidatePath("/admin/leady");
  revalidatePath(`/admin/leady/${id}`);

  redirect(`/admin/leady/${id}`);
}