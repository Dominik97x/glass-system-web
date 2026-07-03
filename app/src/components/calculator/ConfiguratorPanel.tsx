import type { ProductConfiguration } from "@/domain/ProductConfiguration";

import { ConfigurationForm } from "./ConfigurationForm";

interface Props {
  configuration: ProductConfiguration;
  onChange(configuration: ProductConfiguration): void;
}

export function ConfiguratorPanel({ configuration, onChange }: Props) {
  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
      <ConfigurationForm
        configuration={configuration}
        onChange={onChange}
      />
    </section>
  );
}