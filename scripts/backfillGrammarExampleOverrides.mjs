import fs from "fs";
import os from "os";
import path from "path";
import ts from "typescript";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APP_ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(APP_ROOT, "src", "data");
const BACKEND_ROOT = path.resolve(APP_ROOT, "..", "ai-server");
const OVERRIDES_FILE = path.join(BACKEND_ROOT, "admin-data", "grammar-overrides.json");
const BACKEND_ENV_FILE = path.join(BACKEND_ROOT, ".env");
const MODEL = process.env.GRAMMAR_EXAMPLE_MODEL || "gpt-4o";
const DEFAULT_BATCH_SIZE = Number.parseInt(
  process.env.LESSON_EXAMPLE_ROMANIZATION_BATCH_SIZE || "10",
  10,
);
const FORBIDDEN_ROMANIZATION_REGEX = /[ʉɯəɤɔɒɕʔŋɲɳʰːɪʊɜɒ]/u;
const LEARNER_ROMANIZATION_REPLACEMENTS = [
  [/ʉ|ɯ/gu, "ue"],
  [/ə|ɤ|ɜ/gu, "oe"],
  [/ɔ|ɒ/gu, "o"],
  [/ŋ/gu, "ng"],
  [/ɕ/gu, "ch"],
  [/ʔ/gu, ""],
  [/ɲ/gu, "ny"],
  [/ɳ/gu, "n"],
  [/ʰ/gu, ""],
  [/ː/gu, ""],
  [/ɪ/gu, "i"],
  [/ʊ/gu, "u"],
];

function parseArgs() {
  const args = process.argv.slice(2);
  const getValue = (flag) => {
    const index = args.indexOf(flag);
    if (index === -1 || index === args.length - 1) {
      return null;
    }
    return args[index + 1];
  };

  const batchSize = Number.parseInt(
    getValue("--batch-size") || String(DEFAULT_BATCH_SIZE),
    10,
  );

  return {
    grammarId: getValue("--grammar"),
    dryRun: args.includes("--dry-run"),
    batchSize: Number.isFinite(batchSize) && batchSize > 0 ? batchSize : DEFAULT_BATCH_SIZE,
  };
}

function parseDotEnvValue(name) {
  if (!fs.existsSync(BACKEND_ENV_FILE)) {
    return null;
  }

  const lines = fs.readFileSync(BACKEND_ENV_FILE, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }
    const key = trimmed.slice(0, separator).trim();
    if (key !== name) {
      continue;
    }
    const value = trimmed.slice(separator + 1).trim();
    return value.replace(/^['"]|['"]$/g, "");
  }
  return null;
}

function getRequiredEnv(name) {
  const value = process.env[name] || parseDotEnvValue(name);
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function normalizePlainString(value, fieldName, { allowEmpty = false } = {}) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!allowEmpty && !trimmed) {
    throw new Error(`${fieldName} is required`);
  }
  return trimmed;
}

function sanitizeRomanizationText(value) {
  let nextValue = typeof value === "string" ? value.trim() : "";
  for (const [pattern, replacement] of LEARNER_ROMANIZATION_REPLACEMENTS) {
    nextValue = nextValue.replace(pattern, replacement);
  }
  return nextValue.replace(/\s+/g, " ").trim();
}

function hasCompleteBreakdownRomanization(example) {
  return Boolean(
    example &&
      Array.isArray(example.breakdown) &&
      example.breakdown.length > 0 &&
      example.breakdown.every(
        (item) => typeof item.romanization === "string" && item.romanization.trim(),
      ),
  );
}

function chunkArray(items, chunkSize) {
  const chunks = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
}

function rewriteImportsToMjs(source) {
  return source.replace(
    /(from\s+["'])(\.\/[^"']+)(["'])/g,
    (_match, prefix, specifier, suffix) => `${prefix}${specifier}.mjs${suffix}`,
  );
}

