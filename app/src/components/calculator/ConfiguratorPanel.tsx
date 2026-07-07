import type { ProductConfiguration } from "@/domain/ProductConfiguration";
import { ConfigurationForm } from "./ConfigurationForm";

interface Props {
  configuration: ProductConfiguration;
  onChange(configuration: ProductConfiguration): void;
}

export function ConfiguratorPanel({ configuration, onChange }: Props) {
  return (
    <section className="flex h-full flex-col rounded-[1.5rem] border border-neutral-200 bg-white p-5 shadow-sm xl:max-h-[calc(100vh-140px)]">
      <div className="shrink-0 border-b border-neutral-200 bg-white pb-5">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
          Konfiguracja
        </p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
          Parametry produktu
        </h3>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          Wybierz wymiary, dach, ściany i dodatki. Każda zmiana aktualizuje
          wycenę oraz wizualizację.
        </p>
      </div>

      <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-2">
        <ConfigurationForm
          configuration={configuration}
          onChange={onChange}
        />
      </div>
    </section>
  );
}