import type {
  ProductConfiguration,
  RoofOption,
  WallOption,
  Width,
  Length,
} from "@/domain/ProductConfiguration";
import {
  ROOF_LABELS,
  WALL_LABELS,
} from "@/data/configuration-labels";

interface Props {
  configuration: ProductConfiguration;
  onChange(configuration: ProductConfiguration): void;
}

const WIDTH_OPTIONS: Width[] = [
  306, 406, 506, 606, 706, 806, 906, 1006, 1106, 1206,
];

const LENGTH_OPTIONS: Length[] = [300, 350, 400, 450, 500];

const ROOF_OPTIONS: RoofOption[] = [
  "polycarbonate_clear",
  "polycarbonate_milky",
  "polycarbonate_grey",
  "polycarbonate_smoke",
  "glass_clear",
  "glass_milky",
];

const WALL_OPTIONS: WallOption[] = [
  "none",
  "glass_clear",
  "glass_milky",
  "glass_tinted",
];

export function ConfigurationForm({ configuration, onChange }: Props) {
  const hasWalls = configuration.walls !== "none";

  function updateConfiguration(partial: Partial<ProductConfiguration>) {
    onChange({
      ...configuration,
      ...partial,
    });
  }

  function updateWalls(walls: WallOption) {
    onChange({
      ...configuration,
      walls,
      hasFrontZip: walls === "none" ? false : configuration.hasFrontZip,
      hasLeftZip: walls === "none" ? false : configuration.hasLeftZip,
      hasRightZip: walls === "none" ? false : configuration.hasRightZip,
    });
  }

  return (
    <div className="space-y-6">
      <ConfigurationGroup
        eyebrow="Krok 1"
        title="Wymiary konstrukcji"
        description="Wybierz podstawowy wymiar produktu. Cena aktualizuje się automatycznie."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <SelectField
            label="Szerokość"
            value={configuration.width}
            onChange={(value) =>
              updateConfiguration({ width: Number(value) as Width })
            }
            options={WIDTH_OPTIONS.map((width) => ({
              value: String(width),
              label: `${width} cm`,
            }))}
          />

          <SelectField
            label="Długość"
            value={configuration.length}
            onChange={(value) =>
              updateConfiguration({ length: Number(value) as Length })
            }
            options={LENGTH_OPTIONS.map((length) => ({
              value: String(length),
              label: `${length} cm`,
            }))}
          />
        </div>
      </ConfigurationGroup>

      <ConfigurationGroup
        eyebrow="Krok 2"
        title="Dach i ściany"
        description="Dach wpływa na wygląd konstrukcji, a wybór ścian zmienia produkt w ogród zimowy."
      >
        <div className="space-y-3">
          <SelectField
            label="Pokrycie dachu"
            value={configuration.roof}
            onChange={(value) =>
              updateConfiguration({ roof: value as RoofOption })
            }
            options={ROOF_OPTIONS.map((roof) => ({
              value: roof,
              label: ROOF_LABELS[roof],
            }))}
          />

          <SelectField
            label="Ściany"
            value={configuration.walls}
            onChange={(value) => updateWalls(value as WallOption)}
            options={WALL_OPTIONS.map((walls) => ({
              value: walls,
              label: WALL_LABELS[walls],
            }))}
          />

          <div className="rounded-2xl bg-neutral-100 p-4 text-sm leading-6 text-neutral-600">
            {hasWalls
              ? "Wybrane ściany oznaczają konfigurację ogrodu zimowego. Możesz dodać rolety ZIP."
              : "Brak ścian oznacza otwarte zadaszenie tarasu. Rolety ZIP są dostępne po wybraniu ścian."}
          </div>
        </div>
      </ConfigurationGroup>

      <ConfigurationGroup
        eyebrow="Krok 3"
        title="Osłony i komfort"
        description="Dobierz elementy zwiększające komfort korzystania z tarasu."
      >
        <div className="grid gap-3">
          <ToggleCard
            title="Roleta ZIP przód"
            description="Osłona przedniej części zabudowy."
            checked={configuration.hasFrontZip}
            disabled={!hasWalls}
            onChange={(checked) =>
              updateConfiguration({ hasFrontZip: checked })
            }
          />

          <ToggleCard
            title="Roleta ZIP lewa"
            description="Osłona boczna po lewej stronie."
            checked={configuration.hasLeftZip}
            disabled={!hasWalls}
            onChange={(checked) =>
              updateConfiguration({ hasLeftZip: checked })
            }
          />

          <ToggleCard
            title="Roleta ZIP prawa"
            description="Osłona boczna po prawej stronie."
            checked={configuration.hasRightZip}
            disabled={!hasWalls}
            onChange={(checked) =>
              updateConfiguration({ hasRightZip: checked })
            }
          />

          <ToggleCard
            title="Markiza dachowa"
            description="Dodatkowe zacienienie konstrukcji."
            checked={configuration.hasAwning}
            onChange={(checked) =>
              updateConfiguration({ hasAwning: checked })
            }
          />
        </div>
      </ConfigurationGroup>

      <ConfigurationGroup
        eyebrow="Krok 4"
        title="Oświetlenie"
        description="Dodaj światło, które podkreśli konstrukcję wieczorem."
      >
        <div className="grid gap-3">
          <ToggleCard
            title="Oświetlenie LED punktowe"
            description="Punkty świetlne w konstrukcji."
            checked={configuration.hasLed}
            onChange={(checked) => updateConfiguration({ hasLed: checked })}
          />

          <ToggleCard
            title="Oświetlenie LED taśma"
            description="Dekoracyjna linia światła w konstrukcji."
            checked={configuration.hasCob}
            onChange={(checked) => updateConfiguration({ hasCob: checked })}
          />
        </div>
      </ConfigurationGroup>

      <ConfigurationGroup
        eyebrow="Krok 5"
        title="Akcesoria"
        description="Elementy techniczne i wykończeniowe potrzebne przy zabudowie."
      >
        <div className="grid gap-3">
          <ToggleCard
            title="Uchwyty"
            description="Zestaw uchwytów do systemu ścian."
            checked={configuration.hasHandles}
            onChange={(checked) =>
              updateConfiguration({ hasHandles: checked })
            }
          />

          <ToggleCard
            title="Szczotki"
            description="Elementy uszczelniające i przeciwkurzowe."
            checked={configuration.hasBrushes}
            onChange={(checked) =>
              updateConfiguration({ hasBrushes: checked })
            }
          />

          <ToggleCard
            title="Profil wyrównujący"
            description="Przygotowanie pod stabilny montaż systemu."
            checked={configuration.hasLevelingProfile}
            onChange={(checked) =>
              updateConfiguration({ hasLevelingProfile: checked })
            }
          />
        </div>
      </ConfigurationGroup>
    </div>
  );
}

