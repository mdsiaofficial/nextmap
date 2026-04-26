import fs from "fs";
import path from "path";
import { Router } from "express";
import type { ScanResult, AppConfig } from "../types.js";
import { generateSvg } from "../services/svg-export.js";
import { generatePng } from "../services/png-export.js";
import { generatePdf } from "../services/pdf-export.js";

export function createRoutesRouter(scanResult: ScanResult, config: AppConfig): Router {
  const router = Router();

  router.get("/api/config", (_req, res) => {
    res.json(config);
  });

  router.get("/api/routes", (_req, res) => {
    res.json(scanResult);
  });

  router.get("/api/export/svg", (_req, res) => {
    const svg = generateSvg(scanResult.routes);
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Content-Disposition", "attachment; filename=nextmap.svg");
    res.send(svg);
  });

  router.get("/api/export/png", async (_req, res) => {
    try {
      const pngBuffer = await generatePng(scanResult.routes);
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Content-Disposition", "attachment; filename=nextmap.png");
      res.send(pngBuffer);
    } catch (e) {
      console.error(e);
      res.status(500).send("Error generating PNG");
    }
  });

  router.get("/api/export/pdf", async (_req, res) => {
    try {
      const pdfBuffer = await generatePdf(scanResult.routes);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=nextmap.pdf");
      res.send(pdfBuffer);
    } catch (e) {
      console.error(e);
      res.status(500).send("Error generating PDF");
    }
  });

  router.get("/api/source", (req, res) => {
    const { file } = req.query;
    if (!file || typeof file !== "string") {
      res.status(400).json({ error: "file query parameter required" });
      return;
    }

    const rootPath = path.resolve(config.rootPath);
    const fullPath = path.resolve(rootPath, file);

    // Prevent directory traversal
    if (!fullPath.startsWith(rootPath + path.sep) && fullPath !== rootPath) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    try {
      const content = fs.readFileSync(fullPath, "utf-8");
      res.json({ content, file });
    } catch {
      res.status(404).json({ error: "File not found" });
    }
  });

  return router;
}
