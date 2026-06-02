import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3095);

const types = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
  [".svg", "image/svg+xml"],
  [".pdf", "application/pdf"]
]);

function resolveRequest(url) {
  const cleanUrl = decodeURIComponent(new URL(url, `http://localhost:${port}`).pathname);
  const candidate = path.normalize(path.join(__dirname, cleanUrl === "/" ? "index.html" : cleanUrl));

  if (!candidate.startsWith(__dirname)) {
    return null;
  }

  return candidate;
}

const server = http.createServer((req, res) => {
  const filePath = resolveRequest(req.url || "/");

  if (!filePath) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (statError, stat) => {
    const target = !statError && stat.isDirectory() ? path.join(filePath, "index.html") : filePath;

    fs.readFile(target, (readError, body) => {
      if (readError) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      res.writeHead(200, {
        "Content-Type": types.get(path.extname(target).toLowerCase()) || "application/octet-stream",
        "Cache-Control": "no-store"
      });
      res.end(body);
    });
  });
});

server.listen(port, () => {
  console.log(`Planning visibility pack running at http://localhost:${port}`);
});
