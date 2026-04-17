import fs from "fs";
import path from "path";
import type { RouteNode, ScanResult, HttpMethod, RouterType } from "../types.js";

const VALID_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

const HTTP_METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

// App Router special file names (without extension)
const APP_ROUTER_PAGE = "page";
const APP_ROUTER_LAYOUT = "layout";
const APP_ROUTER_ROUTE = "route";
const APP_ROUTER_LOADING = "loading";
const APP_ROUTER_ERROR = "error";
const APP_ROUTER_NOT_FOUND = "not-found";
const APP_ROUTER_TEMPLATE = "template";
const APP_ROUTER_MIDDLEWARE = "middleware";

export function scanProject(rootDir: string): ScanResult {
  const appDir = findDir(rootDir, "app");
  const pagesDir = findDir(rootDir, "pages");

  const routes: RouteNode[] = [];

  let router: RouterType | "hybrid" = "app";
  if (appDir && pagesDir) router = "hybrid";
  else if (pagesDir) router = "pages";
  else if (!appDir) router = "app"; // default even if nothing found

  // Scan for root middleware
  const middlewareFile = findFile(rootDir, "middleware");
  if (middlewareFile) {
    routes.push(createMiddlewareNode(rootDir, middlewareFile));
  }

  // Also check src/middleware
  const srcMiddlewareFile = findFile(path.join(rootDir, "src"), "middleware");
  if (srcMiddlewareFile && srcMiddlewareFile !== middlewareFile) {
    routes.push(createMiddlewareNode(rootDir, srcMiddlewareFile));
  }

  if (appDir) {
    scanAppRouter(rootDir, appDir, "/", null, routes);
  }

  if (pagesDir) {
    scanPagesRouter(rootDir, pagesDir, "/", routes);
  }

  return {
    routes,
    router,
    appDir: appDir ? path.relative(rootDir, appDir) : null,
    pagesDir: pagesDir ? path.relative(rootDir, pagesDir) : null,
    hasMiddleware: !!middlewareFile || !!srcMiddlewareFile,
  };
}

function findDir(rootDir: string, name: string): string | null {
  // Check root/app, root/src/app
  const direct = path.join(rootDir, name);
  if (fs.existsSync(direct) && fs.statSync(direct).isDirectory()) return direct;

  const inSrc = path.join(rootDir, "src", name);
  if (fs.existsSync(inSrc) && fs.statSync(inSrc).isDirectory()) return inSrc;

  return null;
}

function findFile(dir: string, baseName: string): string | null {
  if (!fs.existsSync(dir)) return null;
  for (const ext of VALID_EXTENSIONS) {
    const filePath = path.join(dir, baseName + ext);
    if (fs.existsSync(filePath)) return filePath;
  }
  return null;
}

function hasFile(dir: string, baseName: string): boolean {
  return findFile(dir, baseName) !== null;
}

function getFileWithExt(dir: string, baseName: string): string | null {
  for (const ext of VALID_EXTENSIONS) {
    const filePath = path.join(dir, baseName + ext);
    if (fs.existsSync(filePath)) return filePath;
  }
  return null;
}

// ─── App Router Scanning ──────────────────────────────────────

