import {
  getProductKind,
  type ProductConfiguration,
} from "@/domain/ProductConfiguration";
import {
  ROOF_LABELS,
  WALL_LABELS,
} from "@/data/configuration-labels";

interface Props {
  configuration: ProductConfiguration;
}

function getRoofSurfaceClass(configuration: ProductConfiguration): string {
  if (configuration.roof.startsWith("glass")) {
    return "bg-sky-100/45";
  }

  if (configuration.roof === "polycarbonate_grey") {
    return "bg-slate-300/55";
  }

  if (configuration.roof === "polycarbonate_smoke") {
    return "bg-neutral-400/55";
  }

  if (configuration.roof === "polycarbonate_milky") {
    return "bg-white/65";
  }

  return "bg-cyan-100/45";
}

function getWallSurfaceClass(configuration: ProductConfiguration): string {
  if (configuration.walls === "glass_tinted") {
    return "bg-neutral-900/30";
  }

  if (configuration.walls === "glass_milky") {
    return "bg-white/55";
  }

  return "bg-cyan-100/28";
}

function getProductLabel(configuration: ProductConfiguration): string {
  return getProductKind(configuration) === "terrace_roof"
    ? "Zadaszenie tarasu"
    : "Ogród zimowy";
}

export function VisualizationPanel({ configuration }: Props) {
  const productKind = getProductKind(configuration);
  const hasWalls = configuration.walls !== "none";


  const hasLighting = configuration.hasLed || configuration.hasCob;

  const widthProgress = (configuration.width - 306) / (1206 - 306);
  const lengthProgress = (configuration.length - 300) / (500 - 300);

  const visualWidth = Math.round(64 + widthProgress * 24);
  const visualHeight = Math.round(48 + lengthProgress * 18);

  const activeFeatures = [
    hasWalls ? "Ściany szklane" : "Otwarta konstrukcja",
    configuration.hasFrontZip ? "ZIP przód" : null,
    configuration.hasLeftZip ? "ZIP lewy" : null,
    configuration.hasRightZip ? "ZIP prawy" : null,
    configuration.hasAwning ? "Markiza" : null,
    configuration.hasLed ? "LED punktowe" : null,
    configuration.hasCob ? "LED taśma" : null,
  ].filter(Boolean);

  return (
    <div className="h-full">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
            Wizualizacja
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
            Podgląd konfiguracji
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-600">
            Schemat pokazuje wybrany typ konstrukcji, ściany, dach, rolety ZIP,
            markizę i oświetlenie.
          </p>
        </div>

        <div className="rounded-2xl bg-neutral-950 px-4 py-3 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
            {getProductLabel(configuration)}
          </p>
          <p className="mt-1 text-sm text-white/70">
            {configuration.length} x {configuration.width} cm
          </p>
        </div>
      </div>

      <div className="relative min-h-[470px] overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-[#e9e2d7] shadow-inner">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(16,185,129,0.20),transparent_28%),linear-gradient(180deg,#f7f2e9_0%,#efe7db_50%,#d9d1c5_100%)]" />

        <div className="absolute left-0 right-0 top-0 h-[42%] bg-[linear-gradient(90deg,rgba(255,255,255,0.94),rgba(255,255,255,0.68)),linear-gradient(90deg,rgba(15,23,42,0.08)_1px,transparent_1px)] bg-[size:auto,84px_84px]" />

        <div className="absolute left-[8%] top-[14%] h-20 w-28 rounded-full bg-emerald-900/10 blur-2xl" />
        <div className="absolute right-[9%] top-[17%] h-16 w-16 rounded-full bg-amber-300/50 blur-xl" />

        <div className="absolute bottom-0 left-0 right-0 h-[42%] bg-[linear-gradient(160deg,#b7aa98_0%,#d9d1c5_42%,#a89d90_100%)]" />

        <div className="absolute bottom-[11%] left-[6%] right-[6%] h-[20%] rounded-[40%] bg-black/10 blur-2xl" />

        <div className="absolute bottom-[17%] left-1/2 h-[14%] w-[82%] -translate-x-1/2 skew-x-[-12deg] rounded-sm bg-neutral-300 shadow-2xl ring-1 ring-black/10" />

        <div
          className="absolute bottom-[24%] left-1/2 -translate-x-1/2"
          style={{
            width: `${visualWidth}%`,
            height: `${visualHeight}%`,
          }}
        >
          <div className="absolute -top-[20%] left-[4%] right-[4%] h-[24%] -skew-x-12 border border-neutral-800/70 bg-neutral-950/90 shadow-2xl">
            <div
              className={`absolute inset-[8px] border border-white/30 ${getRoofSurfaceClass(
                configuration
              )} backdrop-blur-[1px]`}
            />

            {configuration.hasAwning ? (
              <div className="absolute -top-5 left-4 right-4 h-5 bg-emerald-700/90 shadow-lg">
                <div className="h-full bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.20)_0_8px,transparent_8px_16px)]" />
              </div>
            ) : null}

            {hasLighting ? (
              <div className="absolute bottom-3 left-8 right-8 h-1 rounded-full bg-amber-300 shadow-[0_0_24px_rgba(252,211,77,0.95)]" />
            ) : null}
          </div>

          <div className="absolute inset-x-0 bottom-0 h-full border-[10px] border-neutral-950 bg-neutral-950 shadow-2xl">
            <div className="absolute inset-[10px] overflow-hidden bg-[linear-gradient(135deg,rgba(15,23,42,0.72),rgba(15,23,42,0.26)),linear-gradient(120deg,rgba(255,255,255,0.18),transparent_28%,rgba(255,255,255,0.12)_58%,transparent)]">
              {hasWalls ? (
                <div
                  className={`absolute inset-0 ${getWallSurfaceClass(
                    configuration
                  )} backdrop-blur-[1px]`}
                />
              ) : (
                <div className="absolute inset-0 bg-black/8" />
              )}

              <div className="absolute bottom-0 left-0 top-0 w-[2px] bg-white/28" />
              <div className="absolute bottom-0 left-1/4 top-0 w-[2px] bg-white/28" />
              <div className="absolute bottom-0 left-1/2 top-0 w-[2px] bg-white/28" />
              <div className="absolute bottom-0 left-3/4 top-0 w-[2px] bg-white/28" />
              <div className="absolute bottom-0 right-0 top-0 w-[2px] bg-white/28" />

              <div className="absolute left-[8%] top-[14%] h-[1px] w-[28%] rotate-[-18deg] bg-white/50" />
              <div className="absolute right-[12%] top-[22%] h-[1px] w-[32%] rotate-[-18deg] bg-white/40" />
              <div className="absolute bottom-[16%] left-[16%] h-[1px] w-[40%] rotate-[-18deg] bg-white/28" />

              {configuration.hasFrontZip && hasWalls ? (
                <div className="absolute inset-x-[9%] top-0 h-full bg-neutral-950/40 backdrop-blur-[1px]">
                  <div className="h-full bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.12)_0_1px,transparent_1px_9px)]" />
                </div>
              ) : null}

              {configuration.hasLeftZip && hasWalls ? (
                <div className="absolute bottom-0 left-0 top-0 w-[16%] bg-neutral-950/45 backdrop-blur-[1px]" />
              ) : null}

              {configuration.hasRightZip && hasWalls ? (
                <div className="absolute bottom-0 right-0 top-0 w-[16%] bg-neutral-950/45 backdrop-blur-[1px]" />
              ) : null}

              {configuration.hasLed ? (
                <div className="absolute left-[12%] right-[12%] top-[12%] flex justify-between">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <span
                      key={index}
                      className="h-2 w-2 rounded-full bg-amber-200 shadow-[0_0_18px_rgba(252,211,77,0.9)]"
                    />
                  ))}
                </div>
              ) : null}

              {configuration.hasCob ? (
                <div className="absolute bottom-[12%] left-[10%] right-[10%] h-1 rounded-full bg-amber-300 shadow-[0_0_24px_rgba(252,211,77,0.9)]" />
              ) : null}
            </div>

            <div className="absolute -bottom-4 left-0 right-0 h-4 bg-neutral-900" />
          </div>

          {productKind === "terrace_roof" ? (
            <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-4 py-2 text-xs font-bold text-neutral-700 shadow-lg">
              Konstrukcja otwarta
            </div>
          ) : (
            <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-4 py-2 text-xs font-bold text-neutral-700 shadow-lg">
              Zabudowa ze ścianami
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">
            Dach
          </p>
          <p className="mt-2 text-sm font-bold text-neutral-950">
            {ROOF_LABELS[configuration.roof]}
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">
            Ściany
          </p>
          <p className="mt-2 text-sm font-bold text-neutral-950">
            {WALL_LABELS[configuration.walls]}
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">
            Dodatki
          </p>
          <p className="mt-2 text-sm font-bold text-neutral-950">
            {activeFeatures.length > 0
              ? activeFeatures.slice(1).join(", ")
              : "Brak dodatków"}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-950 ring-1 ring-emerald-100">
        To jest poglądowa wizualizacja konfiguracji. Finalny wygląd konstrukcji
        zależy od pomiaru, koloru profili, rodzaju szkła i warunków montażu.
      </div>
    </div>
  );
}