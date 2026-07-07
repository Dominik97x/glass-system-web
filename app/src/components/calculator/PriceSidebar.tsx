import type { Quote } from "@/domain/Quote";
import { getProductKind } from "@/domain/ProductConfiguration";
import { ROOF_LABELS, WALL_LABELS } from "@/data/configuration-labels";
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
  if ("totalGross" in item && typeof item.totalGross === "number") {
    return item.totalGross;
  }

  if (
    "unitPriceGross" in item &&
    typeof item.unitPriceGross === "number" &&
    "quantity" in item &&
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
  const selected = [
    quote.configuration.hasLed ? "LED punktowe" : null,
    quote.configuration.hasCob ? "LED taśma" : null,
  ].filter(Boolean);

  return selected.length > 0 ? selected.join(", ") : "Brak";
}

function getAccessoriesLabel(quote: Quote): string {
  const selected = [
    quote.configuration.hasHandles ? "uchwyty" : null,
    quote.configuration.hasBrushes ? "szczotki" : null,
    quote.configuration.hasLevelingProfile ? "profil wyrównujący" : null,
  ].filter(Boolean);

  return selected.length > 0 ? selected.join(", ") : "Brak";
}

export function PriceSidebar({ quote }: Props) {
  return (
    <aside className="h-full rounded-[1.5rem] border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="rounded-[1.25rem] bg-neutral-950 p-5 text-white">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
          Wycena orientacyjna
        </p>
        <p className="mt-3 text-sm text-white/62">Razem brutto</p>
        <p className="mt-1 text-4xl font-black tracking-tight">
          {formatPrice(quote.totalGross)}
        </p>
        <p className="mt-4 text-sm leading-6 text-white/68">
          Cena ma charakter poglądowy. Finalna oferta zostanie potwierdzona po
          kontakcie z doradcą.
        </p>
      </div>

      <div className="mt-5 rounded-[1.25rem] border border-neutral-200 bg-neutral-50 p-5">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
          Wybrana konfiguracja
        </p>

        <div className="mt-4 space-y-3">
          <SummaryRow label="Typ produktu" value={getProductLabel(quote)} />
          <SummaryRow
            label="Wymiary"
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
          <SummaryRow label="Rolety ZIP" value={getZipLabel(quote)} />
          <SummaryRow
            label="Markiza"
            value={quote.configuration.hasAwning ? "Tak" : "Nie"}
          />
          <SummaryRow label="Oświetlenie" value={getLightingLabel(quote)} />
          <SummaryRow label="Akcesoria" value={getAccessoriesLabel(quote)} />
        </div>
      </div>

      <div className="mt-5 rounded-[1.25rem] border border-neutral-200 bg-white p-5">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
              Pozycje oferty
            </p>
            <h3 className="mt-2 text-xl font-semibold text-neutral-950">
              Składniki wyceny
            </h3>
          </div>
          <p className="text-sm font-bold text-neutral-500">
            {quote.items.length}
          </p>
        </div>

        <div className="space-y-3">
          {quote.items.map((item, index) => {
            const itemTotalGross = getItemTotalGross(item);
            const percentage =
              quote.totalGross > 0
                ? Math.max(
                    8,
                    Math.min(100, (itemTotalGross / quote.totalGross) * 100)
                  )
                : 8;

            return (
              <div
                key={`${item.name}-${index}`}
                className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-neutral-950">{item.name}</p>
                    <p className="mt-1 text-sm text-neutral-500">
                      Ilość: {item.quantity}
                    </p>
                  </div>
                  <p className="text-right text-sm font-black text-neutral-950">
                    {formatPrice(itemTotalGross)}
                  </p>
                </div>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-200">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 rounded-[1.25rem] border border-emerald-100 bg-emerald-50 p-5">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">
          Następny krok
        </p>
        <p className="mt-2 text-lg font-semibold text-emerald-950">
          Wyślij konfigurację do doradcy.
        </p>
        <p className="mt-2 text-sm leading-6 text-emerald-900/75">
          Zapytanie zapisze dane kontaktowe, wybrane opcje, pozycje oferty i
          cenę orientacyjną.
        </p>

        <div className="mt-4">
          <QuoteActions quote={quote} />
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
    <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-3 last:border-b-0 last:pb-0">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="max-w-[58%] text-right text-sm font-bold text-neutral-950">
        {value}
      </p>
    </div>
  );
}