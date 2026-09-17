"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { ROOF_LABELS } from "@/data/configuration-labels";
import {
  getFrameColor,
  getProductKind,
  type ProductConfiguration,
} from "@/domain/ProductConfiguration";

interface Props {
  configuration: ProductConfiguration;
}

const PREVIEW_IMAGES = {
  winter_garden: {
    anthracite: "/images/glass-system/wycena/ogrod-zimowy-antracyt.png",
    white: "/images/glass-system/wycena/ogrod-zimowy-bialy.png",
    brown: "/images/glass-system/wycena/ogrod-zimowy-brazowy.png",
  },
  terrace_roof: {
    anthracite: "/images/glass-system/wycena/zadaszenie-tarasu-antracyt.png",
    white: "/images/glass-system/wycena/zadaszenie-tarasu-bialy.png",
    brown: "/images/glass-system/wycena/zadaszenie-tarasu-brazowy.png",
  },
} as const;


const FRAME_COLOR_LABELS = {
  anthracite: "Antracyt",
  white: "Biały",
  brown: "Brązowy",
} as const;

export function VisualizationPanel({ configuration }: Props) {
  const productKind = getProductKind(configuration);
  const frameColorKey = getFrameColor(configuration);
  const frameColor = FRAME_COLOR_LABELS[frameColorKey];
  const productLabel =
    productKind === "winter_garden" ? "Ogród zimowy" : "Zadaszenie tarasu";
  const previewImage = PREVIEW_IMAGES[productKind][frameColorKey];
  const previewLabel = `${productLabel} — ${frameColor}`;
  const [displayedImage, setDisplayedImage] = useState(previewImage);
  const [incomingImage, setIncomingImage] = useState<string | null>(null);
  const [incomingVisible, setIncomingVisible] = useState(false);

  useEffect(() => {
    if (previewImage === displayedImage) {
      return;
    }

    setIncomingVisible(false);
    setIncomingImage(previewImage);
  }, [previewImage, displayedImage]);

  useEffect(() => {
    if (!incomingImage || !incomingVisible) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDisplayedImage(incomingImage);
      setIncomingImage(null);
      setIncomingVisible(false);
    }, 420);

    return () => window.clearTimeout(timeoutId);
  }, [incomingImage, incomingVisible]);

  return (
    <section className="min-w-0 bg-[#eee7dc] p-2 sm:p-2.5">
      <div className="flex h-full min-h-0 flex-col border border-[#d5ccbc] bg-[#fffdf8] p-2 sm:p-2.5">
        <div className="flex flex-col gap-2 border-b border-[#ded7ca] px-1 pb-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#9a722e]">
              Przykładowy podgląd
            </p>
            <h2 className="mt-1 font-serif text-xl font-medium tracking-tight text-[#062c25] sm:text-[22px]">
              Przykładowa konstrukcja
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-4 text-[#202421]/58 sm:text-[13px]">
              Pokazujemy zdjęcie najbardziej zbliżonego wariantu. Nie wszystkie
              wybrane dodatki, kolory i proporcje muszą być widoczne na obrazie.
            </p>
          </div>

          <div className="shrink-0 border border-[#d7c9ab] bg-[#f4ead5] px-3 py-1.5">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9a722e]">
              {productLabel}
            </p>
            <p className="mt-1 text-sm font-bold text-[#062c25]">
              {configuration.length} × {configuration.width} cm
            </p>
          </div>
        </div>

        <div className="mt-2 flex min-h-0 flex-1 items-start justify-center overflow-hidden bg-[#fffdf8] xl:h-[clamp(500px,60vh,555px)]">
          <div className="relative aspect-[4/3] h-auto w-full max-w-full xl:h-full xl:w-auto">
            <Image
              src={displayedImage}
              alt={`${previewLabel} — przykładowy podgląd MoonGlass`}
              fill
              priority
              sizes="(min-width: 1280px) 48vw, 100vw"
              className="object-cover"
            />

            {incomingImage ? (
              <Image
                key={incomingImage}
                src={incomingImage}
                alt={`${previewLabel} — przykładowy podgląd MoonGlass`}
                fill
                sizes="(min-width: 1280px) 48vw, 100vw"
                className={[
                  "object-cover transition-opacity duration-[420ms] ease-in-out",
                  incomingVisible ? "opacity-100" : "opacity-0",
                ].join(" ")}
                onLoad={() => {
                  requestAnimationFrame(() => setIncomingVisible(true));
                }}
              />
            ) : null}

            <div className="absolute inset-0 bg-gradient-to-t from-[#031d18]/78 via-transparent to-[#031d18]/8" />

            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5 sm:left-4 sm:top-4">
              <VisualBadge label={productLabel} />
              <VisualBadge label={frameColor} />
              <VisualBadge label={ROOF_LABELS[configuration.roof]} />
            </div>

            <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
              <div className="max-w-xl border-l-2 border-[#c79a46] bg-[#031d18]/74 px-3 py-2.5 text-[#f6f1e7] backdrop-blur-sm">
                <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#dfbd78] sm:text-[9px]">
                  Zdjęcie poglądowe
                </p>
                <p className="mt-1 font-serif text-xl font-medium sm:text-2xl">
                  {previewLabel}
                </p>
                <p className="mt-1 text-[11px] leading-4 text-[#f6f1e7]/65 sm:text-xs sm:leading-5">
                  Finalny wygląd konstrukcji zostanie dopasowany do budynku,
                  wymiarów i warunków montażu.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-1 px-1 text-[9px] leading-3.5 text-[#68706c]">
          Zdjęcie ma charakter poglądowy. Szczegóły techniczne i finalny wygląd
          są potwierdzane przed realizacją.
        </p>
      </div>
    </section>
  );
}

function VisualBadge({ label }: { label: string }) {
  return (
    <span className="border border-[#f6f1e7]/20 bg-[#031d18]/72 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-[#f6f1e7] backdrop-blur-sm">
      {label}
    </span>
  );
}
