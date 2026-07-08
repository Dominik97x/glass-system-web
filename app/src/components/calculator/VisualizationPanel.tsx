import type { CSSProperties } from "react";

import { ROOF_LABELS, WALL_LABELS } from "@/data/configuration-labels";
import {
  type ProductConfiguration,
  type RoofOption,
} from "@/domain/ProductConfiguration";

interface Props {
  configuration: ProductConfiguration;
}

export function VisualizationPanel({ configuration }: Props) {
  const hasWalls = configuration.walls !== "none";

  const selectedExtras = getSelectedExtras(configuration);

  return (
    <section className="rounded-[2rem] border border-neutral-200 bg-neutral-50 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
            Wizualizacja 3D
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
            Podgląd konfiguracji
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-600">
            Model pokazuje orientacyjny wygląd konstrukcji: dach, ściany,
            rolety ZIP, markizę i oświetlenie.
          </p>
        </div>

        <div className="hidden rounded-2xl bg-neutral-950 px-5 py-4 text-white sm:block">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
            {hasWalls ? "Ogród zimowy" : "Zadaszenie tarasu"}
          </p>
          <p className="mt-1 text-sm text-neutral-200">
            {configuration.length} x {configuration.width} cm
          </p>
        </div>
      </div>

      <Product3DPreview configuration={configuration} />

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <InfoCard label="Dach" value={ROOF_LABELS[configuration.roof]} />
        <InfoCard label="Ściany" value={WALL_LABELS[configuration.walls]} />
        <InfoCard
          label="Dodatki"
          value={selectedExtras.length > 0 ? selectedExtras.join(", ") : "Brak"}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-6 text-emerald-950">
        Wizualizacja jest poglądowa. Finalny wygląd zależy od pomiaru, koloru
        profili, rodzaju szkła, montażu i warunków na miejscu.
      </div>
    </section>
  );
}

