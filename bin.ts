#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import {
  defaultOutputPathForInput,
  fileToBinaryString,
  writeBinaryStringToFile,
} from "./index.js";

const args = process.argv.slice(2);
const inputPath = args[0];

if (!inputPath || inputPath === "-h" || inputPath === "--help") {
  console.log(
    [
      "Usage:",
      "  bun run bin <path> [-o <output.js>] [--var <name>] [--file-name <name.ffx>]",
      "              [--resource-folder <path>] [--raw]",
      "",
      "Defaults:",
      "  output -> <input base>.js in the same directory",
      "  var name -> derived from embedded controlName or input file name",
      "  file name -> derived from embedded controlName or input file name",
    ].join("\n"),
  );
  process.exit(inputPath ? 0 : 1);
}

let outputPath: string | undefined;
let varName: string | undefined;
let fileName: string | undefined;
let resourceFolder: string | undefined;
let raw = false;
for (let i = 1; i < args.length; i++) {
  const arg = args[i];
  if (arg === "-o" || arg === "--out") {
    outputPath = args[i + 1];
    i++;
    continue;
  }
  if (arg === "--var") {
    varName = args[i + 1];
    i++;
    continue;
  }
  if (arg === "--file-name") {
    fileName = args[i + 1];
    i++;
    continue;
  }
  if (arg === "--resource-folder") {
    resourceFolder = args[i + 1];
    i++;
    continue;
  }
  if (arg === "--raw") {
    raw = true;
  }
}

const resolvedOutput = outputPath ?? defaultOutputPathForInput(inputPath);

const run = async () => {
  if (raw) {
    const binary = await fileToBinaryString(inputPath);
    await writeFile(resolvedOutput, binary);
    console.log(`Wrote binary string to ${resolvedOutput}`);
    return;
  }

  const writtenPath = await writeBinaryStringToFile(inputPath, resolvedOutput, {
    varName,
    fileName,
    resourceFolder,
  });
  console.log(`Wrote binary script to ${writtenPath}`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
