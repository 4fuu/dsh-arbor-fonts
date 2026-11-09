# dsh-arbor-fonts

A DeepSeek Harness client plugin that sets the fonts of the Arbor page from
[dsh-arbor](https://github.com/4fuu/dsh-arbor): ChillDIN Gothic for display text
and ChillDIN for numerals. Body and code keep DSH's own fonts.

DSH is pinned to the same versions dsh-arbor pins (`0.2.2-rc.1`). The plugin is
one package under `packages/dsh-arbor-fonts`.

## The contract it relies on

dsh-arbor owns this; the plugin never goes beyond it.

- Every text node on the Arbor page and its session tabs carries
  `data-arbor-text="body" | "display" | "numeric" | "code"`.
- The Arbor root sets `--arbor-font-body`, `--arbor-font-display`,
  `--arbor-font-numeric` and `--arbor-font-code`, defaulting to DSH's font
  tokens.

The plugin overrides only `--arbor-font-display` and `--arbor-font-numeric`,
and only on `[data-arbor-page]` and `[data-arbor-text]` nodes. It never changes
class names, structure, body text, code text or another style.

## Fonts

From [Warren2060/ChillDIN-ChillDINGothic](https://github.com/Warren2060/ChillDIN-ChillDINGothic)
at commit `d5251e66ded29639397025784c72dc2ac12bc817`, SIL Open Font License
1.1. Files, hashes and attribution are in `packages/dsh-arbor-fonts/fonts/`.

- `display`: "Arbor ChillDIN Gothic", a full-CJK static face at weight 500,
  falling back to the Arbor body token.
- `numeric`: "Arbor ChillDIN" at weights 400, 500 and 600, Latin and numerals
  only, with the same fallback.
- `body` and `code`: untouched.
- `font-display: swap` on every face; `font-synthesis: none` on display nodes so
  the single Gothic weight is never synthetically bolded.

There are no other fonts, and Smiley Sans / 得意黑 is not used.

## Lazy loading

The client plugin installs a `MutationObserver` and appends its stylesheet only
once an Arbor root or any `[data-arbor-text]` node exists. Browsers request a
`@font-face` file only when a matching family is used, so a DSH page with no
Arbor UI makes no request to `/api/arbor-fonts/` and gets no injected style. The
plugin's client bundle itself still loads as part of the ordinary DSH plugin
graph; that is DSH's module loading, not a font download.

## Serving the files

DSH's package asset route (`/plugins/<package>/assets/<path>` in
`@deepseek-ai/dsh-client-modules`, `PACKAGE_ASSET_MEDIA_TYPES`) serves only
`.svg`, `.png`, `.webp`, `.jpg` and `.jpeg`; `.woff`/`.woff2` answer 404.
`@deepseek-ai/dsh-client-ui-theme`'s `lib/styles/brand-font.css` is not a
public font route either: its woff2 files are bundled into the theme's own
client artifact.

This plugin uses DSH's Host connection exact Fetch registry
(`@deepseek-ai/dsh-client-connection`, `HostConnectionFetch.register`) — the
same seam dsh-arbor uses for `/api/arbor/host`. It registers four exact routes
under `/api/arbor-fonts/`, one per face, with:

- `font/woff` or `font/woff2` content type;
- `cache-control: public, max-age=31536000, immutable`;
- the full SHA-256 of the file as its ETag, and `304` handling;
- the first 16 hex digits of that SHA-256 in the URL, so a URL names one exact
  byte sequence and the immutable cache is honest.

On a profile with no browser connection (headless, acp, sdk) the Host plugin
declares `inject = ['connection']`, stays inactive, and registers no route.

## Commands

```sh
.agents/setup   # pinned pnpm and dependencies
pnpm check      # build both halves, typecheck, run the tests
pnpm build      # regenerate lib/index.js and client.js
```

`pnpm check` passes on a clean clone after `.agents/setup`. The tests cover the
four routes (bytes, content types, caching, ETag/304, HEAD, refusals), the
content-addressed manifest, the scoping/lazy CSS contract, and the built Host
and browser entries.

## Install in a DSH web profile

```sh
dsh plugin --profile web add file:/absolute/path/to/packages/dsh-arbor-fonts
```

Then insert the Host row into the profile's `cordis.patch.yml`:

```yaml
- insert:
    - id: arbor-fonts
      name: '@4fu/dsh-arbor-fonts'
```

The package ships `lib/index.js` (the Host entry) and `client.js` (the browser
entry), so a profile does not run a build. `src/index.ts`, `src/client.ts`,
`src/routes.ts` and `src/font-manifest.ts` are the sources; `pnpm build` writes
the two entries from them.

## Verification

In a real DSH web profile with a fixture root carrying the four roles and the
four default properties:

- computed `display` family resolves to `"Arbor ChillDIN Gothic"` and the
  platform font is `ChillDINGothic Std`;
- computed `numeric` family resolves to `"Arbor ChillDIN"` and the platform
  font is `ChillDIN-Regular` (or the matching Medium/SemiBold face);
- computed `body` and `code` keep DSH's token families;
- the chat page records zero `.woff`/`.woff2` requests, and the four font
  requests appear only after the fixture root mounts;
- light and dark screenshots are captured from the same fixture.

The `[data-arbor-page]` root marker is the one dsh-arbor's page carries today.
The contract itself pins only `[data-arbor-text]`, so the plugin repeats the
display/numeric values on the contract-pinned nodes; a deployment whose root
marker differs still gets the fonts, but the values are then set per node
instead of on the root. If dsh-arbor pins a different root marker, update
`ROOT_SELECTOR` in `src/client.ts`.
