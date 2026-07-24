"use client";

import { useEffect } from "react";

const COLORS = [
  { bg: "#ffffff", arrow: "#6366f1" },
  { bg: "#09090b", arrow: "#fafafa" },
  { bg: "#eef2ff", arrow: "#6366f1" },
  { bg: "#18181b", arrow: "#818cf8" },
];

const INTERVAL_MS = 4000;

function createFaviconSvg(bg: string, arrow: string) {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
      <rect width="32" height="32" rx="8" fill="${bg}"/>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="${arrow}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <polyline points="17 8 12 3 7 8" stroke="${arrow}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <line x1="12" y1="3" x2="12" y2="15" stroke="${arrow}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`,
  )}`;
}

export function FaviconCycler() {
  useEffect(() => {
    let index = 0;
    let link =
      document.querySelector<HTMLLinkElement>("link[rel='icon']") ??
      document.querySelector<HTMLLinkElement>("link[rel='shortcut icon']");

    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }

    const s = COLORS[0];
    link.href = createFaviconSvg(s.bg, s.arrow);

    const interval = setInterval(() => {
      index = (index + 1) % COLORS.length;
      const c = COLORS[index];
      link!.href = createFaviconSvg(c.bg, c.arrow);
    }, INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return null;
}