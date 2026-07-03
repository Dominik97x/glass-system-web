import type { ProductConfiguration } from "@/domain/ProductConfiguration";
import { getConfigurationSummaryRows } from "@/lib/configuration-summary";

interface Props {
  configuration: ProductConfiguration;
}

export function ConfigurationSummary({ configuration }: Props) {
  const rows = getConfigurationSummaryRows(configuration);

  return (
    <section>
      <h2 className="text-lg font-semibold">Wybrana konfiguracja</h2>

      <dl className="mt-4 space-y-3 text-sm">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-neutral-400">{row.label}</dt>
            <dd className="font-medium text-white">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}