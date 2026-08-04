import type { ProductConfiguration } from "@/domain/ProductConfiguration";

interface Props {
  configuration: ProductConfiguration;
  onChange(configuration: ProductConfiguration): void;
}

export function ZipSection({ configuration, onChange }: Props) {
  const hasWalls = configuration.walls !== "none";

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
          disabled={!hasWalls}
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
          disabled={!hasWalls}
          onChange={(event) =>
            onChange({
              ...configuration,
              hasRightZip: event.target.checked,
            })
          }
        />{" "}
        Roleta ZIP prawa
      </label>

      {!hasWalls && (
        <p>Bez ścian dostępna jest tylko roleta ZIP z przodu.</p>
      )}
    </section>
  );
}