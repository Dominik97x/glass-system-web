"use client";

import { useMemo, useState } from "react";

import {
  DEFAULT_CONFIGURATION,
  type ProductConfiguration,
} from "@/domain/ProductConfiguration";
import { QuoteService } from "@/pricing/services/QuoteService";
import { ConfigurationForm } from "./ConfigurationForm";
import { PriceSummary } from "./PriceSummary";
import { QuoteItems } from "./QuoteItems";

const quoteService = new QuoteService();

export function Calculator() {
  const [configuration, setConfiguration] =
    useState<ProductConfiguration>({
      ...DEFAULT_CONFIGURATION,
      walls: "glass_clear",
      hasFrontZip: true,
      hasAwning: true,
      hasLed: true,
      hasHandles: true,
      hasBrushes: true,
      hasLevelingProfile: true,
    });

  const quote = useMemo(
    () => quoteService.createQuote(configuration),
    [configuration]
  );

  return (
    <main>
      <h1>Kalkulator</h1>

      <ConfigurationForm
        configuration={configuration}
        onChange={setConfiguration}
      />

      <PriceSummary quote={quote} />

      <QuoteItems quote={quote} />
    </main>
  );
}