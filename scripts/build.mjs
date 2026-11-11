// Build the self-contained custom panel. Installation needs only the resulting integration folder.
import { build } from "../frontend/node_modules/vite/dist/node/index.js";
import ts from "../frontend/node_modules/typescript/lib/typescript.js";
import { createHash } from "node:crypto";
import {
  mkdir,
  readFile,
  writeFile,
  readdir,
  rm,
  copyFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const front = path.join(root, "frontend");
const output = path.join(root, "custom_components/emad_dashboard/frontend");
await mkdir(output, { recursive: true });
for (const name of await readdir(output))
  if (/^emad-dashboard\..*\.(js|js\.gz|js\.br)$/.test(name))
    await rm(path.join(output, name));
const result = await build({
  root: front,
  configFile: false,
  plugins: [
    {
      name: "emad-legacy-lit-decorators",
      enforce: "pre",
      transform(code, id) {
        if (!id.endsWith(".ts") || id.includes("node_modules")) return null;
        return {
          code: ts.transpileModule(code, {
            compilerOptions: {
              target: ts.ScriptTarget.ES2022,
              module: ts.ModuleKind.ESNext,
              experimentalDecorators: true,
              useDefineForClassFields: false,
            },
          }).outputText,
          map: null,
        };
      },
    },
  ],
  build: {
    target: "es2022",
    emptyOutDir: false,
    outDir: output,
    write: false,
    minify: true,
    lib: { entry: path.join(front, "src/index.ts"), formats: ["es"] },
    rolldownOptions: { output: { codeSplitting: false } },
  },
});
const chunks = (Array.isArray(result) ? result : [result]).flatMap(
  (item) => item.output,
);
const entry = chunks.find((item) => item.type === "chunk" && item.isEntry);
if (!entry) throw new Error("No panel entrypoint was generated");
if (chunks.filter((item) => item.type === "chunk").length !== 1)
  throw new Error("The panel must be a single self-contained module");
const bytes = Buffer.from(entry.code);
const hash = createHash("sha256").update(bytes).digest("hex");
const filename = `emad-dashboard.${hash.slice(0, 16)}.js`;
await writeFile(path.join(output, filename), bytes);
const sourceFiles = (await readdir(path.join(front, "src/dashboard"))).filter(
  (name) => name.endsWith(".ts"),
);
const imports = [];
for (const name of sourceFiles) {
  const text = await readFile(path.join(front, "src/dashboard", name), "utf8");
  for (const match of text.matchAll(/(?:from\s*|import\s*)["']([^"']+)["']/g))
    if (match[1].startsWith("../../")) imports.push([name, match[1]]);
}
if (imports.length)
  throw new Error(`Host frontend imports remain: ${JSON.stringify(imports)}`);
// Inspect source decorators, because minification renames the decorator function.
const sourceDirs = [
  path.join(front, "src"),
  path.join(front, "src/platform"),
  path.join(front, "src/dashboard"),
];
const tags = [];
for (const directory of sourceDirs)
  for (const name of await readdir(directory)) {
    if (!name.endsWith(".ts")) continue;
    const code = await readFile(path.join(directory, name), "utf8");
    for (const match of code.matchAll(/@customElement\(\s*["']([^"']+)["']/g))
      tags.push(match[1]);
  }
if (
  tags.some((tag) => !tag.startsWith("emad-")) ||
  new Set(tags).size !== tags.length
)
  throw new Error("Panel elements must be unique and Emad-namespaced");
const bundled = ts.createSourceFile(
  filename,
  entry.code,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.JS,
);
if (
  bundled.statements.some(
    (node) =>
      ts.isImportDeclaration(node) ||
      (ts.isExportDeclaration(node) && node.moduleSpecifier),
  )
)
  throw new Error("The bundle must not depend on external runtime modules");
const catalogSource = await readFile(
  path.join(front, "src/dashboard/device-catalog.ts"),
  "utf8",
);
const catalogCode = ts.transpileModule(catalogSource, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
  },
}).outputText;
const catalog = await import(
  `data:text/javascript;base64,${Buffer.from(catalogCode).toString("base64")}`
);
const manifest = {
  version: JSON.parse(
    await readFile(
      path.join(root, "custom_components/emad_dashboard/manifest.json"),
      "utf8",
    ),
  ).version,
  entrypoint: filename,
  sha256: hash,
  sizeBytes: bytes.length,
  deviceTypes: catalog.DEVICE_CATALOG.length,
  systems: catalog.DEVICE_CATEGORIES.length,
  sourceUiModules: sourceFiles.length,
  customElements: tags.sort(),
  selfContained: true,
};
await writeFile(
  path.join(output, "bundle-manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
await copyFile(path.join(root, "LICENSE"), path.join(output, "LICENSE"));
console.log(JSON.stringify(manifest, null, 2));
