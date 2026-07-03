import {
  getProductKind,
  type ProductConfiguration,
} from "@/domain/ProductConfiguration";
import {
  ROOF_LABELS,
  WALL_LABELS,
} from "@/data/configuration-labels";

interface Props {
  configuration: ProductConfiguration;
}

export function VisualizationPanel({ configuration }: Props) {
  const productKind = getProductKind(configuration);

  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
      <h2 className="text-xl font-semibold">Wizualizacja</h2>

      <div className="mt-6 flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-neutral-700 bg-neutral-950 p-6">
        <div className="text-center">
          <p className="text-lg font-semibold">
            {productKind === "terrace_roof"
              ? "Zadaszenie tarasu"
              : "Ogród zimowy"}
          </p>

          <p className="mt-2 text-sm text-neutral-400">
            Podgląd produktu pojawi się tutaj.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-2 text-sm text-neutral-300">
        <p>
          <strong className="text-white">Wymiary:</strong>{" "}
          {configuration.width} × {configuration.length} cm
        </p>

        <p>
          <strong className="text-white">Dach:</strong>{" "}
          {ROOF_LABELS[configuration.roof]}
        </p>

        <p>
          <strong className="text-white">Ściany:</strong>{" "}
          {WALL_LABELS[configuration.walls]}
        </p>
      </div>
    </section>
  );
}