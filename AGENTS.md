# dsh-arbor-fonts

A DeepSeek Harness (DSH, dsh-v0.2.2-rc.1) client plugin whose only job is the
fonts of the Arbor page that github.com/4fuu/dsh-arbor adds to DSH. The plugin is
one package, `packages/dsh-arbor-fonts`.

## Commands

```sh
.agents/setup   # pinned pnpm and dependencies
pnpm check:pin  # engines.dsh is dsh-v0.2.2-rc.1
pnpm check      # pin check, build, typecheck and tests
pnpm build      # src -> lib/index.js, lib/*.d.ts and client.js
```

`pnpm check` must pass on a clean clone after `.agents/setup`. It builds both
entries first: DSH installs the plugin into a profile's `node_modules`, where
Node refuses to strip types, so the Host entry is built ESM (`lib/index.js`),
its declarations are emitted to `lib/*.d.ts`, and the browser entry is DSH's
module-loader registration (`client.js`). `src/` is the source of truth; the
built files are committed because a profile install does not run a build.

## The contract this plugin relies on

dsh-arbor owns it; this plugin never goes beyond it.

- Every text node on the Arbor page and its session tabs carries
  `data-arbor-text` = `body` | `display` | `numeric` | `code`.
- The Arbor root sets `--arbor-font-body`, `--arbor-font-display`,
  `--arbor-font-numeric` and `--arbor-font-code`, defaulting to DSH's own font
  tokens. A font plugin overrides only these four properties: never class
  names, structure or other styles.

The contract pins only `[data-arbor-text]`; the root marker is dsh-arbor's to
name. This plugin scopes its rules to `[data-arbor-page]` (the root dsh-arbor's
page already carries) and repeats the display/numeric values on the
contract-pinned text nodes, so the fonts do not depend on the root marker.
If dsh-arbor pins a different root marker, update `ROOT_SELECTOR` in
`src/client.ts`.

## Fonts

From github.com/Warren2060/ChillDIN-ChillDINGothic at commit
d5251e66ded29639397025784c72dc2ac12bc817, OFL-1.1. `body` and `code` keep DSH's
fonts; `display` is ChillDIN Gothic (one static weight, 500, full CJK);
`numeric` is ChillDIN (Regular, Medium, SemiBold; Latin and numerals only). No
other fonts. The SIL OFL text and per-file SHA-256 values are in
`packages/dsh-arbor-fonts/fonts/`.

`@font-face` uses `font-display: swap`; display nodes use `font-synthesis: none`
so the single Gothic weight is never synthetically bolded.

## Serving the font files

DSH's client package asset route (`/plugins/<package>/assets/<path>`,
`@deepseek-ai/dsh-client-modules` `lib/index.js`, `PACKAGE_ASSET_MEDIA_TYPES`)
serves only .svg, .png, .webp, .jpg and .jpeg; .woff and .woff2 return 404. The
standard `dsh.client` asset mechanism cannot deliver fonts.
`@deepseek-ai/dsh-client-ui-theme` `lib/styles/brand-font.css` is not a public
font route either: those woff2 files are bundled into the theme's own client
artifact.

The plugin therefore registers four exact Fetch routes through DSH's Host
connection registry (`@deepseek-ai/dsh-client-connection`,
`HostConnectionFetch.register`) — the seam dsh-arbor uses for
`/api/arbor/host`. Each route is content-addressed
(`/api/arbor-fonts/<sha256-prefix>/<file>`), serves `font/woff` or `font/woff2`,
carries the full SHA-256 as its ETag, and sets
`cache-control: public, max-age=31536000, immutable`. `pnpm build` runs
`scripts/write-font-manifest.mjs` first, so replacing a font file and rebuilding
updates its manifest hash; the route tests fail if the manifest and files
disagree.

## Lazy behavior

The stylesheet is injected only after an Arbor root or a `[data-arbor-text]`
node exists. With the plugin installed and no Arbor page present, no style is
appended and no font file is requested; the client bundle itself is still part
of DSH's normal plugin graph. Ordinary DSH pages must never download a font file
from this plugin. Tests in `packages/dsh-arbor-fonts/test/` pin both the route
and this scoping/lazy contract.

## Conventions

- TypeScript, strict, `verbatimModuleSyntax`; relative imports carry `.ts`.
- All code, comments, commits and documents in English. No emoji.
- Ordinary DSH pages must never download a font file from this plugin.
