import type { ProductConfiguration } from "@/domain/ProductConfiguration";

import { AccessoriesSection } from "./sections/AccessoriesSection";
import { AwningSection } from "./sections/AwningSection";
import { DimensionsSection } from "./sections/DimensionsSection";
import { LightingSection } from "./sections/LightingSection";
import { RoofSection } from "./sections/RoofSection";
import { WallsSection } from "./sections/WallsSection";
import { ZipSection } from "./sections/ZipSection";

interface Props {
  configuration: ProductConfiguration;
  onChange(configuration: ProductConfiguration): void;
}

export function ConfigurationForm({ configuration, onChange }: Props) {
  return (
    <section>
      <h2>Konfiguracja</h2>

      <DimensionsSection
        configuration={configuration}
        onChange={onChange}
      />

      <br />
      <br />

      <RoofSection
        configuration={configuration}
        onChange={onChange}
      />

      <br />
      <br />

      <WallsSection
        configuration={configuration}
        onChange={onChange}
      />

      <br />
      <br />

      <ZipSection
        configuration={configuration}
        onChange={onChange}
      />

      <br />
      <br />

      <AwningSection
        configuration={configuration}
        onChange={onChange}
      />

      <br />
      <br />

      <LightingSection
        configuration={configuration}
        onChange={onChange}
      />

      <br />
      <br />

      <AccessoriesSection
        configuration={configuration}
        onChange={onChange}
      />
    </section>
  );
}