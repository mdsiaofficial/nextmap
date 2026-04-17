import type { Node, Edge } from "@xyflow/react";
import type { RouteNode, RouteType } from "./api";
import type { Direction } from "../store/map";

export interface RouteNodeData {
  route: RouteNode;
  label: string;
  isMiddleware?: boolean;
  isUnprotected?: boolean;
  direction?: Direction;
  [key: string]: unknown;
}

const METHOD_COLORS: Record<string, string> = {
  GET: "#3b82f6",
  POST: "#22c55e",
  PUT: "#eab308",
  PATCH: "#f97316",
  DELETE: "#ef4444",
  HEAD: "#8b5cf6",
  OPTIONS: "#6b7280",
};

const TYPE_COLORS: Record<RouteType, string> = {
  page: "#3b82f6",
  api: "#22c55e",
  layout: "#8b5cf6",
  middleware: "#f59e0b",
  loading: "#6b7280",
  error: "#ef4444",
  "not-found": "#f97316",
  template: "#6366f1",
};

export function getMethodColor(method: string): string {
  return METHOD_COLORS[method] || "#6b7280";
}

export function getTypeColor(type: RouteType): string {
  return TYPE_COLORS[type] || "#6b7280";
}

function matchesMiddleware(routePath: string, matchers: string[]): boolean {
  for (const matcher of matchers) {
    if (routePath === matcher) return true;
    const cleanMatcher = matcher
      .replace(/\/:\w+\*?/g, "")
      .replace(/\/\(.*\)/g, "");
    if (cleanMatcher && routePath.startsWith(cleanMatcher)) return true;
    try {
      const prefix = matcher.split("/:")[0].split("/(")[0];
      if (prefix && prefix !== "/" && routePath.startsWith(prefix)) return true;
    } catch {
      // ignore
    }
  }
  return false;
}

// ─── Constants ──────────────────────────────────────

const NODE_W = 300;
const NODE_H = 100;
const GROUP_LABEL_W = 140;
const GROUP_LABEL_H = 36;
const CHILD_GAP = 28;
const LEVEL_GAP = 50;
const SECTION_GAP = 140;
const SPLIT_THRESHOLD = 4;

// ─── Edge styles ──────────────────────────────────────

interface EdgeStyle {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
}

const MIDDLEWARE_EDGE: EdgeStyle = {
  stroke: "#f59e0b",
  strokeWidth: 2,
  strokeDasharray: "6 3",
};

const UNPROTECTED_EDGE: EdgeStyle = {
  stroke: "var(--color-muted)",
  strokeWidth: 2,
  strokeDasharray: "6 3",
};

const TREE_EDGE: EdgeStyle = {
  stroke: "var(--color-border)",
  strokeWidth: 1.5,
};

// ─── Width estimation ──────────────────────────────────
// Estimate rendered width from content so LR mode avoids overlap.

function estimateRouteWidth(route: RouteNode): number {
  // Path row: icon(20) + text + dynamic badge(50?) + padding(28)
  const pathW = 20 + route.path.length * 7.5 + (route.isDynamic ? 50 : 0) + 28;
  // FilePath row
  const fileW = 12 + route.filePath.length * 6.5 + 28;
  // Method badges (~45px each)
  const methodsW = route.methods.length > 0 ? route.methods.length * 45 + 20 : 0;
  return Math.max(260, pathW, fileW, methodsW);
}

function estimateGroupLabelWidth(label: string): number {
  return Math.max(GROUP_LABEL_W, label.length * 8.5 + 30);
}

// ─── Tree structure ──────────────────────────────────

interface TreeNode {
  id: string;
  label: string;
  isGroup: boolean;
  route: RouteNode | null;
  firstRoute: RouteNode;
  children: TreeNode[];
  span: number;      // spread along sibling axis (x in TB, y in LR)
  nodeWidth: number;  // estimated rendered width (for LR cross-axis spacing)
}

// Sort: leaves first (alphabetically), then groups (alphabetically)
function sortChildren(children: TreeNode[]): TreeNode[] {
  return children.sort((a, b) => {
    if (a.isGroup !== b.isGroup) return a.isGroup ? 1 : -1;
    return a.label.localeCompare(b.label);
  });
}

