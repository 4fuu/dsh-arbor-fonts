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
import { type FontFile } from './font-manifest.js';
/** Reads one font file; injectable so the route tests need no real file. */
export type FontReader = (path: string) => Promise<Uint8Array>;
/** The slice of DSH's Host connection service this package registers on. */
export interface FontRouteConnection {
    readonly fetch: {
        register(route: {
            readonly path: string;
            readonly methods: readonly ('GET' | 'HEAD')[];
            readonly requestBody: 'buffered';
            readonly fetch: (request: Request) => Promise<Response>;
        }): () => Promise<void>;
    };
}
/**
 * Answer one exact route: the file's bytes for GET, its headers for HEAD, 304
 * for a matching If-None-Match, and 404 when called for another path.
 */
export declare function fontResponse(font: FontFile, request: Request, read?: FontReader): Promise<Response>;
/**
 * Register one exact Fetch route per vendored face.
 *
 * The returned disposers are the registry's own; registering through a plugin's
 * context already ties them to its lifetime.
 */
export declare function registerFontRoutes(connection: FontRouteConnection, read?: FontReader): Array<() => Promise<void>>;
