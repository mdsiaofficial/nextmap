import type { RouteNode } from "../types.js";
import { generateSvg } from "./svg-export.js";

export async function generatePdf(routes: RouteNode[]): Promise<Buffer> {
  const svg = generateSvg(routes);
  const PDFDocument = (await import("pdfkit")).default;
  const SVGtoPDF = (await import("svg-to-pdfkit")).default;

  // Extract width and height to correctly size the PDF page
  const matchW = svg.match(/width="(\d+)"/);
  const matchH = svg.match(/height="(\d+)"/);
  const width = matchW ? parseInt(matchW[1], 10) : 800;
  const height = matchH ? parseInt(matchH[1], 10) : 600;

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: [width, height] });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      SVGtoPDF(doc, svg, 0, 0);
      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}
