import type {
  ProductConfiguration,
  WallOption,
} from "@/domain/ProductConfiguration";
import { WALL_OPTIONS } from "@/data/configuration-labels";

interface Props {
  configuration: ProductConfiguration;
  onChange(configuration: ProductConfiguration): void;
}

export function WallsSection({ configuration, onChange }: Props) {
  return (
    <section>
      <label>
        Ściany
        <br />
        <select
          value={configuration.walls}
          onChange={(event) => {
            const wallsValue = event.target.value as WallOption;

            onChange({
              ...configuration,
              walls: wallsValue,
              // Przedni ZIP jest dostępny również dla samego zadaszenia.
              hasFrontZip: configuration.hasFrontZip,
              hasLeftZip:
                wallsValue === "none" ? false : configuration.hasLeftZip,
              hasRightZip:
                wallsValue === "none" ? false : configuration.hasRightZip,
            });
          }}
        >
          {WALL_OPTIONS.map((wall) => (
            <option key={wall.value} value={wall.value}>
              {wall.label}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}