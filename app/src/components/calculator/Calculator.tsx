"use client";

import { useMemo, useState } from "react";

import {
  DEFAULT_CONFIGURATION,
  getProductKind,
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

  const productKind = getProductKind(configuration);

  return (
    <div className="rounded-[2rem] border border-neutral-200 bg-white p-4 shadow-2xl shadow-neutral-950/10 sm:p-6 lg:p-8">
      <header className="mb-8 flex flex-col gap-6 border-b border-neutral-200 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-700">
            Konfigurator Glass System
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
            Kalkulator wyceny
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-neutral-600">
            Wybierz parametry konstrukcji i sprawdź orientacyjną cenę. Po
            wysłaniu zapytania konfiguracja trafi do systemu obsługi leadów.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
          <div className="rounded-2xl bg-neutral-100 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Typ
            </p>
            <p className="mt-1 font-bold text-neutral-950">
              {productKind === "winter_garden"
                ? "Ogród zimowy"
                : "Zadaszenie tarasu"}
            </p>
          </div>

          <div className="rounded-2xl bg-neutral-100 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Wymiar
            </p>
            <p className="mt-1 font-bold text-neutral-950">
              {configuration.length} x {configuration.width} cm
            </p>
          </div>

          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Razem
            </p>
            <p className="mt-1 font-bold text-emerald-800">
              {quote.totalGross.toLocaleString("pl-PL")} zł
            </p>
          </div>
        </div>
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[360px_minmax(520px,1fr)_360px] 2xl:grid-cols-[380px_minmax(620px,1fr)_380px]">
        <section className="rounded-[1.5rem] border border-neutral-200 bg-neutral-50 p-4 sm:p-5">
          <ConfiguratorPanel
            configuration={configuration}
            onChange={setConfiguration}
          />
        </section>

        <section className="rounded-[1.5rem] border border-neutral-200 bg-neutral-50 p-4 sm:p-5">
          <VisualizationPanel configuration={configuration} />
        </section>

        <section className="rounded-[1.5rem] border border-neutral-200 bg-neutral-50 p-4 sm:p-5">
          <PriceSidebar quote={quote} />
        </section>
      </div>
    </div>
  );
}