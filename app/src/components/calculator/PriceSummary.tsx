import type { Quote } from "@/domain/Quote";

interface Props {
  quote: Quote;
}

export function PriceSummary({ quote }: Props) {
  return (
    <section>
      <h2>Podsumowanie</h2>

      <p>
        <strong>Razem:</strong> {quote.totalGross} zł
      </p>
    </section>
  );
}