function Product3DPreview({
  configuration,
}: {
  configuration: ProductConfiguration;
}) {
  const hasWalls = configuration.walls !== "none";
  const hasAnyZip =
    hasWalls &&
    (configuration.hasFrontZip ||
      configuration.hasLeftZip ||
      configuration.hasRightZip);

  const widthProgress = normalize(
    configuration.width,
    306,
    1206
  );
  const lengthProgress = normalize(
    configuration.length,
    300,
    500
  );

  const frontWidth = 360 + widthProgress * 135;
  const frontHeight = 178 + lengthProgress * 26;
  const frontX = 400 - frontWidth / 2;
  const frontY = 216 - lengthProgress * 12;
  const frontRight = frontX + frontWidth;
  const frontBottom = frontY + frontHeight;

  const sideOffset = 68 + lengthProgress * 34;
  const sideLift = 44 + lengthProgress * 16;

  const roofFrontY = frontY - 38;
  const roofBackY = roofFrontY - sideLift;
  const roofOverhang = 30;

  const roofFill = getRoofFill(configuration.roof);
  const roofOpacity = getRoofOpacity(configuration.roof);

  const label = hasWalls ? "Zabudowa ze ścianami" : "Konstrukcja otwarta";

  const modelStyle: CSSProperties = {
    filter: "drop-shadow(0 34px 34px rgba(15, 23, 42, 0.22))",
  };

  return (
    <div className="mt-6 overflow-hidden rounded-[2rem] border border-neutral-200 bg-white">
      <svg
        viewBox="0 0 800 520"
        role="img"
        aria-label="Podgląd konfiguracji produktu"
        className="h-auto w-full"
        style={modelStyle}
      >
        <defs>
          <linearGradient id="sceneSky" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#f9fafb" />
            <stop offset="48%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#fff7df" />
          </linearGradient>

          <linearGradient id="terraceFloor" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#f4f1ea" />
            <stop offset="100%" stopColor="#b9afa0" />
          </linearGradient>

          <linearGradient id="glassFront" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#78909c" stopOpacity="0.58" />
            <stop offset="48%" stopColor="#31444b" stopOpacity="0.68" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.72" />
          </linearGradient>

          <linearGradient id="glassSide" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#90a4ae" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.48" />
          </linearGradient>

          <linearGradient id="profileGradient" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#2b2b2b" />
            <stop offset="100%" stopColor="#020202" />
          </linearGradient>

          <radialGradient id="warmLight">
            <stop offset="0%" stopColor="#ffe08a" stopOpacity="1" />
            <stop offset="55%" stopColor="#ffd54f" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ffd54f" stopOpacity="0" />
          </radialGradient>

          <filter id="softBlur">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>

        <rect width="800" height="520" fill="url(#sceneSky)" />

        <g opacity="0.38">
          {Array.from({ length: 11 }).map((_, index) => (
            <line
              key={`wall-grid-${index}`}
              x1={90 + index * 62}
              x2={90 + index * 62}
              y1="40"
              y2="372"
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}
        </g>

        <rect y="300" width="800" height="220" fill="#ede7db" />
        <rect y="365" width="800" height="155" fill="#d8cfc0" />

        <polygon
          points={`${frontX - 84},${frontBottom - 14} ${
            frontRight + 84
          },${frontBottom - 14} ${frontRight + 132},${frontBottom + 54} ${
            frontX - 132
          },${frontBottom + 54}`}
          fill="url(#terraceFloor)"
          stroke="#d7d2ca"
          strokeWidth="2"
        />

        <ellipse
          cx="400"
          cy={frontBottom + 72}
          rx={frontWidth / 1.6}
          ry="34"
          fill="#000000"
          opacity="0.16"
          filter="url(#softBlur)"
        />

        <g>
          <polygon
            points={`${frontRight},${frontY} ${frontRight + sideOffset},${
              frontY - sideLift
            } ${frontRight + sideOffset},${frontBottom - sideLift} ${frontRight},${frontBottom}`}
            fill={hasWalls ? "url(#glassSide)" : "transparent"}
            stroke="#111111"
            strokeWidth="9"
            strokeLinejoin="round"
            opacity={hasWalls ? 1 : 0.65}
          />

          {hasWalls && configuration.hasRightZip ? (
            <polygon
              points={`${frontRight + 7},${frontY + 13} ${
                frontRight + sideOffset - 12
              },${frontY - sideLift + 21} ${
                frontRight + sideOffset - 12
              },${frontBottom - sideLift - 10} ${frontRight + 7},${
                frontBottom - 17
              }`}
              fill="#111827"
              opacity="0.78"
            />
          ) : null}

          <polygon
            points={`${frontX - roofOverhang},${roofFrontY} ${
              frontRight + roofOverhang
            },${roofFrontY} ${frontRight + sideOffset + roofOverhang},${roofBackY} ${
              frontX + sideOffset - roofOverhang
            },${roofBackY}`}
            fill={roofFill}
            opacity={roofOpacity}
            stroke="#111111"
            strokeWidth="11"
            strokeLinejoin="round"
          />

          {configuration.hasAwning ? (
            <g opacity="0.9">
              <polygon
                points={`${frontX - roofOverhang + 18},${roofFrontY - 4} ${
                  frontRight + roofOverhang - 18
                },${roofFrontY - 4} ${
                  frontRight + sideOffset + roofOverhang - 30
                },${roofBackY + 10} ${frontX + sideOffset - roofOverhang + 30},${
                  roofBackY + 10
                }`}
                fill="#047857"
                opacity="0.82"
              />

              {Array.from({ length: 13 }).map((_, index) => {
                const x = frontX + 10 + index * (frontWidth / 12);

                return (
                  <line
                    key={`awning-stripe-${index}`}
                    x1={x}
                    y1={roofFrontY - 3}
                    x2={x + sideOffset}
                    y2={roofBackY + 9}
                    stroke="#34d399"
                    strokeWidth="5"
                    opacity="0.7"
                  />
                );
              })}
            </g>
          ) : null}

          <rect
            x={frontX}
            y={frontY}
            width={frontWidth}
            height={frontHeight}
            fill={hasWalls ? "url(#glassFront)" : "transparent"}
            stroke="#080808"
            strokeWidth="14"
            rx="1"
          />

          {!hasWalls ? (
            <rect
              x={frontX + 14}
              y={frontY + 14}
              width={frontWidth - 28}
              height={frontHeight - 28}
              fill="#111827"
              opacity="0.08"
            />
          ) : null}

          {hasWalls && configuration.hasFrontZip ? (
            <g>
              <rect
                x={frontX + 12}
                y={frontY + 14}
                width={frontWidth - 24}
                height={frontHeight - 28}
                fill="#111827"
                opacity="0.76"
              />

              {Array.from({ length: 18 }).map((_, index) => (
                <line
                  key={`front-zip-line-${index}`}
                  x1={frontX + 24 + index * ((frontWidth - 48) / 17)}
                  x2={frontX + 24 + index * ((frontWidth - 48) / 17)}
                  y1={frontY + 20}
                  y2={frontBottom - 20}
                  stroke="#334155"
                  strokeWidth="1"
                  opacity="0.65"
                />
              ))}
            </g>
          ) : null}

          {hasWalls && configuration.hasLeftZip ? (
            <polygon
              points={`${frontX - 8},${frontY + 13} ${
                frontX + sideOffset - 54
              },${frontY - sideLift + 21} ${
                frontX + sideOffset - 54
              },${frontBottom - sideLift - 10} ${frontX - 8},${
                frontBottom - 17
              }`}
              fill="#111827"
              opacity="0.72"
            />
          ) : null}

          {Array.from({ length: 5 }).map((_, index) => {
            const x = frontX + (frontWidth / 4) * index;

            return (
              <rect
                key={`front-post-${index}`}
                x={x - 4}
                y={frontY}
                width="8"
                height={frontHeight}
                fill="url(#profileGradient)"
                opacity={index === 0 || index === 4 ? 1 : 0.82}
              />
            );
          })}

          <rect
            x={frontX - 8}
            y={frontY - 7}
            width={frontWidth + 16}
            height="16"
            fill="url(#profileGradient)"
          />
          <rect
            x={frontX - 8}
            y={frontBottom - 8}
            width={frontWidth + 16}
            height="17"
            fill="url(#profileGradient)"
          />

          {hasWalls ? (
            <g opacity="0.5">
              <line
                x1={frontX + 42}
                y1={frontY + 54}
                x2={frontX + 118}
                y2={frontY + 24}
                stroke="#ffffff"
                strokeWidth="2"
              />
              <line
                x1={frontX + frontWidth * 0.58}
                y1={frontY + 74}
                x2={frontX + frontWidth * 0.75}
                y2={frontY + 42}
                stroke="#ffffff"
                strokeWidth="2"
              />
              <line
                x1={frontX + frontWidth * 0.22}
                y1={frontBottom - 34}
                x2={frontX + frontWidth * 0.55}
                y2={frontBottom - 82}
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            </g>
          ) : null}

          {configuration.hasLed ? (
            <g>
              {Array.from({ length: 6 }).map((_, index) => {
                const x = frontX + 44 + index * ((frontWidth - 88) / 5);
                const y = frontY + 42;

                return (
                  <g key={`led-${index}`}>
                    <circle
                      cx={x}
                      cy={y}
                      r="24"
                      fill="url(#warmLight)"
                      opacity="0.65"
                    />
                    <circle cx={x} cy={y} r="5" fill="#ffe082" />
                  </g>
                );
              })}
            </g>
          ) : null}

          {configuration.hasCob ? (
            <g>
              <line
                x1={frontX + 40}
                x2={frontRight - 40}
                y1={frontY - 28}
                y2={frontY - 28}
                stroke="#ffd54f"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <line
                x1={frontX + 40}
                x2={frontRight - 40}
                y1={frontY - 28}
                y2={frontY - 28}
                stroke="#ffd54f"
                strokeWidth="16"
                strokeLinecap="round"
                opacity="0.18"
              />
            </g>
          ) : null}

          <rect
            x={frontX + frontWidth / 2 - 76}
            y={frontBottom + 12}
            width="152"
            height="34"
            rx="17"
            fill="#ffffff"
            stroke="#d4d4d4"
          />
          <text
            x="400"
            y={frontBottom + 34}
            textAnchor="middle"
            fontSize="14"
            fontWeight="700"
            fill="#525252"
          >
            {label}
          </text>

          {hasAnyZip ? (
            <g>
              <rect
                x={frontX + frontWidth - 96}
                y={frontY + frontHeight - 42}
                width="78"
                height="24"
                rx="12"
                fill="#111827"
                opacity="0.88"
              />
              <text
                x={frontX + frontWidth - 57}
                y={frontY + frontHeight - 25}
                textAnchor="middle"
                fontSize="11"
                fontWeight="800"
                fill="#ffffff"
              >
                ZIP
              </text>
            </g>
          ) : null}
        </g>
      </svg>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-4">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-bold leading-5 text-neutral-950">
        {value}
      </p>
    </div>
  );
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
    extras.push("Markiza");
  }

  if (configuration.hasLed) {
    extras.push("LED punktowe");
  }

  if (configuration.hasCob) {
    extras.push("LED taśma");
  }

  if (configuration.hasHandles) {
    extras.push("Uchwyty");
  }

  if (configuration.hasBrushes) {
    extras.push("Szczotki");
  }

  if (configuration.hasLevelingProfile) {
    extras.push("Profil wyrównujący");
  }

  return extras;
}

function getRoofFill(roof: RoofOption): string {
  if (roof === "glass_clear") {
    return "#dbeafe";
  }

  if (roof === "glass_milky") {
    return "#e5e7eb";
  }

  if (roof === "polycarbonate_milky") {
    return "#d9f99d";
  }

  if (roof === "polycarbonate_grey") {
    return "#9ca3af";
  }

  if (roof === "polycarbonate_smoke") {
    return "#64748b";
  }

  return "#a7f3d0";
}

function getRoofOpacity(roof: RoofOption): number {
  if (roof === "glass_clear") {
    return 0.42;
  }

  if (roof === "glass_milky") {
    return 0.72;
  }

  return 0.78;
}

function normalize(value: number, min: number, max: number): number {
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
} 