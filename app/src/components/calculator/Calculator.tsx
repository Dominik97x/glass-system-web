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
import { QuoteActions } from "./QuoteActions";
import { VisualizationPanel } from "./VisualizationPanel";

const quoteService = new QuoteService();

export function Calculator() {
  const [configuration, setConfiguration] = useState<ProductConfiguration>({
    ...DEFAULT_CONFIGURATION,
    productType: "winter_garden",
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
    <div className="relative w-full border border-[#d5ccbc] bg-[#f9f6ef] shadow-2xl shadow-[#031d18]/10">
      <header className="border-b border-[#d5ccbc] bg-[#fffdf8] px-4 py-5 sm:px-6 lg:flex lg:items-center lg:justify-between lg:gap-8">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#9a722e]">
            Konfigurator MoonGlass
          </p>
          <h2 className="mt-2 font-serif text-2xl font-medium tracking-tight text-[#062c25] sm:text-3xl">
            Skonfiguruj swoją przestrzeń
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#202421]/60">
            Dobierz podstawowe parametry. Cena oraz podsumowanie aktualizują się
            wraz z każdą zmianą.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:mt-0 lg:min-w-[470px]">
          <HeaderStat label="Typ" value={productLabel} />
          <HeaderStat
            label="Wymiar"
            value={`${configuration.length} × ${configuration.width} cm`}
          />

          <div className="hidden sm:block">
            <HeaderStat
              label="Razem brutto"
              value={`${quote.totalGross.toLocaleString("pl-PL")} zł`}
              highlight
            />
          </div>
        </div>
      </header>

      <div className="grid items-stretch bg-[#eee7dc] xl:grid-cols-[290px_minmax(0,1fr)_340px] 2xl:grid-cols-[305px_minmax(0,1fr)_360px]">
        <ConfiguratorPanel
          configuration={configuration}
          onChange={setConfiguration}
        />

        <VisualizationPanel configuration={configuration} />

        <PriceSidebar quote={quote} />
      </div>

      <div className="sticky bottom-0 z-40 border-t border-[#c79a46]/35 bg-[#062c25]/96 px-3 pt-3 shadow-[0_-8px_30px_rgba(3,29,24,0.22)] backdrop-blur [padding-bottom:calc(0.75rem+env(safe-area-inset-bottom))] xl:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
          <div className="min-w-0 text-[#f6f1e7]">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#dfbd78]">
              Razem brutto
            </p>
            <p className="mt-0.5 truncate font-serif text-2xl font-medium">
              {quote.totalGross.toLocaleString("pl-PL")} zł
            </p>
          </div>

          <div className="w-[132px] shrink-0">
            <QuoteActions quote={quote} variant="compact" />
          </div>
        </div>
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
        "border px-4 py-3",
        highlight
          ? "border-[#c79a46]/45 bg-[#f4ead5]"
          : "border-[#ded7ca] bg-[#f8f4ec]",
      ].join(" ")}
    >
      <p
        className={[
          "text-[9px] font-black uppercase tracking-[0.18em]",
          highlight ? "text-[#9a722e]" : "text-[#68706c]",
        ].join(" ")}
      >
        {label}
      </p>
      <p
        className={[
          "mt-1 text-sm font-black leading-tight",
          highlight ? "text-[#062c25]" : "text-[#24312d]",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}
