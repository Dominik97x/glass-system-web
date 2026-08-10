import type { ReactNode } from "react";

import { ROOF_LABELS } from "@/data/configuration-labels";
import {
  getProductKind,
  type Length,
  type ProductConfiguration,
  type ProductKind,
  type RoofOption,
  type WallOption,
  type Width,
} from "@/domain/ProductConfiguration";

interface Props {
  configuration: ProductConfiguration;
  onChange(configuration: ProductConfiguration): void;
}

const WIDTH_OPTIONS: Width[] = [
  306, 406, 506, 606, 706, 806, 906, 1006, 1106, 1206,
];
const LENGTH_OPTIONS: Length[] = [300, 350, 400, 450, 500, 550, 600];
const ALL_ROOF_OPTIONS: RoofOption[] = [
  "polycarbonate_clear",
  "polycarbonate_milky",
  "polycarbonate_grey",
  "polycarbonate_smoke",
  "glass_clear",
  "glass_tinted",
];
const WALL_OPTIONS: WallOption[] = ["glass_clear", "glass_tinted"];

export function ConfigurationForm({ configuration, onChange }: Props) {
  const productType = getProductKind(configuration);
  const hasWalls = configuration.walls !== "none";
  const roofGlassAvailable = configuration.length <= 500;
  const roofOptions = roofGlassAvailable
    ? ALL_ROOF_OPTIONS
    : ALL_ROOF_OPTIONS.filter((option) => !option.startsWith("glass_"));

  function updateConfiguration(partial: Partial<ProductConfiguration>) {
    const next = { ...configuration, ...partial };
    if (next.length >= 550 && next.roof.startsWith("glass_")) {
      next.roof = "polycarbonate_clear";
    }
    onChange(next);
  }

  function updateProductType(nextProductType: ProductKind) {
    if (nextProductType === "terrace_roof") {
      onChange({
        ...configuration,
        productType: nextProductType,
        walls: "none",
        hasLeftZip: false,
        hasRightZip: false,
      });
      return;
    }

    onChange({
      ...configuration,
      productType: nextProductType,
      walls:
        configuration.walls === "none"
          ? "glass_clear"
          : configuration.walls,
    });
  }

  function updateWalls(walls: WallOption) {
    onChange({
      ...configuration,
      walls,
      hasFrontZip: configuration.hasFrontZip,
      hasLeftZip: configuration.hasLeftZip,
      hasRightZip: configuration.hasRightZip,
    });
  }

  function updateSpotLed(checked: boolean) {
    onChange({ ...configuration, hasLed: checked, hasCob: checked ? false : configuration.hasCob });
  }

  function updateCctLed(checked: boolean) {
    onChange({ ...configuration, hasCob: checked, hasLed: checked ? false : configuration.hasLed });
  }

  return (
    <div className="space-y-3 text-sm">
      <CompactPanel title="Konstrukcja">
        <div className="mb-3 grid grid-cols-2 gap-2">
          <SmallOption
            label="Zadaszenie tarasu"
            active={productType === "terrace_roof"}
            onClick={() => updateProductType("terrace_roof")}
          />
          <SmallOption
            label="Ogród zimowy"
            active={productType === "winter_garden"}
            onClick={() => updateProductType("winter_garden")}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <SelectField
            label="Szerokość"
            value={configuration.width}
            onChange={(value) => updateConfiguration({ width: Number(value) as Width })}
            options={WIDTH_OPTIONS.map((value) => ({ value: String(value), label: `${value} cm` }))}
          />
          <SelectField
            label="Długość"
            value={configuration.length}
            onChange={(value) => updateConfiguration({ length: Number(value) as Length })}
            options={LENGTH_OPTIONS.map((value) => ({ value: String(value), label: `${value} cm` }))}
          />
        </div>
      </CompactPanel>

      <CompactPanel title="Dach">
        <SelectField
          label="Pokrycie"
          value={configuration.roof}
          onChange={(value) => updateConfiguration({ roof: value as RoofOption })}
          options={roofOptions.map((roof) => ({ value: roof, label: ROOF_LABELS[roof] }))}
        />
        {!roofGlassAvailable && (
          <p className="mt-2 text-[11px] leading-4 text-amber-700">
            Dla długości 550 i 600 cm dach szklany wymaga wyceny indywidualnej.
          </p>
        )}
      </CompactPanel>

      {productType === "winter_garden" && (
        <CompactPanel title="Ściany">
          <div className="grid grid-cols-2 gap-2">
            {WALL_OPTIONS.map((walls) => (
              <SmallOption
                key={walls}
                label={walls === "glass_clear" ? "Przezr." : "Przyciem."}
                active={configuration.walls === walls}
                onClick={() => updateWalls(walls)}
              />
            ))}
          </div>
        </CompactPanel>
      )}

      <CompactPanel title="Osłony ZIP">
        <div className="grid grid-cols-3 gap-2">
          <SmallOption label="Przód" active={configuration.hasFrontZip}
            onClick={() => updateConfiguration({ hasFrontZip: !configuration.hasFrontZip })} />
          <SmallOption label="Lewa" active={configuration.hasLeftZip} disabled={!hasWalls}
            onClick={() => updateConfiguration({ hasLeftZip: !configuration.hasLeftZip })} />
          <SmallOption label="Prawa" active={configuration.hasRightZip} disabled={!hasWalls}
            onClick={() => updateConfiguration({ hasRightZip: !configuration.hasRightZip })} />
        </div>
        {!hasWalls && (
          <p className="mt-2 text-[11px] leading-4 text-neutral-500">
            Bez ścian dostępna jest roleta ZIP z przodu. Rolety boczne wymagają ścian.
          </p>
        )}
      </CompactPanel>

      <CompactPanel title="Komfort">
        <div className="grid grid-cols-2 gap-2">
          <OptionToggle label="Markiza" checked={configuration.hasAwning}
            onChange={(checked) => updateConfiguration({ hasAwning: checked })} />
          <OptionToggle label="LED punkt." checked={configuration.hasLed} onChange={updateSpotLed} />
          <OptionToggle label="LED RGB CCT" checked={configuration.hasCob} onChange={updateCctLed} />
          <OptionToggle label="Uchwyty" checked={configuration.hasHandles}
            onChange={(checked) => updateConfiguration({ hasHandles: checked })} />
          <OptionToggle label="Szczotki" checked={configuration.hasBrushes}
            onChange={(checked) => updateConfiguration({ hasBrushes: checked })} />
          <OptionToggle label="Fundament / profil" checked={configuration.hasLevelingProfile}
            onChange={(checked) => updateConfiguration({ hasLevelingProfile: checked })} />
        </div>
      </CompactPanel>
    </div>
  );
}

function CompactPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-3">
      <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500">{title}</h4>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function SelectField({ label, value, options, onChange }: {
  label: string;
  value: string | number;
  options: Array<{ value: string; label: string }>;
  onChange(value: string): void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-500">{label}</span>
      <select value={String(value)} onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 text-xs font-black text-neutral-950 outline-none">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function SmallOption({ label, active, disabled = false, onClick }: {
  label: string; active: boolean; disabled?: boolean; onClick(): void;
}) {
  return (
    <button type="button" disabled={disabled} onClick={onClick}
      className={[
        "min-h-12 rounded-xl border px-2 py-2 text-center text-[11px] font-black transition",
        active ? "border-emerald-500 bg-emerald-50 text-emerald-950" : "border-neutral-200 bg-neutral-50 text-neutral-700",
        disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
      ].join(" ")}>
      {label}
    </button>
  );
}

function OptionToggle({ label, checked, onChange }: {
  label: string; checked: boolean; onChange(checked: boolean): void;
}) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={[
        "flex min-h-12 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition",
        checked ? "border-emerald-500 bg-emerald-50" : "border-neutral-200 bg-neutral-50",
      ].join(" ")}>
      <span className="text-[11px] font-black leading-tight text-neutral-950">{label}</span>
      <span className={["flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition",
        checked ? "bg-emerald-500" : "bg-neutral-300"].join(" ")}>
        <span className={["h-4 w-4 rounded-full bg-white shadow-sm transition",
          checked ? "translate-x-4" : "translate-x-0"].join(" ")} />
      </span>
    </button>
  );
}
