# ffx-to-js

Convert an After Effects `.ffx` file into a JS-escaped binary string, optionally wrapped in an ExtendScript helper to recreate the file.

## CLI

```bash
ffx-to-js <path> [-o <output.js>] [--var <name>] [--file-name <name.ffx>]
        [--resource-folder <path>] [--raw]
```

- Default output: `<input base>.js`
- Default names: inferred from embedded `controlName` when present, otherwise the input name.

### Install / run

```bash
npm install -g ffx-to-js
# or
npx ffx-to-js <path>
# or (local dev)
npm run bin <path>
```

> [!NOTE]
> `bun` can be used instead of `npm`, but npm is the target.

## Library

```ts
import {
  fileToBinaryString,
  fileToFfxScript,
  writeBinaryStringToTxt,
} from "ffx-to-js";

// Returns binary string
const binary = await fileToBinaryString("./preset.ffx");

// Returns full JS code (binary string + script)
const script = await fileToFfxScript("./preset.ffx");

// Saves JS code as file
await writeBinaryStringToTxt("./preset.ffx", "./preset.js");
```

## Credits

This is a modern adaptation of RenderTom's [Convert to Binary AE Script](https://bitbucket.org/rendertom/convert-to-binary/src/master/)
