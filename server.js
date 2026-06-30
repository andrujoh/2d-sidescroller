const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT) || 8787;
const levelPath = path.join(root, "level.json");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".css": "text/css; charset=utf-8",
};

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const isLevelApi =
    url.pathname === "/api/level" || url.pathname === "/api/level/" || url.pathname === "/api/level.json";

  if (isLevelApi && request.method === "OPTIONS") {
    sendOptions(response);
    return;
  }

  if (isLevelApi && request.method === "GET") {
    sendLevel(response);
    return;
  }

  if (isLevelApi && (request.method === "POST" || request.method === "PUT")) {
    saveLevel(request, response);
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    sendJson(response, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  serveStatic(url.pathname, response, request.method === "HEAD");
});

function sendLevel(response) {
  fs.readFile(levelPath, "utf8", (error, data) => {
    if (error) {
      const defaultLevelPath = path.join(root, "spritedemo.html");

      fs.readFile(defaultLevelPath, "utf8", (htmlError, html) => {
        if (htmlError) {
          sendJson(response, 404, { ok: false, error: "level.json not found" });
          return;
        }

        const defaultLevel = extractDefaultLevel(html);

        if (!defaultLevel) {
          sendJson(response, 404, { ok: false, error: "level.json not found" });
          return;
        }

        sendJson(response, 200, {
          version: 1,
          savedAt: null,
          level: defaultLevel,
          template: {
            visible: false,
            x: 0,
            y: 0,
            scale: 2.25,
            opacity: 0.45,
          },
        });
      });
      return;
    }

    response.writeHead(200, withCors({ "Content-Type": "application/json; charset=utf-8" }));
    response.end(data);
  });
}

function extractDefaultLevel(html) {
  const match = html.match(/const level = ([\s\S]*?);\n\s*const LEVEL_STORAGE_KEY/);
  if (!match) return null;

  try {
    return Function("WORLD_TILE_SIZE", `return (${match[1]});`)(48);
  } catch (error) {
    return null;
  }
}

function saveLevel(request, response) {
  let body = "";

  request.setEncoding("utf8");
  request.on("data", chunk => {
    body += chunk;

    if (body.length > 2_000_000) {
      request.destroy();
    }
  });
  request.on("end", () => {
    try {
      const parsed = JSON.parse(body);
      const json = `${JSON.stringify(parsed, null, 2)}\n`;

      fs.writeFile(levelPath, json, "utf8", error => {
        if (error) {
          sendJson(response, 500, { ok: false, error: "Could not write level.json" });
          return;
        }

        sendJson(response, 200, { ok: true, file: "level.json" });
      });
    } catch (error) {
      sendJson(response, 400, { ok: false, error: "Invalid JSON" });
    }
  });
}

function serveStatic(urlPath, response, headOnly) {
  const decodedPath = decodeURIComponent(urlPath === "/" ? "/spritedemo.html" : urlPath);
  const requestedPath = path.normalize(path.join(root, decodedPath));

  if (!requestedPath.startsWith(root)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  fs.readFile(requestedPath, (error, data) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    response.writeHead(200, { "Content-Type": getMimeType(requestedPath) });

    if (headOnly) {
      response.end();
      return;
    }

    response.end(data);
  });
}

function getMimeType(filePath) {
  return mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, withCors({ "Content-Type": "application/json; charset=utf-8" }));
  response.end(JSON.stringify(data));
}

function sendOptions(response) {
  response.writeHead(204, withCors());
  response.end();
}

function withCors(headers = {}) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    ...headers,
  };
}

server.listen(port, () => {
  console.log(`Sprite demo server: http://localhost:${port}/spritedemo.html`);
  console.log(`Editor saves write to: ${levelPath}`);
});
