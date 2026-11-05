"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  CONSENT_CHANGED_EVENT,
  hasMarketingConsent,
} from "@/privacy/consent";

type MetaPixelFunction = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[][];
  loaded?: boolean;
  version?: string;
  push?: (...args: unknown[]) => void;
};

declare global {
  interface Window {
    fbq?: MetaPixelFunction;
    _fbq?: MetaPixelFunction;
  }
}

const META_PIXEL_SCRIPT_ID = "moonglass-meta-pixel-script";

let initializedPixelId: string | null = null;

export function MetaPixel() {
  const pathname = usePathname();
  const lastTrackedLocation = useRef<string | null>(null);

  useEffect(() => {
    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();

    function trackPageView() {
      if (!pixelId || !hasMarketingConsent()) {
        return;
      }

      ensureMetaPixel(pixelId);

      const locationKey =
        window.location.pathname + window.location.search;

      if (lastTrackedLocation.current === locationKey) {
        return;
      }

      window.fbq?.("track", "PageView");
      lastTrackedLocation.current = locationKey;
    }

    function handleConsentChange() {
      if (hasMarketingConsent()) {
        lastTrackedLocation.current = null;
        trackPageView();
        return;
      }

      window.fbq?.("consent", "revoke");
      lastTrackedLocation.current = null;
    }

    trackPageView();

    window.addEventListener(
      CONSENT_CHANGED_EVENT,
      handleConsentChange
    );

    return () => {
      window.removeEventListener(
        CONSENT_CHANGED_EVENT,
        handleConsentChange
      );
    };
  }, [pathname]);

  return null;
}

function ensureMetaPixel(pixelId: string): void {
  const fbq = ensureFbq();

  fbq("consent", "grant");

  if (initializedPixelId !== pixelId) {
    fbq("init", pixelId);
    initializedPixelId = pixelId;
  }

  if (!document.getElementById(META_PIXEL_SCRIPT_ID)) {
    const script = document.createElement("script");

    script.id = META_PIXEL_SCRIPT_ID;
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";

    document.head.appendChild(script);
  }
}

function ensureFbq(): MetaPixelFunction {
  if (window.fbq) {
    return window.fbq;
  }

  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) {
      fbq.callMethod(...args);
      return;
    }

    fbq.queue?.push(args);
  } as MetaPixelFunction;

  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.push = fbq;

  window.fbq = fbq;
  window._fbq = fbq;

  return fbq;
}
