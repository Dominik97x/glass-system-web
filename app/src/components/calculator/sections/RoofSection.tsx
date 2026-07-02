import type {
  ProductConfiguration,
  RoofOption,
} from "@/domain/ProductConfiguration";

interface Props {
  configuration: ProductConfiguration;
  onChange(configuration: ProductConfiguration): void;
}

const roofs: { value: RoofOption; label: string }[] = [
  { value: "polycarbonate_clear", label: "Poliwęglan przezroczysty" },
  { value: "polycarbonate_milky", label: "Poliwęglan mleczny" },
  { value: "polycarbonate_grey", label: "Poliwęglan szary" },
  { value: "polycarbonate_smoke", label: "Poliwęglan dymiony" },
  { value: "glass_clear", label: "Szkło przezroczyste" },
  { value: "glass_milky", label: "Szkło mleczne" },
];

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
          {roofs.map((roof) => (
            <option key={roof.value} value={roof.value}>
              {roof.label}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}