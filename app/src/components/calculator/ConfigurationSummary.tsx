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

function getZipSummary(configuration: ProductConfiguration): string {
  if (configuration.walls === "none") {
    return "Niedostępne bez ścian";
  }

  const selectedZips: string[] = [];

  if (configuration.hasFrontZip) {
    selectedZips.push("przód");
  }

  if (configuration.hasLeftZip) {
    selectedZips.push("lewa");
  }

  if (configuration.hasRightZip) {
    selectedZips.push("prawa");
  }

  return selectedZips.length > 0 ? selectedZips.join(", ") : "Brak";
}

function getLightingSummary(configuration: ProductConfiguration): string {
  const selectedLighting: string[] = [];

  if (configuration.hasLed) {
    selectedLighting.push("LED punktowe");
  }

  if (configuration.hasCob) {
    selectedLighting.push("LED taśma");
  }

  return selectedLighting.length > 0
    ? selectedLighting.join(", ")
    : "Brak";
}

function getAccessoriesSummary(configuration: ProductConfiguration): string {
  const selectedAccessories: string[] = [];

  if (configuration.hasHandles) {
    selectedAccessories.push("uchwyty");
  }

  if (configuration.hasBrushes) {
    selectedAccessories.push("szczotki");
  }

  if (configuration.hasLevelingProfile) {
    selectedAccessories.push("profil wyrównujący");
  }

  return selectedAccessories.length > 0
    ? selectedAccessories.join(", ")
    : "Brak";
}

export function ConfigurationSummary({ configuration }: Props) {
  const productKind = getProductKind(configuration);

  return (
    <section>
      <h2 className="text-lg font-semibold">Wybrana konfiguracja</h2>

      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-neutral-400">Typ produktu</dt>
          <dd className="font-medium text-white">
            {productKind === "terrace_roof"
              ? "Zadaszenie tarasu"
              : "Ogród zimowy"}
          </dd>
        </div>

        <div>
          <dt className="text-neutral-400">Wymiary</dt>
          <dd className="font-medium text-white">
            {configuration.width} × {configuration.length} cm
          </dd>
        </div>

        <div>
          <dt className="text-neutral-400">Dach</dt>
          <dd className="font-medium text-white">
            {ROOF_LABELS[configuration.roof]}
          </dd>
        </div>

        <div>
          <dt className="text-neutral-400">Ściany</dt>
          <dd className="font-medium text-white">
            {WALL_LABELS[configuration.walls]}
          </dd>
        </div>

        <div>
          <dt className="text-neutral-400">Rolety ZIP</dt>
          <dd className="font-medium text-white">
            {getZipSummary(configuration)}
          </dd>
        </div>

        <div>
          <dt className="text-neutral-400">Markiza</dt>
          <dd className="font-medium text-white">
            {configuration.hasAwning ? "Tak" : "Nie"}
          </dd>
        </div>

        <div>
          <dt className="text-neutral-400">Oświetlenie</dt>
          <dd className="font-medium text-white">
            {getLightingSummary(configuration)}
          </dd>
        </div>

        <div>
          <dt className="text-neutral-400">Akcesoria</dt>
          <dd className="font-medium text-white">
            {getAccessoriesSummary(configuration)}
          </dd>
        </div>
      </dl>
    </section>
  );
}