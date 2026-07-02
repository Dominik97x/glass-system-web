import type {
  ProductConfiguration,
  WallOption,
} from "@/domain/ProductConfiguration";

interface Props {
  configuration: ProductConfiguration;
  onChange(configuration: ProductConfiguration): void;
}

const walls: { value: WallOption; label: string }[] = [
  { value: "none", label: "Brak ścian" },
  { value: "glass_clear", label: "Szyby przezroczyste" },
  { value: "glass_milky", label: "Szyby mleczne" },
  { value: "glass_tinted", label: "Szyby przyciemniane" },
];

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
              hasFrontZip:
                wallsValue === "none" ? false : configuration.hasFrontZip,
              hasLeftZip:
                wallsValue === "none" ? false : configuration.hasLeftZip,
              hasRightZip:
                wallsValue === "none" ? false : configuration.hasRightZip,
            });
          }}
        >
          {walls.map((wall) => (
            <option key={wall.value} value={wall.value}>
              {wall.label}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}