import type { RouteNode } from "../types.js";

const METHOD_COLORS: Record<string, string> = {
  GET: "#3b82f6",
  POST: "#22c55e",
  PUT: "#eab308",
  PATCH: "#f97316",
  DELETE: "#ef4444",
  HEAD: "#8b5cf6",
  OPTIONS: "#6b7280",
};

const TYPE_ICONS: Record<string, string> = {
  page: "P",
  api: "A",
  layout: "L",
  middleware: "M",
  loading: "...",
  error: "!",
  "not-found": "?",
};

export function generateSvg(routes: RouteNode[]): string {
  // Filter to pages and API routes only for the static export
  const visibleRoutes = routes.filter(
    (r) => r.type === "page" || r.type === "api" || r.type === "middleware"
  );

  // Sort by path
  visibleRoutes.sort((a, b) => a.path.localeCompare(b.path));

  const rowHeight = 40;
  const padding = 20;
  const width = 800;
  const height = padding * 2 + visibleRoutes.length * rowHeight + 60;

  const rows = visibleRoutes.map((route, i) => {
    const y = padding + 60 + i * rowHeight;
    const icon = TYPE_ICONS[route.type] || "?";
    const typeColor = route.type === "api" ? "#22c55e" : "#3b82f6";

    const methodBadges = route.methods
      .map((m, mi) => {
        const color = METHOD_COLORS[m] || "#6b7280";
        return `<rect x="${530 + mi * 52}" y="${y - 12}" width="46" height="20" rx="4" fill="${color}" fill-opacity="0.15" stroke="${color}" stroke-width="1"/>
        <text x="${553 + mi * 52}" y="${y + 2}" text-anchor="middle" font-size="10" fill="${color}" font-family="monospace">${m}</text>`;
      })
      .join("\n      ");

    const dynamicBadge = route.isDynamic
      ? `<rect x="${490}" y="${y - 12}" width="32" height="20" rx="4" fill="#f97316" fill-opacity="0.15" stroke="#f97316" stroke-width="1"/>
        <text x="${506}" y="${y + 2}" text-anchor="middle" font-size="9" fill="#f97316" font-family="monospace">dyn</text>`
      : "";

    return `
    <g>
      <rect x="${padding}" y="${y - 14}" width="${width - padding * 2}" height="${rowHeight - 4}" rx="6" fill="#1a1d27" fill-opacity="${i % 2 === 0 ? "0" : "0.25"}"/>
      <circle cx="${padding + 16}" cy="${y}" r="10" fill="${typeColor}" fill-opacity="0.15" stroke="${typeColor}" stroke-width="1.5"/>
      <text x="${padding + 16}" y="${y + 4}" text-anchor="middle" font-size="10" font-weight="bold" fill="${typeColor}" font-family="monospace">${icon}</text>
      <text x="${padding + 38}" y="${y + 4}" font-size="13" fill="#e5e7eb" font-family="monospace">${escapeXml(route.path)}</text>
      ${dynamicBadge}
      ${methodBadges}
    </g>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="#0f1117" rx="12"/>

  <!-- Header -->
  <text x="${padding}" y="${padding + 20}" font-size="20" font-weight="bold" fill="#6366f1" font-family="system-ui, sans-serif">nextmap</text>
  <text x="${padding + 100}" y="${padding + 20}" font-size="14" fill="#6b7280" font-family="system-ui, sans-serif">${visibleRoutes.length} routes</text>

  <!-- Legend -->
  <circle cx="${width - 200}" cy="${padding + 16}" r="6" fill="#3b82f6" fill-opacity="0.15" stroke="#3b82f6" stroke-width="1"/>
  <text x="${width - 190}" y="${padding + 20}" font-size="11" fill="#6b7280" font-family="system-ui">Page</text>
  <circle cx="${width - 140}" cy="${padding + 16}" r="6" fill="#22c55e" fill-opacity="0.15" stroke="#22c55e" stroke-width="1"/>
  <text x="${width - 130}" y="${padding + 20}" font-size="11" fill="#6b7280" font-family="system-ui">API</text>
  <circle cx="${width - 80}" cy="${padding + 16}" r="6" fill="#6366f1" fill-opacity="0.15" stroke="#6366f1" stroke-width="1"/>
  <text x="${width - 70}" y="${padding + 20}" font-size="11" fill="#6b7280" font-family="system-ui">Middleware</text>

  <line x1="${padding}" y1="${padding + 40}" x2="${width - padding}" y2="${padding + 40}" stroke="#2a2d3a" stroke-width="1"/>

  ${rows.join("\n")}
</svg>`;
}

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
