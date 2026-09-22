"use client";

import Image from "next/image";
import { useRef, useState } from "react";

export type RealProjectImage = {
  src: string;
  alt: string;
  label: string;
};

type RealProjectGalleryProps = {
  images: RealProjectImage[];
};

export function RealProjectGallery({ images }: RealProjectGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const mobileTrackRef = useRef<HTMLDivElement>(null);
  const mobileSlideRefs = useRef<(HTMLElement | null)[]>([]);

  if (images.length === 0) {
    return null;
  }

  const previousImage = () => {
    setActiveIndex((current) =>
      current === 0 ? images.length - 1 : current - 1,
    );
  };

  const nextImage = () => {
    setActiveIndex((current) =>
      current === images.length - 1 ? 0 : current + 1,
    );
  };

  const scrollMobileTo = (index: number) => {
    const track = mobileTrackRef.current;
    const slide = mobileSlideRefs.current[index];

    if (!track || !slide) {
      return;
    }

    track.scrollTo({
      left: slide.offsetLeft,
      behavior: "smooth",
    });

    setActiveIndex(index);
  };

  const handleMobileScroll = () => {
    const track = mobileTrackRef.current;

    if (!track) {
      return;
    }

    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    mobileSlideRefs.current.forEach((slide, index) => {
      if (!slide) {
        return;
      }

      const distance = Math.abs(slide.offsetLeft - track.scrollLeft);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveIndex(closestIndex);
  };

  return (
    <div>
      {/* MOBILE / TABLET */}
      <div className="lg:hidden">
        <div
          ref={mobileTrackRef}
          onScroll={handleMobileScroll}
          className="-mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-2 pr-[15%] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-8 sm:px-8"
        >
          {images.map((image, index) => (
            <article
              key={image.src}
              ref={(element) => {
                mobileSlideRefs.current[index] = element;
              }}
              className="w-[88%] shrink-0 snap-start"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-[#e8e0d3]">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="88vw"
                  className="object-cover"
                />

                <div className="absolute right-3 top-3 rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-semibold tracking-[0.08em] text-white backdrop-blur-sm">
                  {index + 1} / {images.length}
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between gap-5">
          <div className="flex items-center gap-2">
            {images.map((image, index) => (
              <button
                key={image.src}
                type="button"
                aria-label={`Pokaż zdjęcie ${index + 1}`}
                aria-current={activeIndex === index ? "true" : undefined}
                onClick={() => scrollMobileTo(index)}
                className={`h-1.5 rounded-full transition-all ${
                  activeIndex === index
                    ? "w-7 bg-[#9a722e]"
                    : "w-1.5 bg-[#062c25]/20"
                }`}
              />
            ))}
          </div>

          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#062c25]/40">
            Przesuń
          </p>
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-[minmax(0,1fr)_138px] gap-3">
          <div className="relative aspect-[4/3] max-h-[700px] overflow-hidden bg-[#e8e0d3]">
            <Image
              src={images[activeIndex].src}
              alt={images[activeIndex].alt}
              fill
              sizes="(min-width: 1280px) 1040px, 80vw"
              className="object-cover"
            />

            <button
              type="button"
              onClick={previousImage}
              aria-label="Poprzednie zdjęcie"
              className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-2xl text-white backdrop-blur-sm transition hover:bg-black/75"
            >
              ‹
            </button>

            <button
              type="button"
              onClick={nextImage}
              aria-label="Następne zdjęcie"
              className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-2xl text-white backdrop-blur-sm transition hover:bg-black/75"
            >
              ›
            </button>

            <div className="absolute right-4 top-4 rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-semibold tracking-[0.08em] text-white backdrop-blur-sm">
              {activeIndex + 1} / {images.length}
            </div>
          </div>

          <div className="grid grid-rows-7 gap-2">
            {images.map((image, index) => (
              <button
                key={image.src}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Pokaż zdjęcie ${index + 1}: ${image.label}`}
                aria-current={activeIndex === index ? "true" : undefined}
                className={`group relative min-h-0 overflow-hidden border transition ${
                  activeIndex === index
                    ? "border-[#9a722e]"
                    : "border-[#062c25]/10 hover:border-[#062c25]/35"
                }`}
              >
                <Image
                  src={image.src}
                  alt=""
                  fill
                  sizes="138px"
                  className={`object-cover transition duration-300 ${
                    activeIndex === index
                      ? "opacity-100"
                      : "opacity-70 group-hover:opacity-100"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