interface ConfigurationGroupProps {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

function ConfigurationGroup({
  eyebrow,
  title,
  description,
  children,
}: ConfigurationGroupProps) {
  return (
    <section className="rounded-[1.25rem] border border-neutral-200 bg-neutral-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
        {eyebrow}
      </p>
      <h4 className="mt-2 text-lg font-semibold text-neutral-950">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-neutral-600">{description}</p>

      <div className="mt-4">{children}</div>
    </section>
  );
}

interface SelectFieldOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  value: string | number;
  options: SelectFieldOption[];
  onChange(value: string): void;
}

function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </span>
      <select
        value={String(value)}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm font-bold text-neutral-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface ToggleCardProps {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange(checked: boolean): void;
}

function ToggleCard({
  title,
  description,
  checked,
  disabled = false,
  onChange,
}: ToggleCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        "group flex w-full items-start justify-between gap-4 rounded-2xl border p-4 text-left transition",
        checked
          ? "border-emerald-500 bg-emerald-50 shadow-sm"
          : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50",
        disabled
          ? "cursor-not-allowed opacity-45 hover:border-neutral-200 hover:bg-white"
          : "cursor-pointer",
      ].join(" ")}
    >
      <span>
        <span className="block text-sm font-bold text-neutral-950">
          {title}
        </span>
        <span className="mt-1 block text-sm leading-5 text-neutral-600">
          {description}
        </span>
        {disabled ? (
          <span className="mt-2 block text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">
            Dostępne po wybraniu ścian
          </span>
        ) : null}
      </span>

      <span
        className={[
          "mt-1 flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition",
          checked ? "bg-emerald-500" : "bg-neutral-300",
        ].join(" ")}
      >
        <span
          className={[
            "h-5 w-5 rounded-full bg-white shadow-sm transition",
            checked ? "translate-x-5" : "translate-x-0",
          ].join(" ")}
        />
      </span>
    </button>
  );
}