/**
 * Check the DSH compatibility pin recorded by the font plugin.
 *
 * The plugin is a DSH client package, so its manifest records the one DSH
 * version it is built for. DSH reads `dsh.client`; `dsh.compatible` is this
 * repository's explicit statement of the pin, and this check keeps it from
 * drifting away from the documentation and the CI job.
 *
 * Run: pnpm check:pin
 */

import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PIN = '0.2.2-rc.1'
const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const manifest = JSON.parse(
  await readFile(join(ROOT, 'packages', 'dsh-arbor-fonts', 'package.json'), 'utf8'),
)

const found = manifest?.dsh?.compatible
if (found !== PIN) {
  console.error(`FAIL dsh.compatible is ${String(found)}, expected ${PIN}`)
  process.exitCode = 1
} else {
  console.log(`PASS dsh pin: dsh.compatible is ${PIN}`)
}
