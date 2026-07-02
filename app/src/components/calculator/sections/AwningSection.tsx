import type { ProductConfiguration } from "@/domain/ProductConfiguration";

interface Props {
  configuration: ProductConfiguration;
  onChange(configuration: ProductConfiguration): void;
}

export function AwningSection({ configuration, onChange }: Props) {
  return (
    <section>
      <label>
        <input
          type="checkbox"
          checked={configuration.hasAwning}
          onChange={(event) =>
            onChange({
              ...configuration,
              hasAwning: event.target.checked,
            })
          }
        />{" "}
        Markiza
      </label>
    </section>
  );
}