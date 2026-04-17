import { useEffect } from "react";
import { fetchConfig, fetchRoutes } from "../lib/api";
import { useStore } from "../store/map";

export function useInitialize() {
  const setConfig = useStore((s) => s.setConfig);
  const setScanResult = useStore((s) => s.setScanResult);

  useEffect(() => {
    Promise.all([fetchConfig(), fetchRoutes()]).then(([config, routes]) => {
      setConfig(config);
      setScanResult(routes);
    });
  }, [setConfig, setScanResult]);
}
