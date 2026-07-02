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
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Kalkulator EG</h1>
          <p className="mt-2 text-neutral-400">
            Konfigurator zasilany przez Pricing Engine.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <ConfigurationForm
              configuration={configuration}
              onChange={setConfiguration}
            />
          </section>

          <aside className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <PriceSummary quote={quote} />

            <div className="mt-6">
              <QuoteItems quote={quote} />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}