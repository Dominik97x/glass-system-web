import type { ReactNode } from "react";

import { ROOF_LABELS, WALL_LABELS } from "@/data/configuration-labels";
import type {
  Length,
  ProductConfiguration,
  RoofOption,
  WallOption,
  Width,
} from "@/domain/ProductConfiguration";

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
  const productLabel = hasWalls ? "Ogród zimowy" : "Zadaszenie tarasu";

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

  function updateSpotLed(checked: boolean) {
    onChange({
      ...configuration,
      hasLed: checked,
      hasCob: checked ? false : configuration.hasCob,
    });
  }

  function updateStripLed(checked: boolean) {
    onChange({
      ...configuration,
      hasCob: checked,
      hasLed: checked ? false : configuration.hasLed,
    });
  }

  return (
    <div className="space-y-3">
      <section className="rounded-[1.5rem] border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
              Konfiguracja
            </p>
            <h3 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-neutral-950">
              Parametry produktu
            </h3>
          </div>

          <div className="min-w-28 rounded-2xl bg-neutral-950 px-3 py-3 text-right text-white">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
              Typ
            </p>
            <p className="mt-1 text-sm font-bold leading-tight">
              {productLabel}
            </p>
          </div>
        </div>

        <p className="mt-3 text-sm leading-6 text-neutral-600">
          Wybierz parametry. Cena i wizualizacja aktualizują się automatycznie.
        </p>
      </section>

      <CompactPanel title="Wymiary">
        <div className="grid grid-cols-2 gap-3">
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
      </CompactPanel>

      <CompactPanel title="Dach i ściany">
        <div className="grid gap-3">
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
        </div>

        <div className="mt-3 rounded-2xl bg-neutral-100 px-4 py-3 text-sm leading-6 text-neutral-600">
          {hasWalls
            ? "Ściany zmieniają produkt w ogród zimowy i odblokowują ZIP."
            : "Brak ścian oznacza zadaszenie tarasu. ZIP dostępny po wyborze ścian."}
        </div>
      </CompactPanel>

      <CompactPanel title="Opcje">
        <div className="grid grid-cols-2 gap-2">
          <OptionTile
            label="ZIP przód"
            checked={configuration.hasFrontZip}
            disabled={!hasWalls}
            onChange={(checked) =>
              updateConfiguration({ hasFrontZip: checked })
            }
          />

          <OptionTile
            label="ZIP lewa"
            checked={configuration.hasLeftZip}
            disabled={!hasWalls}
            onChange={(checked) =>
              updateConfiguration({ hasLeftZip: checked })
            }
          />

          <OptionTile
            label="ZIP prawa"
            checked={configuration.hasRightZip}
            disabled={!hasWalls}
            onChange={(checked) =>
              updateConfiguration({ hasRightZip: checked })
            }
          />

          <OptionTile
            label="Markiza"
            checked={configuration.hasAwning}
            onChange={(checked) =>
              updateConfiguration({ hasAwning: checked })
            }
          />

          <OptionTile
            label="LED punktowe"
            checked={configuration.hasLed}
            onChange={updateSpotLed}
          />

          <OptionTile
            label="LED taśma"
            checked={configuration.hasCob}
            onChange={updateStripLed}
          />

          <OptionTile
            label="Uchwyty"
            checked={configuration.hasHandles}
            onChange={(checked) =>
              updateConfiguration({ hasHandles: checked })
            }
          />

          <OptionTile
            label="Szczotki"
            checked={configuration.hasBrushes}
            onChange={(checked) =>
              updateConfiguration({ hasBrushes: checked })
            }
          />

          <div className="col-span-2">
            <OptionTile
              label="Profil wyrównujący"
              checked={configuration.hasLevelingProfile}
              onChange={(checked) =>
                updateConfiguration({ hasLevelingProfile: checked })
              }
            />
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs leading-5 text-emerald-950">
          LED punktowe i LED taśma są wariantami alternatywnymi — wybór jednej
          opcji automatycznie wyłącza drugą.
        </div>
      </CompactPanel>
    </div>
  );
}

interface CompactPanelProps {
  title: string;
  children: ReactNode;
}

function CompactPanel({ title, children }: CompactPanelProps) {
  return (
    <section className="rounded-[1.5rem] border border-neutral-200 bg-white p-4 shadow-sm">
      <h4 className="text-sm font-black uppercase tracking-[0.2em] text-neutral-500">
        {title}
      </h4>

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
      <span className="text-[11px] font-black uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </span>
      <select
        value={String(value)}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 text-sm font-bold text-neutral-950 outline-none transition hover:bg-white focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
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

interface OptionTileProps {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange(checked: boolean): void;
}

function OptionTile({
  label,
  checked,
  disabled = false,
  onChange,
}: OptionTileProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        "flex min-h-16 w-full items-center justify-between gap-3 rounded-2xl border px-3 py-3 text-left transition",
        checked
          ? "border-emerald-500 bg-emerald-50"
          : "border-neutral-200 bg-neutral-50 hover:border-neutral-300 hover:bg-white",
        disabled
          ? "cursor-not-allowed opacity-45 hover:border-neutral-200 hover:bg-neutral-50"
          : "cursor-pointer",
      ].join(" ")}
    >
      <span className="min-w-0">
        <span className="block text-sm font-bold leading-tight text-neutral-950">
          {label}
        </span>
        <span className="mt-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
          {disabled ? "niedostępne" : checked ? "wybrane" : "dodaj"}
        </span>
      </span>

      <span
        className={[
          "flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition",
          checked ? "bg-emerald-500" : "bg-neutral-300",
        ].join(" ")}
      >
        <span
          className={[
            "h-4 w-4 rounded-full bg-white shadow-sm transition",
            checked ? "translate-x-5" : "translate-x-0",
          ].join(" ")}
        />
      </span>
    </button>
  );
}