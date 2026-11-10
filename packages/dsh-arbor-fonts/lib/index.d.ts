/**
 * `@4fu/dsh-arbor-fonts` — the Host half.
 *
 * The package's only Host work is serving its four vendored font files. The
 * browser half (`./client.js`, built from `src/client.ts`) installs the
 * stylesheet when, and only when, an Arbor root or a `[data-arbor-text]` node
 * appears. This half registers the exact Fetch routes the stylesheet addresses.
 *
 * Why this route, and not the package asset route: `@deepseek-ai/dsh-client-modules`
 * `lib/index.js` maps only .svg/.png/.webp/.jpg/.jpeg in
 * `PACKAGE_ASSET_MEDIA_TYPES`, so `/plugins/<package>/assets/<font>.woff2`
 * answers 404. `@deepseek-ai/dsh-client-ui-theme` is not a precedent for fonts:
 * its `lib/styles/brand-font.css` is bundled into the theme's own client
 * artifact and its woff2 files are served by the same image-only route. The
 * supported seam for package-owned, browser-fetched bytes is the Host
 * connection's exact Fetch registry (`@deepseek-ai/dsh-client-connection`,
 * `HostConnectionFetch.register`) — the route dsh-arbor uses for
 * `/api/arbor/host`.
 *
 * On a profile with no browser connection (headless, acp, sdk) `inject` keeps
 * this plugin inactive, so no route exists and nothing changes.
 */
import type { FontRouteConnection } from './routes.js';
/** The package name, also the browser module id. */
export declare const name = "dsh-arbor-fonts";
/** The Host service the exact Fetch routes live on. */
export declare const inject: string[];
/** The slice of the Host context this plugin reads. */
export interface HostContext {
    readonly connection: FontRouteConnection;
}
/**
 * Register one exact route per vendored face. Registration is tied to the
 * plugin's context through DSH's registry; there is no other Host behavior.
 */
export declare function apply(ctx: HostContext): void;
