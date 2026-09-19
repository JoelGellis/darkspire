import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.DARKSPIRE_PORT || 5190);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".json": "application/json",
};
const server = createServer(async (request, response) => {
  try {
    if (!["GET", "HEAD"].includes(request.method)) {
      response.writeHead(405);
      response.end();
      return;
    }
    const url = new URL(request.url, `http://127.0.0.1:${port}`);
    const relative =
      decodeURIComponent(url.pathname).replace(/^\/+/, "") || "index.html";
    const target = path.resolve(root, relative);
    if (
      !target.startsWith(root + path.sep) ||
      relative.split(/[\\/]/).some((p) => p.startsWith("."))
    )
      throw Error("Forbidden path");
    if (!types[path.extname(target)] || !(await stat(target)).isFile())
      throw Error("Not found");
    const bytes = await readFile(target);
    response.writeHead(200, {
      "Content-Type": types[path.extname(target)],
      "Content-Length": bytes.length,
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(request.method === "HEAD" ? undefined : bytes);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});
server.on("error", (error) => {
  console.error(
    error.code === "EADDRINUSE"
      ? `Port ${port} is already in use. Close the older game server and retry. Changing the port uses separate browser saves.`
      : error.message,
  );
  process.exitCode = 1;
});
server.listen(port, "127.0.0.1", () => {
  const url = `http://127.0.0.1:${port}/`;
  console.log(
    `Darkspire II: ${url}\nKeep this window open while playing. Press Ctrl+C to stop.`,
  );
  if (process.env.DARKSPIRE_NO_OPEN !== "1") {
    const command =
      process.platform === "win32"
        ? "rundll32.exe"
        : process.platform === "darwin"
          ? "open"
          : "xdg-open";
    const args =
      process.platform === "win32"
        ? ["url.dll,FileProtocolHandler", url]
        : [url];
    const browser = spawn(command, args, {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    });
    browser.on("error", () => console.log(`Open ${url} in your browser.`));
    browser.unref();
  }
});
