import type {
  ProductConfiguration,
  Width,
  Length,
} from "@/domain/ProductConfiguration";

interface Props {
  configuration: ProductConfiguration;
  onChange(configuration: ProductConfiguration): void;
}

const widths: Width[] = [306, 406, 506];

const lengths: Length[] = [300];

export function DimensionsSection({ configuration, onChange }: Props) {
  return (
    <section>
      <label>
        Szerokość
        <br />
        <select
          value={configuration.width}
          onChange={(event) =>
            onChange({
              ...configuration,
              width: Number(event.target.value) as Width,
            })
          }
        >
          {widths.map((width) => (
            <option key={width} value={width}>
              {width} cm
            </option>
          ))}
        </select>
      </label>

      <br />
      <br />

      <label>
        Długość
        <br />
        <select
          value={configuration.length}
          onChange={(event) =>
            onChange({
              ...configuration,
              length: Number(event.target.value) as Length,
            })
          }
        >
          {lengths.map((length) => (
            <option key={length} value={length}>
              {length} cm
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}