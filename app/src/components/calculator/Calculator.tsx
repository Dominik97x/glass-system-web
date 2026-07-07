"use client";

import { useMemo, useState } from "react";

import {
  DEFAULT_CONFIGURATION,
  type ProductConfiguration,
} from "@/domain/ProductConfiguration";
import { QuoteService } from "@/pricing/services/QuoteService";
import { ConfiguratorPanel } from "./ConfiguratorPanel";
import { PriceSidebar } from "./PriceSidebar";
import { VisualizationPanel } from "./VisualizationPanel";

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
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Kalkulator GS</h1>
          <p className="mt-2 text-neutral-400">
            Konfigurator zasilany przez Pricing Engine.
          </p>
        </header>

        <div className="grid gap-6 xl:grid-cols-[360px_1fr_340px]">
          <ConfiguratorPanel
            configuration={configuration}
            onChange={setConfiguration}
          />

          <VisualizationPanel configuration={configuration} />

          <PriceSidebar quote={quote} />
        </div>
      </div>
    </main>
  );
}