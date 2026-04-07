import fs from "fs";
import path from "path";
import vm from "vm";
import { createRequire } from "module";
import { fileURLToPath } from "url";

import ts from "typescript";

const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), "..");
const grammarStagesPath = path.join(repoRoot, "src", "data", "grammarStages.ts");
const outputPath = path.join(repoRoot, "_backend", "admin-data", "grammar-order-seed.json");

const source = fs.readFileSync(grammarStagesPath, "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;

const module = { exports: {} };
const sandbox = {
  module,
  exports: module.exports,
  require,
  console,
};

vm.runInNewContext(transpiled, sandbox, { filename: grammarStagesPath });

const { GRAMMAR_STAGE_GROUPS, GRAMMAR_STAGE_META } = module.exports;

if (!GRAMMAR_STAGE_GROUPS || !GRAMMAR_STAGE_META) {
  throw new Error("Failed to load grammar stage metadata from grammarStages.ts");
}

const seed = Object.fromEntries(
  Object.entries(GRAMMAR_STAGE_GROUPS).flatMap(([stage, grammarIds]) => {
    const stageMeta = GRAMMAR_STAGE_META[stage];
    return grammarIds.map((grammarId, lessonOrder) => [
      grammarId,
      {
        grammarId,
        stage,
        stageOrder: stageMeta?.order ?? 0,
        lessonOrder,
      },
    ]);
  }),
);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(seed, null, 2)}\n`, "utf8");

console.log(`Wrote grammar order seed to ${outputPath}`);
