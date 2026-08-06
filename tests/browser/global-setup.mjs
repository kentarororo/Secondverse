import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";

const host = "127.0.0.1";
const port = 4173;
const projectBase = "/Secondverse/";
const distRoot = resolve(process.cwd(), "dist");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

function safeDistPath(url) {
  const pathname = new URL(url, `http://${host}:${port}`).pathname;
  if (!pathname.startsWith(projectBase)) return null;
  const relativePath = decodeURIComponent(pathname.slice(projectBase.length));
  const requestedPath = resolve(distRoot, relativePath || "index.html");
  return requestedPath === distRoot || requestedPath.startsWith(`${distRoot}${sep}`)
    ? requestedPath
    : null;
}

export default async function globalSetup() {
  const server = createServer(async (request, response) => {
    const requestedPath = safeDistPath(request.url ?? projectBase);
    if (!requestedPath) {
      response.writeHead(404).end("Not found");
      return;
    }

    let filePath = requestedPath;
    try {
      const info = await stat(filePath);
      if (info.isDirectory()) filePath = resolve(filePath, "index.html");
    } catch {
      // Browser navigation uses the built index as its fallback; missing assets remain 404.
      if (extname(filePath)) {
        response.writeHead(404).end("Not found");
        return;
      }
      filePath = resolve(distRoot, "index.html");
    }

    response.setHeader(
      "Content-Type",
      contentTypes[extname(filePath)] ?? "application/octet-stream",
    );
    createReadStream(filePath)
      .on("error", () => response.writeHead(500).end("Read failed"))
      .pipe(response);
  });

  await new Promise((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(port, host, resolveListen);
  });

  return async () => {
    await new Promise((resolveClose, rejectClose) => {
      server.close((error) => (error ? rejectClose(error) : resolveClose()));
    });
  };
}
