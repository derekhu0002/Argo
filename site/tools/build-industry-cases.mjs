import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

await build({
  entryPoints: [path.join(siteRoot, "industry-cases-src", "main.tsx")],
  outfile: path.join(siteRoot, "source", "industry-cases", "app.js"),
  bundle: true,
  minify: true,
  sourcemap: false,
  charset: "utf8",
  platform: "browser",
  target: ["es2020"],
  jsx: "automatic",
  legalComments: "none",
  loader: { ".json": "json" },
});
