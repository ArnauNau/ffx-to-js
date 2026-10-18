import { Buffer } from "node:buffer";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type FfxNameInfo = {
  controlName?: string;
  fileBase: string;
  fileName: string;
  varName: string;
};

type FfxScriptOptions = {
  varName?: string;
  fileName?: string;
  resourceFolder?: string;
};

export function bytesToBinaryString(bytes: Uint8Array): string {
  let out = "";
  for (const byte of bytes) {
    if (byte === 0x22) {
      out += '\\"';
      continue;
    }
    if (byte === 0x5c) {
      out += "\\\\";
      continue;
    }
    if (byte === 0x0a) {
      out += "\\n";
      continue;
    }
    if (byte === 0x0d) {
      out += "\\r";
      continue;
    }
    if (byte === 0x09) {
      out += "\\t";
      continue;
    }
    if (byte === 0x08) {
      out += "\\b";
      continue;
    }
    if (byte === 0x0c) {
      out += "\\f";
      continue;
    }
    if (byte >= 0x20 && byte <= 0x7e) {
      out += String.fromCharCode(byte);
      continue;
    }
    if (byte <= 0x1f || byte === 0x7f) {
      out += `\\x${byte.toString(16).padStart(2, "0").toUpperCase()}`;
      continue;
    }
    out += `\\u00${byte.toString(16).padStart(2, "0").toUpperCase()}`;
  }
  return out;
}

export async function fileToBinaryString(filePath: string): Promise<string> {
  const buffer = await readFile(filePath);
  return bytesToBinaryString(new Uint8Array(buffer));
}

export function buildFfxScript(
  binaryString: string,
  options: FfxScriptOptions,
): string {
  const resourceFolder = options.resourceFolder ?? "~/Desktop/";
  const varName = options.varName ?? "resource";
  const fileName = options.fileName ?? "resource.ffx";

  return [
    `var ${varName}_bin = "${binaryString}";`,
    `var ${varName} = createResourceFile("${fileName}", ${varName}_bin);`,
    "",
    "function createResourceFile(fileName, binaryString) {",
    "\tvar resourceFolder, fileObject;",
    "",
    `\tresourceFolder = "${resourceFolder}";`,
    '\tfileObject = new File(resourceFolder + "/" + fileName);',
    "\tif (!File(fileObject).exists) {",
    '\t\tfileObject.encoding = "BINARY";',
    '\t\tfileObject.open("w");',
    "\t\tfileObject.write(binaryString);",
    "\t\tfileObject.close();",
    "\t}",
    "\treturn fileObject;",
    "}",
  ].join("\n");
}

export function inferFfxNames(
  bytes: Uint8Array,
  inputPath?: string,
): FfxNameInfo {
  const controlName = extractControlName(bytes);
  const inputBase = inputPath ? path.basename(inputPath) : "resource.ffx";
  const inputExt = path.extname(inputBase);
  const baseName = inputExt ? inputBase.slice(0, -inputExt.length) : inputBase;

  const fileBase = toLowerCamelCase(controlName ?? baseName);
  const fileName = controlName
    ? `${fileBase}${inputExt || ".ffx"}`
    : inputBase;
  const varName = fileBase.toLowerCase();

  return { controlName, fileBase, fileName, varName };
}

export async function fileToFfxScript(
  inputPath: string,
  options: FfxScriptOptions = {},
): Promise<string> {
  const buffer = await readFile(inputPath);
  const bytes = new Uint8Array(buffer);
  const binary = bytesToBinaryString(bytes);
  const inferred = inferFfxNames(bytes, inputPath);

  return buildFfxScript(binary, {
    varName: options.varName ?? inferred.varName,
    fileName: options.fileName ?? inferred.fileName,
    resourceFolder: options.resourceFolder,
  });
}

export async function writeBinaryStringToFile(
  inputPath: string,
  outputPath?: string,
  options: FfxScriptOptions = {},
): Promise<string> {
  const script = await fileToFfxScript(inputPath, options);
  const resolvedOutputPath = outputPath ?? defaultOutputPathForInput(inputPath);
  await writeFile(resolvedOutputPath, script);
  return resolvedOutputPath;
}

export function defaultOutputPathForInput(inputPath: string): string {
  const dir = path.dirname(inputPath);
  const base = path.basename(inputPath, path.extname(inputPath));
  return path.join(dir, `${base}.js`);
}

function extractControlName(bytes: Uint8Array): string | undefined {
  const text = Buffer.from(bytes).toString("latin1");
  const match = text.match(/\"controlName\"\s*:\s*\"([^\"]+)\"/);
  return match?.[1];
}

function toLowerCamelCase(value: string): string {
  const parts = value
    .split(/[^a-zA-Z0-9]+/)
    .filter((part) => part.length > 0);
  if (parts.length === 0) {
    return "resource";
  }
  const [first = "resource", ...rest] = parts;
  const head = first.toLowerCase();
  const tail = rest
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
  return `${head}${tail}`;
}