function scanAppRouter(
  rootDir: string,
  dir: string,
  urlPath: string,
  parentId: string | null,
  routes: RouteNode[]
) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  // Check for special files in this directory
  const specialFiles = {
    loading: hasFile(dir, APP_ROUTER_LOADING),
    error: hasFile(dir, APP_ROUTER_ERROR),
    notFound: hasFile(dir, APP_ROUTER_NOT_FOUND),
    template: hasFile(dir, APP_ROUTER_TEMPLATE),
  };

  // Check for page.tsx
  const pageFile = getFileWithExt(dir, APP_ROUTER_PAGE);
  if (pageFile) {
    const node = createRouteNode({
      rootDir,
      filePath: pageFile,
      urlPath,
      type: "page",
      router: "app",
      methods: ["GET"],
      parentId,
      specialFiles,
    });
    routes.push(node);
  }

  // Check for route.ts (API)
  const routeFile = getFileWithExt(dir, APP_ROUTER_ROUTE);
  if (routeFile) {
    const methods = parseRouteExports(routeFile);
    const node = createRouteNode({
      rootDir,
      filePath: routeFile,
      urlPath,
      type: "api",
      router: "app",
      methods: methods.length > 0 ? methods : ["GET"],
      parentId,
      specialFiles,
    });
    routes.push(node);
  }

  // Check for layout.tsx
  const layoutFile = getFileWithExt(dir, APP_ROUTER_LAYOUT);
  let layoutId = parentId;
  if (layoutFile) {
    const node = createRouteNode({
      rootDir,
      filePath: layoutFile,
      urlPath,
      type: "layout",
      router: "app",
      methods: [],
      parentId,
      specialFiles,
    });
    routes.push(node);
    layoutId = node.id;
  }

  // Recurse into subdirectories
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;

    const subDir = path.join(dir, entry.name);
    const segment = entry.name;

    // Route groups: (groupName) — don't affect URL
    if (segment.startsWith("(") && segment.endsWith(")")) {
      scanAppRouter(rootDir, subDir, urlPath, layoutId, routes);
      continue;
    }

    // Parallel routes: @slotName — don't affect URL
    if (segment.startsWith("@")) {
      scanAppRouter(rootDir, subDir, urlPath, layoutId, routes);
      continue;
    }

    // Intercepting routes: (.)name, (..)name, (...)name
    if (segment.startsWith("(.)") || segment.startsWith("(..)") || segment.startsWith("(...)")) {
      const cleanSegment = segment.replace(/^\(\.+\)/, "");
      const childPath = urlPath === "/" ? `/${cleanSegment}` : `${urlPath}/${cleanSegment}`;
      scanAppRouter(rootDir, subDir, childPath, layoutId, routes);
      continue;
    }

    // Normal or dynamic segments
    const childPath = urlPath === "/" ? `/${segment}` : `${urlPath}/${segment}`;
    scanAppRouter(rootDir, subDir, childPath, layoutId, routes);
  }
}

// ─── Pages Router Scanning ──────────────────────────────────────

function scanPagesRouter(
  rootDir: string,
  dir: string,
  urlPath: string,
  routes: RouteNode[]
) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name.startsWith("_")) continue;
    if (entry.name === "node_modules") continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "api") {
        // Scan API directory
        scanPagesApiDir(rootDir, fullPath, "/api", routes);
      } else {
        const childPath = urlPath === "/" ? `/${entry.name}` : `${urlPath}/${entry.name}`;
        scanPagesRouter(rootDir, fullPath, childPath, routes);
      }
      continue;
    }

    // Files
    const ext = path.extname(entry.name);
    if (!VALID_EXTENSIONS.includes(ext)) continue;

    const baseName = path.basename(entry.name, ext);

    // Skip special Next.js files
    if (["_app", "_document", "_error"].includes(baseName)) continue;

    const pagePath = baseName === "index"
      ? urlPath
      : urlPath === "/" ? `/${baseName}` : `${urlPath}/${baseName}`;

    const node = createRouteNode({
      rootDir,
      filePath: fullPath,
      urlPath: pagePath,
      type: "page",
      router: "pages",
      methods: ["GET"],
      parentId: null,
      specialFiles: { loading: false, error: false, notFound: false, template: false },
    });
    routes.push(node);
  }
}

function scanPagesApiDir(
  rootDir: string,
  dir: string,
  urlPath: string,
  routes: RouteNode[]
) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name.startsWith("_")) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const childPath = `${urlPath}/${entry.name}`;
      scanPagesApiDir(rootDir, fullPath, childPath, routes);
      continue;
    }

    const ext = path.extname(entry.name);
    if (!VALID_EXTENSIONS.includes(ext)) continue;

    const baseName = path.basename(entry.name, ext);
    const apiPath = baseName === "index" ? urlPath : `${urlPath}/${baseName}`;

    // Pages API routes typically handle all methods in one handler
    const node = createRouteNode({
      rootDir,
      filePath: fullPath,
      urlPath: apiPath,
      type: "api",
      router: "pages",
      methods: ["GET", "POST", "PUT", "DELETE"],
      parentId: null,
      specialFiles: { loading: false, error: false, notFound: false, template: false },
    });
    routes.push(node);
  }
}

