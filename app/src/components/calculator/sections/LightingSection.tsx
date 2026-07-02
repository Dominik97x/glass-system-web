import type { ProductConfiguration } from "@/domain/ProductConfiguration";

interface Props {
  configuration: ProductConfiguration;
  onChange(configuration: ProductConfiguration): void;
}

export function LightingSection({ configuration, onChange }: Props) {
  return (
    <section>
      <label>
        <input
          type="checkbox"
          checked={configuration.hasLed}
          onChange={(event) =>
            onChange({
              ...configuration,
              hasLed: event.target.checked,
            })
          }
        />{" "}
        Oświetlenie LED punktowe
      </label>

      <br />

      <label>
        <input
          type="checkbox"
          checked={configuration.hasCob}
          onChange={(event) =>
            onChange({
              ...configuration,
              hasCob: event.target.checked,
            })
          }
        />{" "}
        Oświetlenie LED taśma
      </label>
    </section>
  );
}