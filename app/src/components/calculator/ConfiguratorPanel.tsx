import type { ProductConfiguration } from "@/domain/ProductConfiguration";

import { ConfigurationForm } from "./ConfigurationForm";

interface Props {
  configuration: ProductConfiguration;
  onChange(configuration: ProductConfiguration): void;
}

export function ConfiguratorPanel({ configuration, onChange }: Props) {
  return (
    <aside className="border-r border-neutral-200 bg-white xl:sticky xl:top-0 xl:h-[calc(100vh-0rem)] xl:max-h-screen xl:overflow-y-auto">
      <div className="p-3">
        <ConfigurationForm configuration={configuration} onChange={onChange} />
      </div>
    </aside>
  );
}