async function loadGrammarPoints() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "keystone-grammar-"));
  const files = ["grammar.ts", "grammarB2.ts", "grammarStages.ts", "grammarLevels.ts"];

  for (const fileName of files) {
    const sourcePath = path.join(DATA_DIR, fileName);
    const source = fs.readFileSync(sourcePath, "utf8");
    const transpiled = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ES2022,
        target: ts.ScriptTarget.ES2022,
      },
      fileName,
    }).outputText;

    fs.writeFileSync(
      path.join(tempDir, fileName.replace(/\.ts$/, ".mjs")),
      rewriteImportsToMjs(transpiled),
      "utf8",
    );
  }

  const moduleUrl = pathToFileURL(path.join(tempDir, "grammar.mjs")).href;
  const mod = await import(moduleUrl);
  return mod.grammarPoints;
}

function readOverrides() {
  if (!fs.existsSync(OVERRIDES_FILE)) {
    return {};
  }
  const raw = fs.readFileSync(OVERRIDES_FILE, "utf8");
  const parsed = JSON.parse(raw);
  return parsed && typeof parsed === "object" ? parsed : {};
}

function writeOverrides(overrides) {
  fs.mkdirSync(path.dirname(OVERRIDES_FILE), { recursive: true });
  fs.writeFileSync(OVERRIDES_FILE, JSON.stringify(overrides, null, 2), "utf8");
}

function buildPrompt(batch) {
  const payload = batch.map((point) => ({
    id: point.id,
    title: point.title,
    pattern: point.pattern,
    example: {
      thai: point.example.thai,
      roman: point.example.roman,
      english: point.example.english,
      breakdown: point.example.breakdown.map((item) => ({
        thai: item.thai,
        english: item.english,
        tone: item.tone,
        grammar: item.grammar === true,
      })),
    },
  }));

  return `
You are repairing chunk-by-chunk Thai learner romanization for lesson examples in a grammar app.

Task
- For every grammar point below, add learner-friendly romanization to every breakdown item.
- Keep id, title, pattern, sentence, and breakdown Thai chunks EXACTLY as given.
- Keep the breakdown order EXACTLY as given.
- Do not change English glosses, tone labels, or grammar flags.
- Do not split mechanically from the full sentence romanization. Romanize each breakdown chunk as its own exact chunk.
- If a chunk contains multiple Thai words, provide a single chunk romanization for that entire chunk.
- Use ordinary Latin learner spelling with accents when natural.
- Never use IPA or specialist symbols such as ʉ, ə, ɔ, ŋ, or ʔ.

Return ONLY valid JSON in this exact shape:
{
  "examples": [
    {
      "id": "",
      "breakdown": [
        {
          "thai": "",
          "romanization": ""
        }
      ]
    }
  ]
}

Lesson examples to repair
${JSON.stringify(payload, null, 2)}
`;
}