function buildTree(routes: RouteNode[]): TreeNode[] {
  // Group by first segment
  const topGroups = new Map<string, RouteNode[]>();
  for (const route of routes) {
    const segments = route.path.split("/").filter(Boolean);
    const key = segments[0] || "(root)";
    if (!topGroups.has(key)) topGroups.set(key, []);
    topGroups.get(key)!.push(route);
  }

  const result: TreeNode[] = [];

  for (const [groupName, groupRoutes] of topGroups) {
    // Single route — direct leaf
    if (groupRoutes.length === 1) {
      result.push(leafNode(groupRoutes[0]));
      continue;
    }

    // Small group — routes are direct children of the group label
    if (groupRoutes.length <= SPLIT_THRESHOLD) {
      const label = `/${groupName}`;
      const node: TreeNode = {
        id: `group:${groupName}`,
        label,
        isGroup: true,
        route: null,
        firstRoute: groupRoutes[0],
        children: sortChildren(groupRoutes.map(leafNode)),
        span: 0,
        nodeWidth: estimateGroupLabelWidth(label),
      };
      result.push(node);
      continue;
    }

    // Large group — split by second segment
    const subGroups = new Map<string, RouteNode[]>();
    for (const route of groupRoutes) {
      const segments = route.path.split("/").filter(Boolean);
      const subKey = segments.length > 1 ? segments[1] : "(index)";
      if (!subGroups.has(subKey)) subGroups.set(subKey, []);
      subGroups.get(subKey)!.push(route);
    }

    const topLabel = `/${groupName}`;
    const groupNode: TreeNode = {
      id: `group:${groupName}`,
      label: topLabel,
      isGroup: true,
      route: null,
      firstRoute: groupRoutes[0],
      children: [],
      span: 0,
      nodeWidth: estimateGroupLabelWidth(topLabel),
    };

    // If sub-splitting didn't help, keep flat
    if (subGroups.size <= 1) {
      groupNode.children = sortChildren(groupRoutes.map(leafNode));
      result.push(groupNode);
      continue;
    }

    for (const [subName, subRoutes] of subGroups) {
      if (subRoutes.length === 1) {
        groupNode.children.push(leafNode(subRoutes[0]));
      } else {
        // Full path for sub-group label
        const subLabel = `/${groupName}/${subName}`;
        groupNode.children.push({
          id: `group:${groupName}/${subName}`,
          label: subLabel,
          isGroup: true,
          route: null,
          firstRoute: subRoutes[0],
          children: sortChildren(subRoutes.map(leafNode)),
          span: 0,
          nodeWidth: estimateGroupLabelWidth(subLabel),
        });
      }
    }

    groupNode.children = sortChildren(groupNode.children);
    result.push(groupNode);
  }

  return sortChildren(result);
}

function leafNode(route: RouteNode): TreeNode {
  return {
    id: route.id,
    label: route.path,
    isGroup: false,
    route,
    firstRoute: route,
    children: [],
    span: 0,
    nodeWidth: estimateRouteWidth(route),
  };
}

// ─── Size calculation ──────────────────────────────────

function calcSpan(node: TreeNode, dir: Direction): number {
  const leafSpan = dir === "TB" ? NODE_W : NODE_H;
  const groupSpan = dir === "TB" ? GROUP_LABEL_W : GROUP_LABEL_H;

  if (node.children.length === 0) {
    node.span = node.isGroup ? groupSpan : leafSpan;
    return node.span;
  }

  let total = 0;
  for (const child of node.children) {
    total += calcSpan(child, dir);
  }
  total += (node.children.length - 1) * CHILD_GAP;

  const ownSpan = node.isGroup ? groupSpan : leafSpan;
  node.span = Math.max(ownSpan, total);
  return node.span;
}

// ─── Positioning ──────────────────────────────────────

