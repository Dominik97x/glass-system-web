import Image from "next/image";

import { ROOF_LABELS, WALL_LABELS } from "@/data/configuration-labels";
import {
  getFrameColorLabel,
  getProductKind,
  type ProductConfiguration,
} from "@/domain/ProductConfiguration";
import { resolveVisualizerScene } from "./visualizer/visualizer-asset-resolver";
import { createVisualizerState } from "./visualizer/visualizer-state";

interface Props {
  configuration: ProductConfiguration;
}

export function VisualizationPanel({ configuration }: Props) {
  const visualizerState = createVisualizerState(configuration);
  const resolvedScene = resolveVisualizerScene(visualizerState);
  const activeAsset = resolvedScene.primaryAsset;
  const frameColor = getFrameColorLabel(visualizerState.frameColor);
  const productKind = getProductKind(configuration);
  const productLabel =
    productKind === "winter_garden" ? "Ogród zimowy" : "Zadaszenie tarasu";
  const selectedExtras = getSelectedExtras(configuration);

  return (
    <section className="min-w-0 bg-[#eee7dc] p-3 sm:p-4">
      <div className="flex h-full min-h-[650px] flex-col border border-[#d5ccbc] bg-[#fffdf8] p-3 sm:p-4">
        <div className="flex flex-col gap-4 border-b border-[#ded7ca] px-1 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#9a722e]">
              Przykładowy podgląd
            </p>
            <h2 className="mt-2 font-serif text-2xl font-medium tracking-tight text-[#062c25]">
              Przykładowa konstrukcja
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#202421]/58">
              Pokazujemy zdjęcie najbardziej zbliżonego wariantu. Nie wszystkie
              wybrane dodatki, kolory i proporcje muszą być widoczne na obrazie.
            </p>
          </div>

          <div className="shrink-0 border border-[#d7c9ab] bg-[#f4ead5] px-4 py-3">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9a722e]">
              {productLabel}
            </p>
            <p className="mt-1 text-sm font-bold text-[#062c25]">
              {configuration.length} × {configuration.width} cm
            </p>
          </div>
        </div>

        <div className="relative mt-4 min-h-[460px] flex-1 overflow-hidden bg-[#031d18] lg:min-h-[540px]">
          <Image
            src={activeAsset.src}
            alt={`${activeAsset.label} — przykładowy podgląd MoonGlass`}
            fill
            loading="eager"
            sizes="(min-width: 1280px) 55vw, 100vw"
            className="object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#031d18]/80 via-transparent to-[#031d18]/10" />

          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <VisualBadge label={productLabel} />
            <VisualBadge label={frameColor} />
            <VisualBadge label={ROOF_LABELS[configuration.roof]} />
          </div>

          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
            <div className="max-w-2xl border-l-2 border-[#c79a46] bg-[#031d18]/72 px-4 py-3 text-[#f6f1e7] backdrop-blur-sm">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#dfbd78]">
                Zdjęcie poglądowe
              </p>
              <p className="mt-2 font-serif text-2xl font-medium">
                {activeAsset.label}
              </p>
              <p className="mt-2 text-xs leading-5 text-[#f6f1e7]/65 sm:text-sm">
                Finalny wygląd konstrukcji zostanie dopasowany do budynku,
                wymiarów i warunków montażu.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <InfoCard label="Kolor" value={frameColor} />
          <InfoCard label="Dach" value={ROOF_LABELS[configuration.roof]} />
          <InfoCard label="Ściany" value={WALL_LABELS[configuration.walls]} />
          <InfoCard
            label="Dodatki"
            value={
              selectedExtras.length > 0 ? selectedExtras.join(", ") : "Brak"
            }
          />
        </div>

        <div className="mt-3 border border-[#d7c9ab] bg-[#f4ead5]/60 px-4 py-3">
          <p className="text-[11px] leading-5 text-[#4f584f]">
            Podgląd ma charakter wyłącznie poglądowy i nie stanowi wizualizacji
            technicznej ani elementu wiążącej oferty handlowej.
          </p>
        </div>
      </div>
    </section>
  );
}

function VisualBadge({ label }: { label: string }) {
  return (
    <span className="border border-[#f6f1e7]/20 bg-[#031d18]/72 px-3 py-2 text-[10px] font-black uppercase tracking-[0.08em] text-[#f6f1e7] backdrop-blur-sm">
      {label}
    </span>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#ded7ca] bg-[#f8f4ec] px-4 py-3">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#8d7141]">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold leading-5 text-[#24312d]">
        {value}
      </p>
    </div>
  );
}

function getSelectedExtras(configuration: ProductConfiguration): string[] {
  const extras: string[] = [];

  if (configuration.hasFrontZip) extras.push("ZIP przód");
  if (configuration.hasLeftZip) extras.push("ZIP lewa");
  if (configuration.hasRightZip) extras.push("ZIP prawa");
  if (configuration.hasAwning) extras.push("markiza");
  if (configuration.hasLed) extras.push("LED punktowe");
  if (configuration.hasCob) extras.push("LED CCT");
  if (configuration.hasHandles) extras.push("uchwyty");
  if (configuration.hasBrushes) extras.push("szczotki");
  if (configuration.hasLevelingProfile) extras.push("profil");

  return extras;
}
