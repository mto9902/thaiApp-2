import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const grammarStagesPath = path.join(repoRoot, "src", "data", "grammarStages.ts");
const lessonBlocksPath = path.join(repoRoot, "src", "data", "lessonBlocks.ts");
const grammarCsvDir = path.resolve(repoRoot, "..", "ai-server", "grammar");

function extractStageIds(stageSource, stage) {
  const match = stageSource.match(new RegExp(`"${stage}"\\s*:\\s*\\[(.*?)\\]`, "s"));
  if (!match) {
    return [];
  }

  return [...match[1].matchAll(/"([^"]+)"/g)].map((entry) => entry[1]);
}

function extractLessonBlockIds(lessonBlocksSource) {
  return [...lessonBlocksSource.matchAll(/^\s+"([^"]+)":\s+\{/gm)].map(
    (entry) => entry[1],
  );
}

const grammarStagesSource = fs.readFileSync(grammarStagesPath, "utf8");
const lessonBlocksSource = fs.readFileSync(lessonBlocksPath, "utf8");

const a1Ids = [
  ...extractStageIds(grammarStagesSource, "A1.1"),
  ...extractStageIds(grammarStagesSource, "A1.2"),
];
const lessonBlockIdSet = new Set(extractLessonBlockIds(lessonBlocksSource));

let missingLessonBlocks = 0;
let thinCsvs = 0;

console.log("A1 production readiness");
console.log("=======================");

for (const grammarId of a1Ids) {
  const csvPath = path.join(grammarCsvDir, `${grammarId}.csv`);
  const csvLines = fs.existsSync(csvPath)
    ? fs
        .readFileSync(csvPath, "utf8")
        .split(/\r?\n/)
        .filter((line) => line.trim().length > 0).length
    : 0;
  const hasLessonBlocks = lessonBlockIdSet.has(grammarId);

  if (!hasLessonBlocks) {
    missingLessonBlocks += 1;
  }

  if (csvLines < 13) {
    thinCsvs += 1;
  }

  console.log(
    `${grammarId.padEnd(28)} lessonBlocks=${hasLessonBlocks ? "yes" : "no "} csvLines=${String(csvLines).padStart(2, " ")}`,
  );
}

console.log("");
console.log(`A1 lessons checked: ${a1Ids.length}`);
console.log(`Missing lessonBlocks: ${missingLessonBlocks}`);
console.log(`CSV files under 13 lines: ${thinCsvs}`);
