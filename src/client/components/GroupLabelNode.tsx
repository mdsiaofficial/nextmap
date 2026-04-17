import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { RouteNodeData } from "../lib/layout";

function GroupLabelNode({ data }: NodeProps) {
  const { label, isUnprotected, direction = "TB" } = data as RouteNodeData;

  return (
    <div
      className="font-mono text-sm font-bold px-3 py-1.5 rounded-lg"
      style={{
        background: "var(--color-surface)",
        border: `2px ${isUnprotected ? "dashed" : "solid"} ${isUnprotected ? "var(--color-muted)" : "var(--color-border)"}`,
        color: isUnprotected ? "var(--color-muted)" : "#6366f1",
      }}
    >
      <Handle type="target" position={direction === "LR" ? Position.Left : Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={direction === "LR" ? Position.Right : Position.Bottom} style={{ opacity: 0 }} />
      {label}
    </div>
  );
}

export default memo(GroupLabelNode);
