import React from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { Header } from "./components/Header";
import { FilterBar } from "./components/FilterBar";
import { RouteMap } from "./components/RouteMap";
import { DetailPanel } from "./components/DetailPanel";
import { useInitialize } from "./hooks/useInitialize";
import { useTheme } from "./hooks/useTheme";

export default function App() {
  useInitialize();
  useTheme();

  return (
    <ReactFlowProvider>
      <div className="h-screen flex flex-col">
        <Header />
        <FilterBar />
        <div className="flex-1 flex overflow-hidden">
          <RouteMap />
          <DetailPanel />
        </div>
      </div>
    </ReactFlowProvider>
  );
}
