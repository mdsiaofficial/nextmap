import React, { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import RouteNodeComponent from "./RouteNodeComponent";
import GroupLabelNode from "./GroupLabelNode";
import { useStore } from "../store/map";
import { useThemeStore } from "../hooks/useTheme";
import { buildFlowGraph } from "../lib/layout";
import { Map } from "lucide-react";

const nodeTypes: NodeTypes = {
  "route-node": RouteNodeComponent,
  "group-label": GroupLabelNode,
};

export function RouteMap() {
  const scanResult = useStore((s) => s.scanResult);
  const filterType = useStore((s) => s.filterType);
  const filterRouter = useStore((s) => s.filterRouter);
  const searchQuery = useStore((s) => s.searchQuery);
  const direction = useStore((s) => s.direction);
  const theme = useThemeStore((s) => s.theme);

  const { nodes, edges } = useMemo(() => {
    if (!scanResult) return { nodes: [], edges: [] };
    return buildFlowGraph(scanResult.routes, filterType, filterRouter, searchQuery, direction);
  }, [scanResult, filterType, filterRouter, searchQuery, direction]);

  if (!scanResult) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ color: "var(--color-muted)" }}
      >
        Loading routes...
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ color: "var(--color-muted)" }}
      >
        <div className="text-center">
          <Map size={48} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">No routes match your filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          color={theme === "dark" ? "#2a2d3a" : "#e2e5ea"}
          gap={20}
          size={1}
        />
        <Controls
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
          }}
        />
        <MiniMap
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
          }}
          nodeColor={(node) => {
            const data = node.data as { route?: { type: string } };
            if (data?.route?.type === "api") return "#22c55e";
            if (data?.route?.type === "middleware") return "#f59e0b";
            return "#3b82f6";
          }}
          maskColor={
            theme === "dark" ? "rgba(15,17,23,0.7)" : "rgba(248,249,251,0.7)"
          }
        />
      </ReactFlow>
    </div>
  );
}
