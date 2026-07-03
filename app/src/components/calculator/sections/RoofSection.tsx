import type {
  ProductConfiguration,
  RoofOption,
} from "@/domain/ProductConfiguration";
import { ROOF_OPTIONS } from "@/data/configuration-labels";

interface Props {
  configuration: ProductConfiguration;
  onChange(configuration: ProductConfiguration): void;
}

export function RoofSection({ configuration, onChange }: Props) {
  return (
    <section>
      <label>
        Pokrycie dachu
        <br />
        <select
          value={configuration.roof}
          onChange={(event) =>
            onChange({
              ...configuration,
              roof: event.target.value as RoofOption,
            })
          }
        >
          {ROOF_OPTIONS.map((roof) => (
            <option key={roof.value} value={roof.value}>
              {roof.label}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}