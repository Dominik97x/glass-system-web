import type { ProductConfiguration } from "@/domain/ProductConfiguration";

import { ConfigurationForm } from "./ConfigurationForm";

interface Props {
  configuration: ProductConfiguration;
  onChange(configuration: ProductConfiguration): void;
}

export function ConfiguratorPanel({ configuration, onChange }: Props) {
  return (
    <aside className="border-r border-[#d5ccbc] bg-[#f6f1e7]">
      <div className="p-3">
        <div className="mb-3 border-b border-[#d5ccbc] pb-3">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#9a722e]">
            Krok 1
          </p>
          <h3 className="mt-1 font-serif text-xl font-medium text-[#062c25]">
            Parametry projektu
          </h3>
        </div>

        <ConfigurationForm
          configuration={configuration}
          onChange={onChange}
        />
      </div>
    </aside>
  );
}
