import type {
  ProductConfiguration,
  Width,
  Length,
  RoofOption,
  WallOption,
} from "@/domain/ProductConfiguration";

interface Props {
  configuration: ProductConfiguration;
  onChange(configuration: ProductConfiguration): void;
}

const widths: Width[] = [306, 406, 506];
const lengths: Length[] = [300];

const roofs: { value: RoofOption; label: string }[] = [
  { value: "polycarbonate_clear", label: "Poliwęglan przezroczysty" },
  { value: "polycarbonate_milky", label: "Poliwęglan mleczny" },
  { value: "polycarbonate_grey", label: "Poliwęglan szary" },
  { value: "polycarbonate_smoke", label: "Poliwęglan dymiony" },
  { value: "glass_clear", label: "Szkło przezroczyste" },
  { value: "glass_milky", label: "Szkło mleczne" },
];

const walls: { value: WallOption; label: string }[] = [
  { value: "none", label: "Brak ścian" },
  { value: "glass_clear", label: "Szyby przezroczyste" },
  { value: "glass_milky", label: "Szyby mleczne" },
  { value: "glass_tinted", label: "Szyby przyciemniane" },
];

export function ConfigurationForm({ configuration, onChange }: Props) {
  const hasWalls = configuration.walls !== "none";

  return (
    <section>
      <h2>Konfiguracja</h2>

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

      <br />
      <br />

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

      <br />
      <br />

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

      {hasWalls && (
        <>
          <br />
          <br />

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
        </>
      )}

      <br />
      <br />

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

      <br />

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

      <br />

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