import type { Quote } from "@/domain/Quote";

import { ConfigurationSummary } from "./ConfigurationSummary";
import { PriceSummary } from "./PriceSummary";
import { QuoteActions } from "./QuoteActions";
import { QuoteItems } from "./QuoteItems";

interface Props {
  quote: Quote;
}

export function PriceSidebar({ quote }: Props) {
  return (
    <aside className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
      <PriceSummary quote={quote} />

      <div className="mt-6 border-t border-neutral-800 pt-6">
        <ConfigurationSummary configuration={quote.configuration} />
      </div>

      <div className="mt-6 border-t border-neutral-800 pt-6">
        <QuoteItems quote={quote} />
      </div>

      <div className="mt-6 border-t border-neutral-800 pt-6">
        <QuoteActions quote={quote} />
      </div>
    </aside>
  );
}