async function callOpenAIJson(apiKey, prompt, label) {
  let attempt = 0;
  let lastError = null;

  while (attempt < 5) {
    attempt += 1;
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You repair Thai chunk romanization for a grammar app. Return strict JSON only and do not change the source text.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (
          (response.status === 429 || response.status >= 500) &&
          attempt < 5
        ) {
          const delayMs = 1500 * attempt;
          console.log(`${label}: retrying after ${delayMs}ms (${attempt}/5)`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
        throw new Error(`OpenAI request failed (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("OpenAI returned an empty response");
      }

      return JSON.parse(content.replace(/```json|```/g, "").trim());
    } catch (err) {
      lastError = err;
      const retryable = /rate limit|quota|temporar|timeout|overloaded/i.test(
        String(err?.message ?? ""),
      );
      if (!retryable || attempt >= 5) {
        throw err;
      }
      const delayMs = 1500 * attempt;
      console.log(`${label}: retrying after ${delayMs}ms (${attempt}/5)`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

function mergeBreakdownRomanization(batch, parsed) {
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.examples)) {
    throw new Error("Model response did not include an examples array");
  }

  const candidateById = new Map();
  for (const candidate of parsed.examples) {
    const id = normalizePlainString(candidate.id, "Candidate id");
    if (candidateById.has(id)) {
      throw new Error(`Duplicate candidate for ${id}`);
    }
    candidateById.set(id, candidate);
  }

  return batch.map((point) => {
    const candidate = candidateById.get(point.id);
    if (!candidate) {
      throw new Error(`Model omitted ${point.id}`);
    }
    if (
      !Array.isArray(candidate.breakdown) ||
      candidate.breakdown.length !== point.example.breakdown.length
    ) {
      throw new Error(`Model returned mismatched breakdown length for ${point.id}`);
    }

    const mergedBreakdown = point.example.breakdown.map((item, index) => {
      const candidateItem = candidate.breakdown[index];
      const candidateThai = normalizePlainString(
        candidateItem?.thai,
        `${point.id} breakdown ${index + 1} Thai`,
      );
      if (candidateThai !== item.thai) {
        throw new Error(`Model changed breakdown Thai for ${point.id}`);
      }

      const romanization = sanitizeRomanizationText(
        normalizePlainString(
          candidateItem?.romanization,
          `${point.id} breakdown ${index + 1} romanization`,
        ),
      );
      if (FORBIDDEN_ROMANIZATION_REGEX.test(romanization)) {
        throw new Error(`Model returned IPA-like romanization for ${point.id}`);
      }

      return {
        ...item,
        romanization,
      };
    });

    return {
      id: point.id,
      example: {
        ...point.example,
        breakdown: mergedBreakdown,
      },
    };
  });
}

async function main() {
  const { grammarId, dryRun, batchSize } = parseArgs();
  const apiKey = getRequiredEnv("OPENAI_API_KEY");
  const grammarPoints = await loadGrammarPoints();
  const overrides = readOverrides();

  const sourcePoints = grammarPoints
    .filter((point) => !grammarId || point.id === grammarId)
    .map((point) => {
      const overrideExample =
        overrides[point.id] &&
        typeof overrides[point.id] === "object" &&
        overrides[point.id].example &&
        typeof overrides[point.id].example === "object"
          ? overrides[point.id].example
          : null;

      return {
        ...point,
        example: overrideExample ?? point.example,
      };
    })
    .filter((point) => !hasCompleteBreakdownRomanization(point.example));

  if (sourcePoints.length === 0) {
    console.log("No lesson examples need romanization backfill");
    return;
  }

  const summary = [];
  for (const batch of chunkArray(sourcePoints, batchSize)) {
    const prompt = buildPrompt(batch);
    let repairedBatch = null;
    let lastError = null;

    for (let attempt = 1; attempt <= 4; attempt += 1) {
      try {
        const parsed = await callOpenAIJson(apiKey, prompt, `lesson batch ${batch[0].id}`);
        repairedBatch = mergeBreakdownRomanization(batch, parsed);
        break;
      } catch (err) {
        lastError = err;
        if (attempt >= 4) {
          throw err;
        }
        console.log(
          `lesson batch ${batch[0].id}: retrying invalid output (${attempt}/4): ${err.message}`,
        );
      }
    }

    for (const repaired of repairedBatch ?? []) {
      const existing = overrides[repaired.id];
      overrides[repaired.id] = {
        ...(existing && typeof existing === "object" ? existing : {}),
        example: repaired.example,
      };
      summary.push({
        id: repaired.id,
        breakdownCount: repaired.example.breakdown.length,
      });
    }

    if (!dryRun) {
      writeOverrides(overrides);
    }
  }

  console.log(
    `${dryRun ? "Validated" : "Wrote"} ${summary.length} lesson example override updates`,
  );
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error("Failed to backfill grammar example overrides:", err);
  process.exitCode = 1;
});