function positionNode(
  node: TreeNode,
  centerMain: number,
  crossPos: number,
  dir: Direction,
  parentId: string | null,
  edgeStyle: EdgeStyle,
  nodes: Node<RouteNodeData>[],
  edges: Edge[]
) {
  if (node.isGroup) {
    const px = dir === "TB" ? centerMain - GROUP_LABEL_W / 2 : crossPos;
    const py = dir === "TB" ? crossPos : centerMain - GROUP_LABEL_H / 2;
    nodes.push({
      id: node.id,
      type: "group-label",
      position: { x: px, y: py },
      data: { label: node.label, route: node.firstRoute, direction: dir },
      draggable: true,
    });
  } else {
    const px = dir === "TB" ? centerMain - NODE_W / 2 : crossPos;
    const py = dir === "TB" ? crossPos : centerMain - NODE_H / 2;
    nodes.push({
      id: node.id,
      type: "route-node",
      position: { x: px, y: py },
      data: { route: node.route!, label: node.route!.path, direction: dir },
      draggable: true,
    });
  }

  if (parentId) {
    edges.push({
      id: `e:${parentId}-${node.id}`,
      source: parentId,
      target: node.id,
      style: edgeStyle,
      type: "smoothstep",
    });
  }

  if (node.children.length === 0) return;

  // Cross-axis offset uses estimated node width for LR to avoid overlap
  let childCrossPos: number;
  if (dir === "TB") {
    const nodeH = node.isGroup ? GROUP_LABEL_H : NODE_H;
    childCrossPos = crossPos + nodeH + LEVEL_GAP;
  } else {
    childCrossPos = crossPos + node.nodeWidth + LEVEL_GAP;
  }

  let startMain = centerMain - node.span / 2;
  for (const child of node.children) {
    const childCenter = startMain + child.span / 2;
    positionNode(child, childCenter, childCrossPos, dir, node.id, TREE_EDGE, nodes, edges);
    startMain += child.span + CHILD_GAP;
  }
}

// ─── Layout a forest of trees ──────────────────────────

function layoutForest(
  trees: TreeNode[],
  originMain: number,
  originCross: number,
  dir: Direction,
  parentId: string | null,
  parentEdgeStyle: EdgeStyle,
  nodes: Node<RouteNodeData>[],
  edges: Edge[]
): { totalSpan: number } {
  let offset = originMain;
  for (const tree of trees) {
    const center = offset + tree.span / 2;
    positionNode(tree, center, originCross, dir, parentId, parentEdgeStyle, nodes, edges);
    offset += tree.span + CHILD_GAP;
  }
  const totalSpan = offset - originMain - (trees.length > 0 ? CHILD_GAP : 0);
  return { totalSpan };
}

// ─── Main entry point ──────────────────────────────────

