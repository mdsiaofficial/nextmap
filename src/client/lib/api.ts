const BASE = "";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
export type RouteType = "page" | "api" | "layout" | "loading" | "error" | "not-found" | "middleware" | "template";
export type RouterType = "app" | "pages";

export interface RouteNode {
  id: string;
  path: string;
  filePath: string;
  type: RouteType;
  router: RouterType;
  methods: HttpMethod[];
  isDynamic: boolean;
  dynamicSegments: string[];
  isParallelSlot: boolean;
  isRouteGroup: boolean;
  groupName: string | null;
  children: string[];
  parentId: string | null;
  specialFiles: {
    loading: boolean;
    error: boolean;
    notFound: boolean;
    template: boolean;
  };
  middlewareMatchers: string[] | null;
}

export interface ScanResult {
  routes: RouteNode[];
  router: RouterType | "hybrid";
  appDir: string | null;
  pagesDir: string | null;
  hasMiddleware: boolean;
}

export interface AppConfig {
  projectName: string;
  rootPath: string;
  router: RouterType | "hybrid";
  totalRoutes: number;
  totalApiRoutes: number;
  totalPages: number;
}

export async function fetchConfig(): Promise<AppConfig> {
  const res = await fetch(`${BASE}/api/config`);
  return res.json();
}

export async function fetchRoutes(): Promise<ScanResult> {
  const res = await fetch(`${BASE}/api/routes`);
  return res.json();
}

export function getExportSvgUrl(): string {
  return `${BASE}/api/export/svg`;
}

export function getExportPngUrl(): string {
  return `${BASE}/api/export/png`;
}

export function getExportPdfUrl(): string {
  return `${BASE}/api/export/pdf`;
}

export async function fetchSource(filePath: string): Promise<string> {
  const res = await fetch(`${BASE}/api/source?file=${encodeURIComponent(filePath)}`);
  if (!res.ok) throw new Error("Failed to fetch source");
  const data = await res.json();
  return data.content;
}
