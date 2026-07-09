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
  const [configuration, setConfiguration] = useState<ProductConfiguration>({
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
  const productLabel =
    productKind === "winter_garden" ? "Ogród zimowy" : "Zadaszenie tarasu";

  return (
    <div className="w-full overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white shadow-2xl shadow-neutral-950/10">
      <header className="flex flex-col gap-4 border-b border-neutral-200 bg-white px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between xl:px-6">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.26em] text-emerald-700">
            Konfigurator Glass System
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
            Kalkulator wyceny
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-neutral-600">
            Wybierz parametry, zobacz wizualizację i wyślij zapytanie z pełną
            konfiguracją.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[470px]">
          <HeaderStat label="Typ" value={productLabel} />
          <HeaderStat
            label="Wymiar"
            value={`${configuration.length} x ${configuration.width} cm`}
          />
          <HeaderStat
            label="Razem"
            value={`${quote.totalGross.toLocaleString("pl-PL")} zł`}
            highlight
          />
        </div>
      </header>

      <div className="grid items-stretch gap-0 bg-neutral-100 xl:grid-cols-[270px_minmax(0,1fr)_315px] 2xl:grid-cols-[285px_minmax(0,1fr)_330px]">
        <ConfiguratorPanel
          configuration={configuration}
          onChange={setConfiguration}
        />

        <VisualizationPanel configuration={configuration} />

        <PriceSidebar quote={quote} />
      </div>
    </div>
  );
}

interface HeaderStatProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function HeaderStat({ label, value, highlight = false }: HeaderStatProps) {
  return (
    <div
      className={[
        "rounded-2xl px-4 py-3",
        highlight ? "bg-emerald-50" : "bg-neutral-100",
      ].join(" ")}
    >
      <p
        className={[
          "text-[10px] font-black uppercase tracking-[0.2em]",
          highlight ? "text-emerald-700" : "text-neutral-500",
        ].join(" ")}
      >
        {label}
      </p>
      <p
        className={[
          "mt-1 text-sm font-black leading-tight",
          highlight ? "text-emerald-800" : "text-neutral-950",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}