export function buildFlowGraph(
  routes: RouteNode[],
  filterType: RouteType | "all",
  filterRouter: "app" | "pages" | "all",
  searchQuery: string,
  direction: Direction = "TB"
): { nodes: Node<RouteNodeData>[]; edges: Edge[] } {
  const allRoutes = routes.filter(
    (r) => r.type === "page" || r.type === "api" || r.type === "middleware"
  );

  const middleware = allRoutes.find((r) => r.type === "middleware");
  const matchers = middleware?.middlewareMatchers;

  let filtered = allRoutes.filter((r) => r.type !== "middleware");

  if (filterType !== "all" && filterType !== "middleware") {
    filtered = filtered.filter((r) => r.type === filterType);
  }
  if (filterRouter !== "all") {
    filtered = filtered.filter((r) => r.router === filterRouter);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (r) => r.path.toLowerCase().includes(q) || r.filePath.toLowerCase().includes(q)
    );
  }

  filtered.sort((a, b) => a.path.localeCompare(b.path));

  const nodes: Node<RouteNodeData>[] = [];
  const edges: Edge[] = [];

  let protectedRoutes: RouteNode[] = [];
  let unprotectedRoutes: RouteNode[] = [];

  if (middleware && matchers && matchers.length > 0) {
    for (const route of filtered) {
      if (matchesMiddleware(route.path, matchers)) {
        protectedRoutes.push(route);
      } else {
        unprotectedRoutes.push(route);
      }
    }
  } else if (middleware && !matchers) {
    protectedRoutes = filtered;
  } else {
    unprotectedRoutes = filtered;
  }

  if (middleware && protectedRoutes.length > 0) {
    const protectedTrees = buildTree(protectedRoutes);
    for (const t of protectedTrees) calcSpan(t, direction);

    let totalProtectedSpan = 0;
    for (const t of protectedTrees) totalProtectedSpan += t.span;
    totalProtectedSpan += Math.max(0, protectedTrees.length - 1) * CHILD_GAP;

    const mwCenter = totalProtectedSpan / 2;
    const mwId = middleware.id;
    const mwWidth = estimateRouteWidth(middleware);

    if (direction === "TB") {
      nodes.push({
        id: mwId,
        type: "route-node",
        position: { x: mwCenter - NODE_W / 2, y: 0 },
        data: { route: middleware, label: "middleware.ts", isMiddleware: true, direction },
        draggable: true,
      });

      layoutForest(protectedTrees, 0, NODE_H + LEVEL_GAP, direction, mwId, MIDDLEWARE_EDGE, nodes, edges);

      if (unprotectedRoutes.length > 0) {
        const unprotectedTrees = buildTree(unprotectedRoutes);
        for (const t of unprotectedTrees) calcSpan(t, direction);

        const uLabelId = "label:unprotected";
        const ux = totalProtectedSpan + SECTION_GAP;
        let totalUnprotectedSpan = 0;
        for (const t of unprotectedTrees) totalUnprotectedSpan += t.span;
        totalUnprotectedSpan += Math.max(0, unprotectedTrees.length - 1) * CHILD_GAP;
        const uLabelCenter = ux + totalUnprotectedSpan / 2;

        nodes.push({
          id: uLabelId,
          type: "group-label",
          position: { x: uLabelCenter - GROUP_LABEL_W / 2, y: 0 },
          data: { label: "No middleware", route: unprotectedRoutes[0], isUnprotected: true, direction },
          draggable: true,
        });

        layoutForest(unprotectedTrees, ux, GROUP_LABEL_H + LEVEL_GAP, direction, uLabelId, UNPROTECTED_EDGE, nodes, edges);
      }
    } else {
      // LR mode
      nodes.push({
        id: mwId,
        type: "route-node",
        position: { x: 0, y: mwCenter - NODE_H / 2 },
        data: { route: middleware, label: "middleware.ts", isMiddleware: true, direction },
        draggable: true,
      });

      layoutForest(protectedTrees, 0, mwWidth + LEVEL_GAP, direction, mwId, MIDDLEWARE_EDGE, nodes, edges);

      if (unprotectedRoutes.length > 0) {
        const unprotectedTrees = buildTree(unprotectedRoutes);
        for (const t of unprotectedTrees) calcSpan(t, direction);

        const uLabelId = "label:unprotected";
        const uy = totalProtectedSpan + SECTION_GAP;
        let totalUnprotectedSpan = 0;
        for (const t of unprotectedTrees) totalUnprotectedSpan += t.span;
        totalUnprotectedSpan += Math.max(0, unprotectedTrees.length - 1) * CHILD_GAP;
        const uLabelCenter = uy + totalUnprotectedSpan / 2;
        const uLabelWidth = estimateGroupLabelWidth("No middleware");

        nodes.push({
          id: uLabelId,
          type: "group-label",
          position: { x: 0, y: uLabelCenter - GROUP_LABEL_H / 2 },
          data: { label: "No middleware", route: unprotectedRoutes[0], isUnprotected: true, direction },
          draggable: true,
        });

        layoutForest(unprotectedTrees, uy, uLabelWidth + LEVEL_GAP, direction, uLabelId, UNPROTECTED_EDGE, nodes, edges);
      }
    }
  } else {
    const allTrees = buildTree(unprotectedRoutes.length > 0 ? unprotectedRoutes : filtered);
    for (const t of allTrees) calcSpan(t, direction);
    layoutForest(allTrees, 0, 0, direction, null, TREE_EDGE, nodes, edges);
  }

  return { nodes, edges };
}
