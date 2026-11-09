# dsh-arbor-fonts

A DeepSeek Harness (DSH, dsh-v0.2.2-rc.1) client plugin whose only job is the
fonts of the Arbor page that github.com/4fuu/dsh-arbor adds to DSH.

## Commands

```sh
.agents/setup   # pinned pnpm and dependencies
```

The first package adds `pnpm check` (typecheck and tests) to package.json.

## The contract this plugin relies on

dsh-arbor owns it; this plugin never goes beyond it.

- Every text node on the Arbor page and its session tabs carries
  `data-arbor-text` = `body` | `display` | `numeric` | `code`.
- The Arbor root sets `--arbor-font-body`, `--arbor-font-display`,
  `--arbor-font-numeric` and `--arbor-font-code`, defaulting to DSH's own font
  tokens. A font plugin overrides only these four properties: never class
  names, structure or other styles.

## Fonts

From github.com/Warren2060/ChillDIN-ChillDINGothic at commit
d5251e66ded29639397025784c72dc2ac12bc817, OFL-1.1. `body` and `code` keep DSH's
fonts; `display` is ChillDIN Gothic (one static weight, 500, full CJK);
`numeric` is ChillDIN (Regular, Medium, SemiBold; Latin and numerals only). No
other fonts.

## Serving the font files

DSH's client package asset route (`/plugins/<package>/assets/<path>`,
`@deepseek-ai/dsh-client-modules` `lib/index.js`, `PACKAGE_ASSET_MEDIA_TYPES`)
serves only .svg, .png, .webp, .jpg and .jpeg; .woff and .woff2 return 404. The
standard `dsh.client` asset mechanism cannot deliver fonts, so this plugin
needs another route. `@deepseek-ai/dsh-client-ui-theme`
`lib/styles/brand-font.css` is the first precedent to check.

## Conventions

- TypeScript, strict, `verbatimModuleSyntax`; relative imports carry `.ts`.
- All code, comments, commits and documents in English. No emoji.
- Ordinary DSH pages must never download a font file from this plugin.
