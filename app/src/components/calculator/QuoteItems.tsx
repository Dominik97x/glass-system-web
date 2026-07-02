import type { Quote } from "@/domain/Quote";
import { formatPrice } from "@/lib/format-price";

interface Props {
  quote: Quote;
}

export function QuoteItems({ quote }: Props) {
  return (
    <ul>
      {quote.items.map((item) => (
        <li key={item.id}>
          {item.name}: {formatPrice(item.totalPriceGross)}
        </li>
      ))}
    </ul>
  );
}