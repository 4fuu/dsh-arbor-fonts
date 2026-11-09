/**
 * Build both halves of the package.
 *
 * Host: `src/index.ts` -> `lib/index.js`, one ESM bundle. DSH installs a plugin
 * into a profile's node_modules, and Node refuses type stripping for files under
 * node_modules, so the Host entry must be JavaScript.
 *
 * Browser: `src/client.ts` -> `client.js`. DSH loads a client plugin as a
 * classic script that registers itself with the page's module loader,
 * `window.__ModuleLoader__.load({ id, factory })`, where `factory(require)` is a
 * CommonJS module body. This is the same wrapper dsh-arbor's
 * `packages/arbor-ui/build.mjs` uses. The package has no runtime client
 * dependencies, so the bundle is one small registration call.
 *
 * Run: pnpm build   (esbuild is a devDependency)
 */

import { build } from 'esbuild'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(await readFile(join(here, 'package.json'), 'utf8'))
const id = pkg.name

await build({
  entryPoints: [join(here, 'src/index.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node24',
  external: ['node:*'],
  outfile: join(here, 'lib/index.js'),
  logLevel: 'info',
})

const banner = `window.__ModuleLoader__.load({\n\tid: ${JSON.stringify(id)},\n\tfactory: (require) => {\n\t\tvar module = { exports: {} };\n\t\tvar exports = module.exports;\n\t\tObject.defineProperty(exports, Symbol.toStringTag, { value: "Module" });\n`
const footer = `\n\t\treturn module.exports;\n\t}\n});\n`

await build({
  entryPoints: [join(here, 'src/client.ts')],
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  external: ['@deepseek-ai/*'],
  banner: { js: banner },
  footer: { js: footer },
  outfile: join(here, 'client.js'),
  logLevel: 'info',
})

console.log(`built ${id} -> lib/index.js, client.js`)
