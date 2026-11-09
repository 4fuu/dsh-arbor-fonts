// src/routes.ts
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// src/font-manifest.ts
var FONT_FILES = [
  {
    "file": "ChillDIN-Regular.woff",
    "family": "Arbor ChillDIN",
    "weight": 400,
    "format": "woff",
    "mediaType": "font/woff",
    "sha256": "e7652f7cd2b8008bf6e1ddd9aace5e9b42cc5e1afdb135d3db3399c8d314674d",
    "path": "/api/arbor-fonts/e7652f7cd2b8008b/ChillDIN-Regular.woff",
    "url": "api/arbor-fonts/e7652f7cd2b8008b/ChillDIN-Regular.woff"
  },
  {
    "file": "ChillDIN-Medium.woff",
    "family": "Arbor ChillDIN",
    "weight": 500,
    "format": "woff",
    "mediaType": "font/woff",
    "sha256": "ff9d00e8cfff20b8eb45b5bdab0a12e2be037b0c91395a9ebf0f830786939047",
    "path": "/api/arbor-fonts/ff9d00e8cfff20b8/ChillDIN-Medium.woff",
    "url": "api/arbor-fonts/ff9d00e8cfff20b8/ChillDIN-Medium.woff"
  },
  {
    "file": "ChillDIN-SemiBold.woff",
    "family": "Arbor ChillDIN",
    "weight": 600,
    "format": "woff",
    "mediaType": "font/woff",
    "sha256": "f542334ce887b2b731f0b5d0c4743ae16df1391d62db6cacc944a7c225900edf",
    "path": "/api/arbor-fonts/f542334ce887b2b7/ChillDIN-SemiBold.woff",
    "url": "api/arbor-fonts/f542334ce887b2b7/ChillDIN-SemiBold.woff"
  },
  {
    "file": "ChillDINGothic_Std.woff2",
    "family": "Arbor ChillDIN Gothic",
    "weight": 500,
    "format": "woff2",
    "mediaType": "font/woff2",
    "sha256": "184fc96d68dc2bbf5a8e8d0ebfbf978b03f356827d582242fde9358ae88fad9e",
    "path": "/api/arbor-fonts/184fc96d68dc2bbf/ChillDINGothic_Std.woff2",
    "url": "api/arbor-fonts/184fc96d68dc2bbf/ChillDINGothic_Std.woff2"
  }
];

// src/routes.ts
var FONT_DIRECTORY = fileURLToPath(new URL("../fonts/", import.meta.url));
var IMMUTABLE_CACHE = "public, max-age=31536000, immutable";
function fontHeaders(font) {
  return {
    "content-type": font.mediaType,
    "cache-control": IMMUTABLE_CACHE,
    etag: `"${font.sha256}"`,
    "x-content-type-options": "nosniff"
  };
}
function matchesEtag(header, etag) {
  if (header === null) return false;
  return header.split(",").some((candidate) => candidate.trim() === etag || candidate.trim() === `W/${etag}`);
}
async function fontResponse(font, request, read = readFile) {
  if (new URL(request.url).pathname !== font.path) {
    return new Response("not found", { status: 404 });
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("method not allowed", { status: 405, headers: { allow: "GET, HEAD" } });
  }
  const headers = fontHeaders(font);
  if (matchesEtag(request.headers.get("if-none-match"), headers.etag ?? "")) {
    return new Response(null, { status: 304, headers });
  }
  let body;
  try {
    body = await read(join(FONT_DIRECTORY, font.file));
  } catch {
    return new Response("font unavailable", { status: 500 });
  }
  const complete = { ...headers, "content-length": String(body.byteLength) };
  const bytes = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength);
  return new Response(request.method === "HEAD" ? null : bytes, { status: 200, headers: complete });
}
function registerFontRoutes(connection, read = readFile) {
  return FONT_FILES.map((font) => connection.fetch.register({
    path: font.path,
    methods: ["GET", "HEAD"],
    requestBody: "buffered",
    fetch: (request) => fontResponse(font, request, read)
  }));
}

// src/index.ts
var name = "dsh-arbor-fonts";
var inject = ["connection"];
function apply(ctx) {
  registerFontRoutes(ctx.connection);
}
export {
  apply,
  inject,
  name
};
