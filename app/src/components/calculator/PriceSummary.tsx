import type { Quote } from "@/domain/Quote";
import { formatPrice } from "@/lib/format-price";

interface Props {
  quote: Quote;
}

export function PriceSummary({ quote }: Props) {
  return (
    <section>
      <h2>Podsumowanie</h2>

      <p>
        <strong>Razem:</strong> {formatPrice(quote.totalGross)}
      </p>
    </section>
  );
}