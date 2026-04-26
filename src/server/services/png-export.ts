import type { RouteNode } from "../types.js";
import { generateSvg } from "./svg-export.js";

export async function generatePng(routes: RouteNode[]): Promise<Buffer> {
  const svg = generateSvg(routes);
  const sharp = (await import("sharp")).default;
  return sharp(Buffer.from(svg)).png().toBuffer();
}
