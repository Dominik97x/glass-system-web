import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type {
  CalculatorInquiryStatus,
  StoredCalculatorInquiryLead,
} from "@/domain/StoredCalculatorInquiryLead";
import type { CalculatorInquiryRepository } from "./CalculatorInquiryRepository";

export class FileCalculatorInquiryRepository
  implements CalculatorInquiryRepository
{
  private readonly filePath = path.join(
    process.cwd(),
    "data",
    "inquiries",
    "calculator-inquiries.json"
  );

  async save(lead: StoredCalculatorInquiryLead): Promise<void> {
    const leads = await this.readLeads();

    leads.push(lead);

    await this.writeLeads(leads);
  }

  async findAll(): Promise<StoredCalculatorInquiryLead[]> {
    return this.readLeads();
  }

  async findById(
    id: string
  ): Promise<StoredCalculatorInquiryLead | null> {
    const leads = await this.readLeads();

    return leads.find((lead) => lead.id === id) ?? null;
  }

  async updateStatus(
    id: string,
    status: CalculatorInquiryStatus
  ): Promise<StoredCalculatorInquiryLead | null> {
    const leads = await this.readLeads();

    const leadIndex = leads.findIndex((lead) => lead.id === id);

    if (leadIndex === -1) {
      return null;
    }

    const updatedLead: StoredCalculatorInquiryLead = {
      ...leads[leadIndex],
      status,
    };

    leads[leadIndex] = updatedLead;

    await this.writeLeads(leads);

    return updatedLead;
  }

  private async readLeads(): Promise<StoredCalculatorInquiryLead[]> {
    await this.ensureDirectoryExists();

    try {
      const fileContent = await readFile(this.filePath, "utf-8");

      if (fileContent.trim().length === 0) {
        return [];
      }

      return JSON.parse(fileContent) as StoredCalculatorInquiryLead[];
    } catch (error) {
      if (isFileNotFoundError(error)) {
        return [];
      }

      throw error;
    }
  }

  private async writeLeads(
    leads: StoredCalculatorInquiryLead[]
  ): Promise<void> {
    await this.ensureDirectoryExists();

    await writeFile(
      this.filePath,
      JSON.stringify(leads, null, 2),
      "utf-8"
    );
  }

  private async ensureDirectoryExists(): Promise<void> {
    const directoryPath = path.dirname(this.filePath);

    await mkdir(directoryPath, { recursive: true });
  }
}

function isFileNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}