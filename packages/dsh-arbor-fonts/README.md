# @4fu/dsh-arbor-fonts

A DeepSeek Harness client plugin whose only job is the fonts of the Arbor page
from [dsh-arbor](https://github.com/4fuu/dsh-arbor). It sets ChillDIN Gothic for
`display` text and ChillDIN for `numeric` text; `body` and `code` keep DSH's
fonts.

## What it touches

dsh-arbor owns the typography contract:

- every text node on the Arbor page and its session tabs carries
  `data-arbor-text="body" | "display" | "numeric" | "code"`;
- the Arbor root sets `--arbor-font-body`, `--arbor-font-display`,
  `--arbor-font-numeric` and `--arbor-font-code`, defaulting to DSH's tokens.

This plugin overrides only `--arbor-font-display` and `--arbor-font-numeric`.
It never changes class names, structure, body text, code text or any other
style. Its rules are scoped to `[data-arbor-page]` (the root dsh-arbor's page
already carries) and to the contract's `[data-arbor-text]` nodes, so an
ordinary DSH element cannot match them.

The stylesheet is injected lazily: only after an Arbor root or a
`[data-arbor-text]` node exists. A browser fetches a `@font-face` file only
when a matching family is used, so an ordinary DSH page requests no font from
this plugin. The plugin's client code itself is loaded with the normal DSH
plugin graph, but its `apply` only installs a `MutationObserver` until the page
appears.

`font-display: swap` is on every face. `font-synthesis: none` is on `display`
nodes, so the single 500-weight Gothic is never synthetically bolded.

## How the files are served

DSH's package asset route (`/plugins/<package>/assets/<path>`,
`@deepseek-ai/dsh-client-modules`, `PACKAGE_ASSET_MEDIA_TYPES`) serves only
images; `.woff` and `.woff2` answer 404. `@deepseek-ai/dsh-client-ui-theme`'s
`lib/styles/brand-font.css` is not a public font route either: those woff2
files are bundled with the theme's own client artifact.

The supported seam is DSH's Host connection exact Fetch registry
(`@deepseek-ai/dsh-client-connection`, `HostConnectionFetch.register`), the one
dsh-arbor uses for `/api/arbor/host`. This package registers four exact routes
under `/api/arbor-fonts/`, one per face. Each URL contains the first 16 hex
digits of the file's SHA-256, and the response carries the matching
`font/woff`/`font/woff2` content type, the full SHA-256 as its ETag, and
`cache-control: public, max-age=31536000, immutable`. On a profile with no
browser connection (headless, acp, sdk) the Host plugin stays inactive and no
route is registered.

## Install in a DSH web profile

```sh
dsh plugin --profile web add file:/absolute/path/to/packages/dsh-arbor-fonts
```

Then insert the Host row in the profile's `cordis.patch.yml`:

```yaml
- insert:
    - id: arbor-fonts
      name: '@4fu/dsh-arbor-fonts'
```

Restart the profile. The package must be visible in the profile's
`node_modules`; `dsh plugin add` writes the dependency.

## DSH version

Built for `dsh-v0.2.2-rc.1` (`@deepseek-ai/dsh@0.2.2-rc.1`). The manifest
records it in `engines.dsh`; DSH checks it as the plugin runtime requirement,
and `pnpm check:pin` checks the recorded value. Another DSH version
is unsupported: the plugin uses DSH's exact Fetch registry and the Arbor page's
`data-arbor-text` contract, and a move in either can leave the routes
unregistered or the stylesheet unmatched.

## License

The plugin's source code is MIT. The vendored fonts in `fonts/` are licensed
under the SIL Open Font License 1.1; the full OFL text is
`fonts/ChillDIN-OFL.txt`, attribution and per-file hashes are in
`fonts/README.md`, and the package-level summary is in `NOTICE`. The package as
a whole is `MIT AND OFL-1.1`.

## Develop

```sh
pnpm build   # src/index.ts -> lib/index.js; src/client.ts -> client.js
pnpm check   # build, typecheck, route tests, scoping/lazy tests
```
