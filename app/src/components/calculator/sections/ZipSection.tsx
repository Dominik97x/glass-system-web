import type { ProductConfiguration } from "@/domain/ProductConfiguration";

interface Props {
  configuration: ProductConfiguration;
  onChange(configuration: ProductConfiguration): void;
}

export function ZipSection({ configuration, onChange }: Props) {
  if (configuration.walls === "none") {
    return null;
  }

  return (
    <section>
      <label>
        <input
          type="checkbox"
          checked={configuration.hasFrontZip}
          onChange={(event) =>
            onChange({
              ...configuration,
              hasFrontZip: event.target.checked,
            })
          }
        />{" "}
        Roleta ZIP przód
      </label>

      <br />

      <label>
        <input
          type="checkbox"
          checked={configuration.hasLeftZip}
          onChange={(event) =>
            onChange({
              ...configuration,
              hasLeftZip: event.target.checked,
            })
          }
        />{" "}
        Roleta ZIP lewa
      </label>

      <br />

      <label>
        <input
          type="checkbox"
          checked={configuration.hasRightZip}
          onChange={(event) =>
            onChange({
              ...configuration,
              hasRightZip: event.target.checked,
            })
          }
        />{" "}
        Roleta ZIP prawa
      </label>
    </section>
  );
}