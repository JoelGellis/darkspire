// Runtime-only, content-addressed release. Run the check/build gate before this script.
import {
  readFileSync,
  readdirSync,
  mkdirSync,
  writeFileSync,
  existsSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { deflateRawSync } from "node:zlib";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const files = new Map();
function walk(directory, prefix = "") {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".gitkeep") continue;
    const name = prefix + entry.name;
    if (entry.isDirectory()) walk(path.join(directory, entry.name), name + "/");
    else {
      if (
        !/^(index\.html|assets\/[\w/.-]+\.(?:js|css|png|webp|svg|woff2?|ogg|mp3))$/.test(
          name,
        ) ||
        name.includes("..")
      )
        throw Error(`Unapproved runtime file: ${name}`);
      files.set(name, readFileSync(path.join(directory, entry.name)));
    }
  }
}
walk(path.join(root, "dist"));
if (!files.has("index.html")) throw Error("Build index.html is missing.");
const html = files.get("index.html").toString();
for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  const ref = match[1].replace(/^\.\//, "");
  if (!files.has(ref))
    throw Error(`Missing or nonrelative entry asset: ${ref}`);
}
for (const [name, bytes] of files) {
  if (/\.(?:js|css)$/.test(name)) {
    if (bytes.toString().includes("sourceMappingURL="))
      throw Error(`Source map reference: ${name}`);
    // Reviewed runtime art is referenced from game JS/CSS, relative to the page.
    for (const match of bytes
      .toString()
      .matchAll(/(?:\.\/)?assets\/exported\/[\w/.-]+\.(?:png|webp|svg)/g)) {
      if (!files.has(match[0].replace(/^\.\//, "")))
        throw Error(`Missing game image: ${match[0]}`);
    }
  }
}
files.set(
  "serve.mjs",
  readFileSync(path.join(root, "scripts/serve-release.mjs")),
);
files.set(
  "PLAY.cmd",
  Buffer.from(
    '@echo off\r\ncd /d "%~dp0"\r\nwhere node >nul 2>nul\r\nif not errorlevel 1 (node serve.mjs & exit /b)\r\nif exist "%USERPROFILE%\\tools\\node-portable\\node.exe" ("%USERPROFILE%\\tools\\node-portable\\node.exe" serve.mjs & exit /b)\r\necho Install Node.js 24 or later, then open PLAY.cmd again.\r\npause\r\n',
  ),
);
files.set(
  "PLAY.html",
  Buffer.from(
    '<!doctype html><html lang="en"><meta charset="utf-8"><title>Play Darkspire II</title><body style="font:18px/1.6 system-ui;max-width:700px;margin:4rem auto"><h1>Darkspire II</h1><p>On Windows, open <b>PLAY.cmd</b>. It starts a server on this computer and opens the game. Keep its window open while playing.</p><p>On other systems, run <code>node serve.mjs</code> with Node.js 24 or later.</p><p>The fixed address is <a href="http://127.0.0.1:5190/">http://127.0.0.1:5190/</a>. Save data belongs to that browser and address. Export your save from Help before moving browsers or hosting addresses.</p><p>Static hosting: upload this folder to a separate V2 address. Do not overwrite Darkspire 1.0. No network services, account, or runtime dependencies are required.</p></body></html>',
  ),
);
files.set(".nojekyll", Buffer.from(""));
const entries = [...files]
  .sort(([a], [b]) => a.localeCompare(b, "en"))
  .map(([file, bytes]) => ({ file, bytes: bytes.length, sha256: hash(bytes) }));
const version = JSON.parse(
  readFileSync(path.join(root, "package.json")),
).version;
const build = hash(JSON.stringify(entries)).slice(0, 16);
const name = `darkspire-ii-${version}-${build}`;
files.set(
  "release-manifest.json",
  Buffer.from(
    JSON.stringify(
      {
        schema: 1,
        name,
        version,
        build,
        saveKey: "darkspire-2-campaign-v1",
        deployment: "Separate V2 path; preserve V1",
        files: entries,
      },
      null,
      2,
    ) + "\n",
  ),
);
const output = path.join(root, ".release", name);
mkdirSync(output, { recursive: true });
for (const [name, bytes] of files) {
  const target = path.join(output, name);
  if (existsSync(target) && hash(readFileSync(target)) !== hash(bytes))
    throw Error(`Release collision: ${target}`);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, bytes);
}
function verifyOutput(directory, prefix = "") {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const name = prefix + entry.name;
    if (entry.isDirectory())
      verifyOutput(path.join(directory, entry.name), name + "/");
    else if (!files.has(name))
      throw Error(`Unexpected file in release folder: ${name}`);
  }
}
verifyOutput(output);
// Deterministic ZIP: fixed DOS date, sorted files, no machine paths or timestamps.
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
const chunks = [],
  directory = [];
let offset = 0;
for (const [name, bytes] of [...files].sort(([a], [b]) =>
  a.localeCompare(b, "en"),
)) {
  const filename = Buffer.from(name),
    compressed = deflateRawSync(bytes, { level: 9 });
  const local = Buffer.alloc(30),
    central = Buffer.alloc(46),
    crc = crc32(bytes);
  local.writeUInt32LE(0x04034b50);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(8, 8);
  local.writeUInt16LE(33, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(compressed.length, 18);
  local.writeUInt32LE(bytes.length, 22);
  local.writeUInt16LE(filename.length, 26);
  central.writeUInt32LE(0x02014b50);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(8, 10);
  central.writeUInt16LE(33, 14);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(compressed.length, 20);
  central.writeUInt32LE(bytes.length, 24);
  central.writeUInt16LE(filename.length, 28);
  central.writeUInt32LE(offset, 42);
  chunks.push(local, filename, compressed);
  directory.push(central, filename);
  offset += local.length + filename.length + compressed.length;
}
const end = Buffer.alloc(22),
  centralSize = directory.reduce((n, b) => n + b.length, 0);
end.writeUInt32LE(0x06054b50);
end.writeUInt16LE(files.size, 8);
end.writeUInt16LE(files.size, 10);
end.writeUInt32LE(centralSize, 12);
end.writeUInt32LE(offset, 16);
const zip = Buffer.concat([...chunks, ...directory, end]);
writeFileSync(output + ".zip", zip);
console.log(
  JSON.stringify(
    {
      version,
      build,
      output,
      archive: output + ".zip",
      sha256: hash(zip),
      files: files.size,
    },
    null,
    2,
  ),
);
if (process.env.GITHUB_OUTPUT) {
  const { appendFileSync } = await import("node:fs");
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    `path=${output}\narchive=${output}.zip\n`,
  );
}
