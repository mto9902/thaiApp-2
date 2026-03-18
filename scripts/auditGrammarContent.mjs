import fs from "fs";
import path from "path";
import vm from "vm";
import csv from "csv-parser";
import ts from "typescript";

const ROOT = "C:/Users/Lux/thai-generator/thaiApp-2";
const BACKEND_GRAMMAR_DIR = "C:/Users/Lux/thai-generator/ai-server/grammar";
const THAI_RE = /[\u0E00-\u0E7F]/;

const explanationFlags = [
  /\blearners?\b/i,
  /\bbeginners?\b/i,
  /\bcourse\b/i,
  /\bcurriculum\b/i,
  /\btextbook\b/i,
  /\bgives learners?\b/i,
  /\blets? learners?\b/i,
  /\bfrom the start\b/i,
  /\bapp-level\b/i,
  /\bofficial\b/i,
  /[\u0250-\u02AF]/,
  /^[^`]*[A-Za-z]\([^)]/m,
];

const moduleCache = new Map();

function loadTsModule(filePath) {
  const resolved = path.resolve(filePath);
  if (moduleCache.has(resolved)) {
    return moduleCache.get(resolved).exports;
  }

  const source = fs.readFileSync(resolved, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;

  const module = { exports: {} };
  moduleCache.set(resolved, module);

  function localRequire(specifier) {
    if (specifier.startsWith(".")) {
      const base = path.resolve(path.dirname(resolved), specifier);
      const candidates = [
        base,
        `${base}.ts`,
        `${base}.tsx`,
        path.join(base, "index.ts"),
      ];

      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          return loadTsModule(candidate);
        }
      }
    }

    return require(specifier);
  }

  vm.runInNewContext(
    output,
    {
      module,
      exports: module.exports,
      require: localRequire,
      __dirname: path.dirname(resolved),
      __filename: resolved,
      console,
    },
    { filename: resolved },
  );

  return module.exports;
}

function splitFocusForms(particle) {
  return particle
    .split("/")
    .map((value) => value.trim())
    .filter(Boolean);
}

function makeVariants(form) {
  const cleaned = form.trim();
  const variants = new Set([
    cleaned,
    cleaned.replace(/\.\.\./g, ""),
    cleaned.replace(/\([^)]*\)/g, "").trim(),
    cleaned.replace(/VERB\s*\+\s*/gi, "").trim(),
    cleaned.replace(/NOUN\s*\+\s*/gi, "").trim(),
    cleaned.replace(/PERSON\s*\+\s*/gi, "").trim(),
    cleaned.replace(/CLAUSE\s*\+\s*/gi, "").trim(),
    cleaned.replace(/\+\s*VERB/gi, "").trim(),
    cleaned.replace(/\+\s*EVENT/gi, "").trim(),
    cleaned.replace(/\+\s*NOUN/gi, "").trim(),
  ]);

  return [...variants].filter(Boolean);
}

async function loadCsvRows(filePath) {
  return await new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

async function inferFocusRomanization(point) {
  const csvPath = path.join(BACKEND_GRAMMAR_DIR, `${point.id}.csv`);
  if (!fs.existsSync(csvPath)) {
    return {
      status: "no_csv",
      particle: point.focus.particle,
      romanization: "",
      forms: [],
    };
  }

  const rows = await loadCsvRows(csvPath);
  const forms = splitFocusForms(point.focus.particle);
  const results = [];

  for (const form of forms) {
    if (!THAI_RE.test(form)) {
      results.push("");
      continue;
    }

    const matches = new Set();
    for (const variant of makeVariants(form)) {
      for (const row of rows) {
        let breakdown = [];
        try {
          breakdown = JSON.parse(row.breakdown || "[]");
        } catch {
          breakdown = [];
        }

        for (const item of breakdown) {
          if ((item.thai || "").trim() === variant && item.romanization) {
            matches.add(item.romanization.trim());
          }
        }
      }
    }

    results.push([...matches].join(" | "));
  }

  if (results.every((value) => value && !value.includes("|"))) {
    return {
      status: "ok",
      particle: point.focus.particle,
      romanization: results.join(" / "),
      forms,
    };
  }

  return {
    status: "check",
    particle: point.focus.particle,
    romanization: results.join(" / "),
    forms,
  };
}

async function main() {
  const { grammarPoints } = loadTsModule(
    path.join(ROOT, "src/data/grammar.ts"),
  );

  const explanationIssues = grammarPoints
    .filter((point) =>
      explanationFlags.some((pattern) => pattern.test(point.explanation)),
    )
    .map((point) => ({
      id: point.id,
      stage: point.stage,
      title: point.title,
      explanation: point.explanation,
    }));

  const focusRomanizationIssues = [];
  for (const point of grammarPoints) {
    if (!THAI_RE.test(point.focus.particle) || point.focus.romanization) {
      continue;
    }

    focusRomanizationIssues.push({
      id: point.id,
      stage: point.stage,
      title: point.title,
      ...(await inferFocusRomanization(point)),
    });
  }

  const report = {
    summary: {
      totalPoints: grammarPoints.length,
      explanationIssues: explanationIssues.length,
      focusRomanizationIssues: focusRomanizationIssues.length,
      focusRomanizationResolvedFromCsv: focusRomanizationIssues.filter(
        (issue) => issue.status === "ok",
      ).length,
      focusRomanizationNeedsReview: focusRomanizationIssues.filter(
        (issue) => issue.status === "check",
      ).length,
      focusRomanizationMissingCsv: focusRomanizationIssues.filter(
        (issue) => issue.status === "no_csv",
      ).length,
    },
    explanationIssues,
    focusRomanizationIssues,
  };

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log("Grammar content audit");
  console.log("=====================");
  console.log(`Total grammar points: ${report.summary.totalPoints}`);
  console.log(
    `Explanation issues: ${report.summary.explanationIssues}`,
  );
  console.log(
    `Focus romanization issues: ${report.summary.focusRomanizationIssues}`,
  );
  console.log(
    `  Resolved from CSV: ${report.summary.focusRomanizationResolvedFromCsv}`,
  );
  console.log(
    `  Needs review: ${report.summary.focusRomanizationNeedsReview}`,
  );
  console.log(
    `  Missing CSV: ${report.summary.focusRomanizationMissingCsv}`,
  );

  console.log("\nExplanation issues");
  console.log("------------------");
  for (const issue of explanationIssues) {
    console.log(
      `${issue.stage}\t${issue.id}\t${issue.explanation.replace(/\s+/g, " ")}`,
    );
  }

  console.log("\nFocus romanization issues");
  console.log("------------------------");
  for (const issue of focusRomanizationIssues) {
    console.log(
      `${issue.status.toUpperCase()}\t${issue.stage}\t${issue.id}\t${issue.particle}\t=>\t${issue.romanization}`,
    );
  }
}

await main();
