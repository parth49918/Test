const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;

// root is one level up from /server
const ROOT = path.resolve(__dirname, "..");

// Main homepage HTML lives in /main
const MAIN_DIR = path.join(ROOT, "main");

// Folders accessible at the website root
const ALLOWED_PREFIXES = [
  "/css/",
  "/js/",
  "/images/",
  "/header/",
  "/footer/",
  "/Safety/",
  "/Trust/",
  "/Wellness/",
  "/main/" 
];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

function safeResolve(baseDir, urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]).replace(/\\/g, "/");
  const abs = path.resolve(baseDir, "." + clean);

  if (!abs.toLowerCase().startsWith(baseDir.toLowerCase())) return null;
  return abs;
}

function sendFile(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("404 Not Found");
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);

  // Home page
  if (url === "/" || url === "/index.html") {
    return sendFile(path.join(MAIN_DIR, "index.html"), res);
  }

  if (url === "/favicon.ico") {
    res.writeHead(204);
    return res.end();
  }

  // Only serve from allowed prefixes
  const allowed = ALLOWED_PREFIXES.some((p) => url.startsWith(p));
  if (!allowed) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("404 Not Found");
  }

  // Serve everything else from ROOT
  let filePath = safeResolve(ROOT, url);
  if (!filePath) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("403 Forbidden");
  }

  // If folder requested, serve its html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  return sendFile(filePath, res);
});

server.listen(PORT, () => {
  console.log("✅ Project root:", ROOT);
  console.log("✅ Main HTML dir:", MAIN_DIR);
  console.log(`✅ Open: http://localhost:${PORT}`);
});
