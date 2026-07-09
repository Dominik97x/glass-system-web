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
  const productLabel = hasWalls ? "Ogród zimowy" : "Zadaszenie";

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
    <div className="space-y-3 text-sm">
      <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">
              Konfiguracja
            </p>
            <h3 className="mt-1 text-xl font-semibold leading-tight tracking-tight text-neutral-950">
              Parametry
            </h3>
          </div>

          <div className="rounded-2xl bg-neutral-950 px-3 py-2 text-right text-white">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-300">
              Typ
            </p>
            <p className="mt-1 text-xs font-black leading-tight">
              {productLabel}
            </p>
          </div>
        </div>
      </section>

      <CompactPanel title="Konstrukcja">
        <div className="grid grid-cols-2 gap-2">
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

        <div className="mt-3">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-neutral-500">
            Kolor profilu
          </p>
          <div className="mt-2 grid grid-cols-4 gap-2">
            <ColorChip label="Grafit" colorClass="bg-neutral-900" active />
            <ColorChip label="Biały" colorClass="bg-white" />
            <ColorChip label="Brąz" colorClass="bg-stone-700" />
            <ColorChip label="RAL" colorClass="bg-neutral-200" />
          </div>
          <p className="mt-2 text-[11px] leading-4 text-neutral-500">
            Na teraz kolor jest informacyjny. Dopłaty RAL ustalimy po
            potwierdzeniu cennika.
          </p>
        </div>
      </CompactPanel>

      <CompactPanel title="Dach">
        <SelectField
          label="Pokrycie"
          value={configuration.roof}
          onChange={(value) =>
            updateConfiguration({ roof: value as RoofOption })
          }
          options={ROOF_OPTIONS.map((roof) => ({
            value: roof,
            label: ROOF_LABELS[roof],
          }))}
        />
      </CompactPanel>

      <CompactPanel title="Ściany">
        <div className="grid grid-cols-2 gap-2">
          {WALL_OPTIONS.map((walls) => (
            <SmallOption
              key={walls}
              label={getShortWallLabel(walls)}
              active={configuration.walls === walls}
              onClick={() => updateWalls(walls)}
            />
          ))}
        </div>
      </CompactPanel>

      <CompactPanel title="Osłony ZIP">
        <div className="grid grid-cols-3 gap-2">
          <SmallOption
            label="Lewa"
            active={configuration.hasLeftZip}
            disabled={!hasWalls}
            onClick={() =>
              updateConfiguration({ hasLeftZip: !configuration.hasLeftZip })
            }
          />
          <SmallOption
            label="Prawa"
            active={configuration.hasRightZip}
            disabled={!hasWalls}
            onClick={() =>
              updateConfiguration({ hasRightZip: !configuration.hasRightZip })
            }
          />
          <SmallOption
            label="Przód"
            active={configuration.hasFrontZip}
            disabled={!hasWalls}
            onClick={() =>
              updateConfiguration({ hasFrontZip: !configuration.hasFrontZip })
            }
          />
        </div>
      </CompactPanel>

      <CompactPanel title="Komfort">
        <div className="grid grid-cols-2 gap-2">
          <OptionToggle
            label="Markiza"
            checked={configuration.hasAwning}
            onChange={(checked) =>
              updateConfiguration({ hasAwning: checked })
            }
          />
          <OptionToggle
            label="LED punkt."
            checked={configuration.hasLed}
            onChange={updateSpotLed}
          />
          <OptionToggle
            label="LED taśma"
            checked={configuration.hasCob}
            onChange={updateStripLed}
          />
          <OptionToggle
            label="Uchwyty"
            checked={configuration.hasHandles}
            onChange={(checked) =>
              updateConfiguration({ hasHandles: checked })
            }
          />
          <OptionToggle
            label="Szczotki"
            checked={configuration.hasBrushes}
            onChange={(checked) =>
              updateConfiguration({ hasBrushes: checked })
            }
          />
          <OptionToggle
            label="Profil"
            checked={configuration.hasLevelingProfile}
            onChange={(checked) =>
              updateConfiguration({ hasLevelingProfile: checked })
            }
          />
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
    <section className="rounded-2xl border border-neutral-200 bg-white p-3">
      <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500">
        {title}
      </h4>
      <div className="mt-3">{children}</div>
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
      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-500">
        {label}
      </span>
      <select
        value={String(value)}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-xs font-black text-neutral-950 outline-none transition hover:bg-white focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
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

interface SmallOptionProps {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick(): void;
}

function SmallOption({
  label,
  active,
  disabled = false,
  onClick,
}: SmallOptionProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "min-h-12 rounded-xl border px-2 py-2 text-center text-[11px] font-black transition",
        active
          ? "border-emerald-500 bg-emerald-50 text-emerald-950"
          : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-white",
        disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

interface OptionToggleProps {
  label: string;
  checked: boolean;
  onChange(checked: boolean): void;
}

function OptionToggle({ label, checked, onChange }: OptionToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={[
        "flex min-h-12 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition",
        checked
          ? "border-emerald-500 bg-emerald-50"
          : "border-neutral-200 bg-neutral-50 hover:bg-white",
      ].join(" ")}
    >
      <span className="text-[11px] font-black leading-tight text-neutral-950">
        {label}
      </span>

      <span
        className={[
          "flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition",
          checked ? "bg-emerald-500" : "bg-neutral-300",
        ].join(" ")}
      >
        <span
          className={[
            "h-4 w-4 rounded-full bg-white shadow-sm transition",
            checked ? "translate-x-4" : "translate-x-0",
          ].join(" ")}
        />
      </span>
    </button>
  );
}

function ColorChip({
  label,
  colorClass,
  active = false,
}: {
  label: string;
  colorClass: string;
  active?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-xl border p-2 text-center",
        active ? "border-emerald-500 bg-emerald-50" : "border-neutral-200",
      ].join(" ")}
    >
      <div
        className={[
          "mx-auto h-5 w-5 rounded-full border border-neutral-300",
          colorClass,
        ].join(" ")}
      />
      <p className="mt-1 text-[9px] font-black text-neutral-600">{label}</p>
    </div>
  );
}

function getShortWallLabel(walls: WallOption): string {
  if (walls === "none") {
    return "Brak";
  }

  if (walls === "glass_clear") {
    return "Przezr.";
  }

  if (walls === "glass_milky") {
    return "Mleczne";
  }

  return "Przyciem.";
}