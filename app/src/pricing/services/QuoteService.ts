import type { ProductConfiguration } from "@/domain/ProductConfiguration";
import type { Quote } from "@/domain/Quote";

import { SnapshotQuoteService } from "./SnapshotQuoteService";

export class QuoteService {
  private snapshotQuoteService = new SnapshotQuoteService();

  createQuote(configuration: ProductConfiguration): Quote {
    return this.snapshotQuoteService.createQuote(configuration);
  }
}