import Image from "next/image";

import { ROOF_LABELS, WALL_LABELS } from "@/data/configuration-labels";
import {
  getFrameColor,
  getFrameColorLabel,
  type ProductConfiguration,
} from "@/domain/ProductConfiguration";
import {
  getVisualizerAsset,
  getVisualizerAssetByKey,
  VISUALIZER_TILES,
  type VisualizerTileId,
} from "./visualizer/visualizer-assets";

interface Props {
  configuration: ProductConfiguration;
}

export function VisualizationPanel({ configuration }: Props) {
  const hasWalls = configuration.walls !== "none";
  const frameColor = getFrameColor(configuration);
  const hasAnyZip =
    configuration.hasFrontZip ||
    configuration.hasLeftZip ||
    configuration.hasRightZip;
  const hasLight = configuration.hasLed || configuration.hasCob;
  const selectedExtras = getSelectedExtras(configuration);
  const activeAsset = getVisualizerAsset(configuration);
  const isEveningView = activeAsset.mode === "evening";

  return (
    <section className="min-w-0 bg-neutral-100 p-3 lg:p-4">
      <div className="flex h-full min-h-[720px] flex-col rounded-[1.5rem] border border-neutral-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 px-1 pb-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-700">
              Wizualizacja
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950">
              Podgląd konfiguracji
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-600">
              Duży podgląd pokazuje orientacyjny wygląd konstrukcji. Finalne
              warianty obrazu przygotujemy jako osobne rendery.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-2xl bg-neutral-950 px-4 py-3 text-white">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-300">
                {hasWalls ? "Ogród zimowy" : "Zadaszenie"}
              </p>
              <p className="mt-1 text-sm text-neutral-200">
                {configuration.length} x {configuration.width} cm
              </p>
            </div>

            <div className="hidden rounded-2xl border border-neutral-200 bg-neutral-50 p-1 sm:flex">
              <span
                className={[
                  "rounded-xl px-3 py-2 text-xs font-black",
                  isEveningView
                    ? "text-neutral-500"
                    : "bg-white text-neutral-950 shadow-sm",
                ].join(" ")}
              >
                Dzień
              </span>
              <span
                className={[
                  "rounded-xl px-3 py-2 text-xs font-black",
                  isEveningView
                    ? "bg-neutral-950 text-white shadow-sm"
                    : "text-neutral-500",
                ].join(" ")}
              >
                Wieczór
              </span>
            </div>
          </div>
        </div>

        <div className="relative flex-1 overflow-hidden rounded-[1.35rem] border border-neutral-200 bg-neutral-900">
          <Image
            src={activeAsset.src}
            alt={`${activeAsset.label} - poglądowa wizualizacja Glass System`}
            fill
            priority
            sizes="(min-width: 1280px) 60vw, 100vw"
            className="object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/58 via-black/6 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/18 via-transparent to-black/10" />

          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <VisualBadge label={hasWalls ? "Ogród zimowy" : "Zadaszenie"} />
            <VisualBadge label={getFrameColorLabel(frameColor)} />
            <VisualBadge label={ROOF_LABELS[configuration.roof]} />
            {hasAnyZip && <VisualBadge label="Rolety ZIP" />}
            {configuration.hasAwning && <VisualBadge label="Markiza" />}
            {hasLight && (
              <VisualBadge
                label={configuration.hasLed ? "LED punktowe" : "LED CCT"}
              />
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="max-w-xl rounded-2xl border border-white/15 bg-black/50 p-4 text-white backdrop-blur">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
                Wybrana konfiguracja
              </p>
              <p className="mt-2 text-2xl font-semibold leading-tight">
                {activeAsset.label}
              </p>
              <p className="mt-2 text-sm leading-6 text-white/75">
                {getFrameColorLabel(frameColor)} ·{" "}
                {ROOF_LABELS[configuration.roof]} ·{" "}
                {WALL_LABELS[configuration.walls]} ·{" "}
                {selectedExtras.length > 0
                  ? selectedExtras.join(", ")
                  : "bez dodatków"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 lg:grid-cols-6">
          {VISUALIZER_TILES.map((tile) => {
            const tileAsset = getVisualizerAssetByKey(tile.assetKey);

            return (
              <VariantTile
                key={tile.id}
                label={tile.label}
                active={isTileActive(tile.id, configuration)}
                image={tileAsset.thumbnailSrc}
              />
            );
          })}
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-4">
          <InfoCard label="Kolor" value={getFrameColorLabel(frameColor)} />
          <InfoCard label="Dach" value={ROOF_LABELS[configuration.roof]} />
          <InfoCard label="Ściany" value={WALL_LABELS[configuration.walls]} />
          <InfoCard
            label="Dodatki"
            value={
              selectedExtras.length > 0 ? selectedExtras.join(", ") : "Brak"
            }
          />
        </div>
      </div>
    </section>
  );
}

function VisualBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/20 bg-black/50 px-3 py-2 text-xs font-black text-white shadow-lg backdrop-blur">
      {label}
    </span>
  );
}

function VariantTile({
  label,
  active,
  image,
}: {
  label: string;
  active: boolean;
  image: string;
}) {
  return (
    <div
      className={[
        "relative h-20 overflow-hidden rounded-xl border",
        active ? "border-emerald-400" : "border-neutral-300",
      ].join(" ")}
    >
      <Image
        src={image}
        alt=""
        fill
        sizes="160px"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/35" />
      <div
        className={[
          "absolute inset-x-1 bottom-1 rounded-lg px-2 py-1 text-center text-[10px] font-black",
          active
            ? "bg-emerald-400 text-neutral-950"
            : "bg-black/55 text-white",
        ].join(" ")}
      >
        {label}
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold leading-5 text-neutral-950">
        {value}
      </p>
    </div>
  );
}

function isTileActive(
  tileId: VisualizerTileId,
  configuration: ProductConfiguration
): boolean {
  const hasWalls = configuration.walls !== "none";
  const hasAnyZip =
    configuration.hasFrontZip ||
    configuration.hasLeftZip ||
    configuration.hasRightZip;

  switch (tileId) {
    case "terrace_roof":
      return !hasWalls;
    case "glass_clear":
      return configuration.walls === "glass_clear";
    case "glass_milky":
      return configuration.walls === "glass_milky";
    case "zip":
      return hasAnyZip;
    case "awning":
      return configuration.hasAwning;
    case "lighting":
      return configuration.hasLed || configuration.hasCob;
  }
}

function getSelectedExtras(configuration: ProductConfiguration): string[] {
  const extras: string[] = [];

  if (configuration.hasFrontZip) {
    extras.push("ZIP przód");
  }

  if (configuration.hasLeftZip) {
    extras.push("ZIP lewa");
  }

  if (configuration.hasRightZip) {
    extras.push("ZIP prawa");
  }

  if (configuration.hasAwning) {
    extras.push("markiza");
  }

  if (configuration.hasLed) {
    extras.push("LED punktowe");
  }

  if (configuration.hasCob) {
    extras.push("LED CCT");
  }

  if (configuration.hasHandles) {
    extras.push("uchwyty");
  }

  if (configuration.hasBrushes) {
    extras.push("szczotki");
  }

  if (configuration.hasLevelingProfile) {
    extras.push("profil");
  }

  return extras;
}