"use client";

import { useEffect } from "react";

const STATES = [
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
      <path d="M16 22V12M16 12l-4 4M16 12l4 4" stroke="${arrow}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`,
  )}`;
}

export function FaviconCycler() {
  useEffect(() => {
    let index = 0;
    const link =
      document.querySelector<HTMLLinkElement>("link[rel='icon']") ??
      document.querySelector<HTMLLinkElement>("link[rel='shortcut icon']");
    if (!link) return;

    const state = STATES[0];
    link.href = createFaviconSvg(state.bg, state.arrow);

    const interval = setInterval(() => {
      index = (index + 1) % STATES.length;
      const s = STATES[index];
      link.href = createFaviconSvg(s.bg, s.arrow);
    }, INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return null;
}