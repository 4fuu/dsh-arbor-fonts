/**
 * The Host half: DSH's exact Fetch registry serves the vendored font files.
 *
 * DSH's package asset route (`/plugins/<package>/assets/<path>` in
 * `@deepseek-ai/dsh-client-modules`) allows only image extensions, so a
 * `dsh.client` package cannot ship a font through it. DSH's own theme ships
 * `brand-font.css` inside `@deepseek-ai/dsh-client-ui-theme` and loads it from
 * that package's client bundle, which is not a public asset mechanism either.
 * The route that does exist for package-owned bytes is the Host connection's
 * exact Fetch registry — `ctx.connection.fetch.register(...)`, the same one
 * dsh-arbor uses for `/api/arbor/host` — so each face gets one exact route
 * under `/api/arbor-fonts/`.
 *
 * Every URL carries the first 16 hex digits of the file's SHA-256. That makes
 * the URL name one exact byte sequence, which is what justifies
 * `cache-control: immutable`; the full digest is the ETag.
 */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FONT_FILES, type FontFile } from './font-manifest.ts'

/** The directory holding the vendored files, next to this package's src/. */
const FONT_DIRECTORY = fileURLToPath(new URL('../fonts/', import.meta.url))

/** One year, in seconds; safe because the URL names the exact bytes. */
const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable'

/** Reads one font file; injectable so the route tests need no real file. */
export type FontReader = (path: string) => Promise<Uint8Array>

/** The slice of DSH's Host connection service this package registers on. */
export interface FontRouteConnection {
  readonly fetch: {
    register(route: {
      readonly path: string
      readonly methods: readonly ('GET' | 'HEAD')[]
      readonly requestBody: 'buffered'
      readonly fetch: (request: Request) => Promise<Response>
    }): () => Promise<void>
  }
}

/** One response's headers, before method-specific additions. */
function fontHeaders(font: FontFile): Record<string, string> {
  return {
    'content-type': font.mediaType,
    'cache-control': IMMUTABLE_CACHE,
    etag: `"${font.sha256}"`,
    'x-content-type-options': 'nosniff',
  }
}

/** Whether an If-None-Match field names this exact entity. */
function matchesEtag(header: string | null, etag: string): boolean {
  if (header === null) return false
  return header.split(',').some((candidate) => candidate.trim() === etag || candidate.trim() === `W/${etag}`)
}

/**
 * Answer one exact route: the file's bytes for GET, its headers for HEAD, 304
 * for a matching If-None-Match, and 404 when called for another path.
 */
export async function fontResponse(
  font: FontFile,
  request: Request,
  read: FontReader = readFile,
): Promise<Response> {
  if (new URL(request.url).pathname !== font.path) {
    return new Response('not found', { status: 404 })
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('method not allowed', { status: 405, headers: { allow: 'GET, HEAD' } })
  }
  const headers = fontHeaders(font)
  if (matchesEtag(request.headers.get('if-none-match'), headers.etag ?? '')) {
    return new Response(null, { status: 304, headers })
  }
  let body: Uint8Array
  try {
    body = await read(join(FONT_DIRECTORY, font.file))
  } catch {
    return new Response('font unavailable', { status: 500 })
  }
  const complete = { ...headers, 'content-length': String(body.byteLength) }
  const bytes = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) as ArrayBuffer
  return new Response(request.method === 'HEAD' ? null : bytes, { status: 200, headers: complete })
}

/**
 * Register one exact Fetch route per vendored face.
 *
 * The returned disposers are the registry's own; registering through a plugin's
 * context already ties them to its lifetime.
 */
export function registerFontRoutes(
  connection: FontRouteConnection,
  read: FontReader = readFile,
): Array<() => Promise<void>> {
  return FONT_FILES.map((font) => connection.fetch.register({
    path: font.path,
    methods: ['GET', 'HEAD'],
    requestBody: 'buffered',
    fetch: (request) => fontResponse(font, request, read),
  }))
}
