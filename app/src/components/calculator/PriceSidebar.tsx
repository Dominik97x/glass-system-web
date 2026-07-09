import { ROOF_LABELS, WALL_LABELS } from "@/data/configuration-labels";
import type { Quote } from "@/domain/Quote";
import { getProductKind } from "@/domain/ProductConfiguration";
import { QuoteActions } from "./QuoteActions";

interface Props {
  quote: Quote;
}

type QuoteItem = Quote["items"][number];

function formatPrice(value: number | undefined): string {
  return `${(value ?? 0).toLocaleString("pl-PL")} zł`;
}

function getProductLabel(quote: Quote): string {
  return getProductKind(quote.configuration) === "terrace_roof"
    ? "Zadaszenie tarasu"
    : "Ogród zimowy";
}

function getItemTotalGross(item: QuoteItem): number {
  const legacyItem = item as QuoteItem & {
    totalGross?: number;
    totalPriceGross?: number;
  };

  if (typeof legacyItem.totalPriceGross === "number") {
    return legacyItem.totalPriceGross;
  }

  if (typeof legacyItem.totalGross === "number") {
    return legacyItem.totalGross;
  }

  if (
    typeof item.unitPriceGross === "number" &&
    typeof item.quantity === "number"
  ) {
    return item.unitPriceGross * item.quantity;
  }

  return 0;
}

function getZipLabel(quote: Quote): string {
  const selected = [
    quote.configuration.hasFrontZip ? "przód" : null,
    quote.configuration.hasLeftZip ? "lewa" : null,
    quote.configuration.hasRightZip ? "prawa" : null,
  ].filter(Boolean);

  return selected.length > 0 ? selected.join(", ") : "Brak";
}

function getLightingLabel(quote: Quote): string {
  if (quote.configuration.hasLed) {
    return "LED punktowe";
  }

  if (quote.configuration.hasCob) {
    return "LED taśma";
  }

  return "Brak";
}

function getAccessoriesLabel(quote: Quote): string {
  const selected = [
    quote.configuration.hasHandles ? "uchwyty" : null,
    quote.configuration.hasBrushes ? "szczotki" : null,
    quote.configuration.hasLevelingProfile ? "profil" : null,
  ].filter(Boolean);

  return selected.length > 0 ? selected.join(", ") : "Brak";
}

export function PriceSidebar({ quote }: Props) {
  return (
    <aside className="border-l border-neutral-200 bg-white xl:sticky xl:top-0 xl:h-screen xl:max-h-screen xl:overflow-y-auto">
      <div className="space-y-3 p-3">
        <div className="rounded-2xl bg-neutral-950 p-5 text-white">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-300">
            Wycena orientacyjna
          </p>
          <p className="mt-3 text-sm text-white/70">Razem brutto</p>
          <p className="mt-1 text-4xl font-black tracking-tight">
            {formatPrice(quote.totalGross)}
          </p>
          <p className="mt-4 text-sm leading-6 text-white/70">
            Cena poglądowa. Finalna oferta zostanie potwierdzona po kontakcie z
            doradcą.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">
            Podsumowanie
          </p>

          <div className="mt-3 space-y-1">
            <SummaryRow label="Typ" value={getProductLabel(quote)} />
            <SummaryRow
              label="Wymiar"
              value={`${quote.configuration.length} x ${quote.configuration.width} cm`}
            />
            <SummaryRow
              label="Dach"
              value={ROOF_LABELS[quote.configuration.roof]}
            />
            <SummaryRow
              label="Ściany"
              value={WALL_LABELS[quote.configuration.walls]}
            />
            <SummaryRow label="ZIP" value={getZipLabel(quote)} />
            <SummaryRow
              label="Markiza"
              value={quote.configuration.hasAwning ? "Tak" : "Nie"}
            />
            <SummaryRow label="LED" value={getLightingLabel(quote)} />
            <SummaryRow label="Dodatki" value={getAccessoriesLabel(quote)} />
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">
                Pozycje
              </p>
              <h3 className="mt-1 text-lg font-semibold text-neutral-950">
                Składniki
              </h3>
            </div>
            <p className="rounded-full bg-white px-3 py-1 text-xs font-black text-neutral-500">
              {quote.items.length}
            </p>
          </div>

          <div className="space-y-2">
            {quote.items.map((item, index) => {
              const itemTotalGross = getItemTotalGross(item);

              return (
                <div
                  key={`${item.name}-${index}`}
                  className="flex items-start justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-black leading-5 text-neutral-950">
                      {item.name}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      Ilość: {item.quantity}
                    </p>
                  </div>
                  <p className="text-right text-sm font-black text-neutral-950">
                    {formatPrice(itemTotalGross)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-800">
            Następny krok
          </p>
          <p className="mt-2 text-lg font-semibold leading-tight text-emerald-950">
            Wyślij konfigurację do doradcy.
          </p>
          <p className="mt-2 text-sm leading-6 text-emerald-900/75">
            Zapytanie zapisze dane kontaktowe, opcje i cenę orientacyjną.
          </p>

          <div className="mt-4">
            <QuoteActions quote={quote} />
          </div>
        </div>
      </div>
    </aside>
  );
}

interface SummaryRowProps {
  label: string;
  value: string;
}

function SummaryRow({ label, value }: SummaryRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-neutral-200 py-2 last:border-b-0">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="max-w-[62%] text-right text-sm font-black leading-5 text-neutral-950">
        {value}
      </p>
    </div>
  );
}