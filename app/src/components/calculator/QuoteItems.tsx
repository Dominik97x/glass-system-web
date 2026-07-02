import type { Quote } from "@/domain/Quote";

interface Props {
  quote: Quote;
}

export function QuoteItems({ quote }: Props) {
  return (
    <ul>
      {quote.items.map((item) => (
        <li key={item.id}>
          {item.name}: {item.totalPriceGross} zł
        </li>
      ))}
    </ul>
  );
}