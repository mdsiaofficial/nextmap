export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

export type RouteType = "page" | "api" | "layout" | "loading" | "error" | "not-found" | "middleware" | "template";

export type RouterType = "app" | "pages";

export interface RouteNode {
  id: string;
  path: string;            // URL path e.g. /users/[id]
  filePath: string;        // Relative file path e.g. app/users/[id]/page.tsx
  type: RouteType;
  router: RouterType;
  methods: HttpMethod[];   // For API routes; pages are always GET
  isDynamic: boolean;
  dynamicSegments: string[];  // e.g. ["id"], ["...slug"]
  isParallelSlot: boolean;    // @modal, @sidebar
  isRouteGroup: boolean;      // (auth), (marketing)
  groupName: string | null;
  children: string[];      // IDs of child routes
  parentId: string | null;
  specialFiles: {          // Sibling special files in same directory
    loading: boolean;
    error: boolean;
    notFound: boolean;
    template: boolean;
  };
  middlewareMatchers: string[] | null;  // Only for middleware.ts
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
