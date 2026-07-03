import type { Quote } from "@/domain/Quote";

import { PriceSummary } from "./PriceSummary";
import { QuoteItems } from "./QuoteItems";

interface Props {
  quote: Quote;
}

export function PriceSidebar({ quote }: Props) {
  return (
    <aside className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
      <PriceSummary quote={quote} />

      <div className="mt-6">
        <QuoteItems quote={quote} />
      </div>
    </aside>
  );
}