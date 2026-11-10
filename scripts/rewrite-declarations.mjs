/**
 * Point declarations' relative imports at the emitted JavaScript.
 *
 * `tsc` keeps `.ts` specifiers in `.d.ts` output; the published package ships
 * only `lib/*.js` and `lib/*.d.ts`, so `import './routes.ts'` would name a file
 * that is not there.
 */

import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const lib = join(here, '..', 'packages', 'dsh-arbor-fonts', 'lib')

for (const file of ['index.d.ts', 'routes.d.ts', 'font-manifest.d.ts']) {
  const path = join(lib, file)
  const source = await readFile(path, 'utf8')
  const rewritten = source.replace(/(['"])(\.{1,2}\/[^'"]+)\.ts\1/g, '$1$2.js$1')
  if (rewritten !== source) await writeFile(path, rewritten)
}
