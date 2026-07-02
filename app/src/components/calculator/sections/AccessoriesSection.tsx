import type { ProductConfiguration } from "@/domain/ProductConfiguration";

interface Props {
  configuration: ProductConfiguration;
  onChange(configuration: ProductConfiguration): void;
}

export function AccessoriesSection({ configuration, onChange }: Props) {
  return (
    <section>
      <label>
        <input
          type="checkbox"
          checked={configuration.hasHandles}
          onChange={(event) =>
            onChange({
              ...configuration,
              hasHandles: event.target.checked,
            })
          }
        />{" "}
        Uchwyty
      </label>

      <br />

      <label>
        <input
          type="checkbox"
          checked={configuration.hasBrushes}
          onChange={(event) =>
            onChange({
              ...configuration,
              hasBrushes: event.target.checked,
            })
          }
        />{" "}
        Szczotki
      </label>

      <br />

      <label>
        <input
          type="checkbox"
          checked={configuration.hasLevelingProfile}
          onChange={(event) =>
            onChange({
              ...configuration,
              hasLevelingProfile: event.target.checked,
            })
          }
        />{" "}
        Profil wyrównujący
      </label>
    </section>
  );
}