// ─── Helpers ──────────────────────────────────────

function parseRouteExports(filePath: string): HttpMethod[] {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const methods: HttpMethod[] = [];

    for (const method of HTTP_METHODS) {
      // Match: export function GET, export async function GET,
      // export const GET, export { GET }
      const patterns = [
        new RegExp(`export\\s+(async\\s+)?function\\s+${method}\\b`),
        new RegExp(`export\\s+const\\s+${method}\\b`),
        new RegExp(`export\\s*\\{[^}]*\\b${method}\\b[^}]*\\}`),
      ];
      if (patterns.some((p) => p.test(content))) {
        methods.push(method);
      }
    }
    return methods;
  } catch {
    return [];
  }
}

function parseMiddlewareMatchers(filePath: string): string[] | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    // Match: export const config = { matcher: [...] }
    const matcherMatch = content.match(/matcher\s*:\s*\[([\s\S]*?)\]/);
    if (matcherMatch) {
      const inner = matcherMatch[1];
      const paths = inner.match(/['"`]([^'"`]+)['"`]/g);
      return paths ? paths.map((p) => p.replace(/['"`]/g, "")) : null;
    }
    // Match: matcher: "/path"
    const singleMatch = content.match(/matcher\s*:\s*['"`]([^'"`]+)['"`]/);
    if (singleMatch) return [singleMatch[1]];
    return null;
  } catch {
    return null;
  }
}

function createMiddlewareNode(rootDir: string, filePath: string): RouteNode {
  const matchers = parseMiddlewareMatchers(filePath);
  return {
    id: "middleware",
    path: "/",
    filePath: path.relative(rootDir, filePath),
    type: "middleware",
    router: "app",
    methods: [],
    isDynamic: false,
    dynamicSegments: [],
    isParallelSlot: false,
    isRouteGroup: false,
    groupName: null,
    children: [],
    parentId: null,
    specialFiles: { loading: false, error: false, notFound: false, template: false },
    middlewareMatchers: matchers,
  };
}

function createRouteNode(opts: {
  rootDir: string;
  filePath: string;
  urlPath: string;
  type: RouteNode["type"];
  router: RouterType;
  methods: HttpMethod[];
  parentId: string | null;
  specialFiles: RouteNode["specialFiles"];
}): RouteNode {
  const relPath = path.relative(opts.rootDir, opts.filePath);
  const urlPath = normalizeUrlPath(opts.urlPath);

  // Parse dynamic segments
  const dynamicSegments: string[] = [];
  const segments = urlPath.split("/").filter(Boolean);
  for (const seg of segments) {
    if (seg.startsWith("[") && seg.endsWith("]")) {
      dynamicSegments.push(seg.slice(1, -1));
    }
  }

  // Detect parallel slots and route groups from the file path
  const pathParts = relPath.split(path.sep);
  const isParallelSlot = pathParts.some((p) => p.startsWith("@"));
  const routeGroup = pathParts.find((p) => p.startsWith("(") && p.endsWith(")") && !p.startsWith("(."));
  const isRouteGroup = !!routeGroup;
  const groupName = routeGroup ? routeGroup.slice(1, -1) : null;

  return {
    id: `${opts.router}:${urlPath}:${opts.type}${isParallelSlot ? `:${pathParts.find((p) => p.startsWith("@"))}` : ""}`,
    path: urlPath,
    filePath: relPath,
    type: opts.type,
    router: opts.router,
    methods: opts.methods,
    isDynamic: dynamicSegments.length > 0,
    dynamicSegments,
    isParallelSlot,
    isRouteGroup,
    groupName,
    children: [],
    parentId: opts.parentId,
    specialFiles: opts.specialFiles,
    middlewareMatchers: null,
  };
}

function normalizeUrlPath(urlPath: string): string {
  if (urlPath === "") return "/";
  if (!urlPath.startsWith("/")) urlPath = "/" + urlPath;
  // Remove trailing slash except for root
  if (urlPath.length > 1 && urlPath.endsWith("/")) urlPath = urlPath.slice(0, -1);
  return urlPath;
}
