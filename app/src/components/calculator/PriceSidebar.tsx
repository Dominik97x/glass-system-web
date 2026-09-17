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
  if (quote.configuration.hasLed) return "LED punktowe";
  if (quote.configuration.hasCob) return "LED RGB CCT";
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

function getDisplayedItemQuantity(quote: Quote, item: QuoteItem): number {
  if (item.category === "zip") {
    return (
      Number(quote.configuration.hasFrontZip) +
      Number(quote.configuration.hasLeftZip) +
      Number(quote.configuration.hasRightZip)
    );
  }

  if (item.category === "accessory") {
    return (
      Number(quote.configuration.hasHandles) +
      Number(quote.configuration.hasBrushes) +
      Number(quote.configuration.hasLevelingProfile)
    );
  }

  return item.quantity;
}

export function PriceSidebar({ quote }: Props) {
  return (
    <aside className="border-l border-[#d5ccbc] bg-[#f6f1e7]">
      <div className="space-y-1.5 p-2.5">
        <section className="bg-[#062c25] p-3.5 text-[#f6f1e7]">
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#dfbd78]">
            Wycena orientacyjna
          </p>

          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm text-[#f6f1e7]/62">Razem brutto</p>
              <p className="mt-0.5 font-serif text-[28px] font-medium tracking-tight">
                {formatPrice(quote.totalGross)}
              </p>
            </div>

            <div className="pb-1 text-right">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#dfbd78]/80">
                {getProductLabel(quote)}
              </p>
              <p className="mt-1 text-xs text-[#f6f1e7]/65">
                {quote.configuration.length} × {quote.configuration.width} cm
              </p>
            </div>
          </div>

          <div className="mt-3 hidden border-t border-[#f6f1e7]/12 pt-3 xl:block">
            <QuoteActions quote={quote} />
          </div>

          <p className="mt-3 border-t border-[#f6f1e7]/12 pt-3 text-[11px] leading-4 text-[#d9d1c4] xl:hidden">
            Bez zobowiązań. Finalna oferta zostanie potwierdzona po weryfikacji technicznej.
          </p>
        </section>

        <section className="border border-[#ded7ca] bg-[#fffdf8] p-2.5">
          <div className="mb-2">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#9a722e]">
              Twoja konfiguracja
            </p>
            <h3 className="mt-0.5 font-serif text-[17px] font-medium text-[#062c25]">
              Najważniejsze parametry
            </h3>
          </div>

          <div className="space-y-1">
            <SummaryRow label="Typ" value={getProductLabel(quote)} />
            <SummaryRow
              label="Wymiar"
              value={`${quote.configuration.length} × ${quote.configuration.width} cm`}
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
        </section>

        <details className="group border border-[#ded7ca] bg-[#fffdf8]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-3 py-2.5">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#9a722e]">
                Szczegóły wyceny
              </p>
              <p className="mt-0.5 text-[13px] font-bold text-[#24312d]">
                {quote.items.length} pozycji
              </p>
            </div>

            <span className="flex h-8 w-8 items-center justify-center border border-[#ded7ca] bg-[#f8f4ec] text-lg text-[#062c25] transition group-open:rotate-180">
              ↓
            </span>
          </summary>

          <div className="border-t border-[#ded7ca] px-3 pb-2">
            {quote.items.map((item, index) => {
              const itemTotalGross = getItemTotalGross(item);

              return (
                <div
                  key={`${item.name}-${index}`}
                  className="flex items-start justify-between gap-3 border-b border-[#ded7ca] py-2 last:border-b-0"
                >
                  <div>
                    <p className="text-sm font-bold leading-5 text-[#24312d]">
                      {item.name}
                    </p>
                    <p className="mt-1 text-[11px] text-[#68706c]">
                      Ilość: {getDisplayedItemQuantity(quote, item)}
                    </p>
                  </div>

                  <p className="shrink-0 text-right text-sm font-black text-[#062c25]">
                    {formatPrice(itemTotalGross)}
                  </p>
                </div>
              );
            })}
          </div>
        </details>

        <div className="border border-[#d7c9ab] bg-[#f4ead5]/55 px-3 py-2">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9a722e]">
            Co otrzymasz?
          </p>
          <p className="mt-1 text-[11px] leading-4 text-[#4f5854]">
            Podsumowanie konfiguracji i dokument PDF na e-mail. Doradca MoonGlass
            otrzyma komplet danych do dalszej weryfikacji.
          </p>
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
    <div className="flex items-start justify-between gap-4 border-b border-[#ded7ca] py-1 last:border-b-0">
      <p className="text-[13px] text-[#68706c]">{label}</p>
      <p className="max-w-[62%] text-right text-[13px] font-bold leading-4 text-[#24312d]">
        {value}
      </p>
    </div>
  );
}
