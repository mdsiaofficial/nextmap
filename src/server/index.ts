import express from "express";
import { createServer } from "http";
import path from "path";
import net from "net";
import { fileURLToPath } from "url";
import { scanProject } from "./services/scanner.js";
import { createRoutesRouter } from "./routes/routes.js";
import type { AppConfig } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      server.close(() => resolve(startPort));
    });
    server.on("error", () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

export async function startServer(targetDir: string, preferredPort: number) {
  const port = await findAvailablePort(preferredPort);

  const scanResult = scanProject(targetDir);
  const projectName = path.basename(targetDir);

  const pages = scanResult.routes.filter((r) => r.type === "page");
  const apis = scanResult.routes.filter((r) => r.type === "api");

  const config: AppConfig = {
    projectName,
    rootPath: targetDir,
    router: scanResult.router,
    totalRoutes: scanResult.routes.length,
    totalApiRoutes: apis.length,
    totalPages: pages.length,
  };

  const app = express();
  app.use(express.json());

  app.use(createRoutesRouter(scanResult, config));

  // Serve static frontend
  const clientDir = path.join(__dirname, "..", "client");
  app.use(express.static(clientDir));
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(clientDir, "index.html"));
  });

  const server = createServer(app);

  server.listen(port, () => {
    console.log(`\n  🗺️  nextmap is running!\n`);
    console.log(`  Local:   http://localhost:${port}`);
    if (port !== preferredPort) {
      console.log(`  (port ${preferredPort} was in use, using ${port} instead)`);
    }
    console.log(`  Target:  ${targetDir}`);
    console.log(`  Router:  ${scanResult.router}`);
    console.log(`  Pages:   ${pages.length}`);
    console.log(`  APIs:    ${apis.length}`);
    console.log(`  Total:   ${scanResult.routes.length} routes\n`);
  });

  return { server, port };
}
