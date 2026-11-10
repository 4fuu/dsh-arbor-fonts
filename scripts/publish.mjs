/**
 * Pack or publish the font plugin from a staging directory.
 *
 *   node scripts/publish.mjs              `npm pack --dry-run`
 *   node scripts/publish.mjs --publish    `npm publish --access public`
 *
 * The package directory is the source of truth; `lib` and `client.js` are the
 * built entries. This script copies what a published package needs into
 * `dist`, writes a manifest without `private`, `scripts` or `devDependencies`,
 * and packs or publishes from there. Run `pnpm build` first.
 */

import { spawnSync } from 'node:child_process'
import { cp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const packageDirectory = join(root, 'packages', 'dsh-arbor-fonts')
const dist = join(packageDirectory, 'dist')
const publish = process.argv.includes('--publish')
const manifest = JSON.parse(await readFile(join(packageDirectory, 'package.json'), 'utf8'))

if (manifest.version === '0.0.0') throw new Error('set the release version in package.json first')
if (manifest.private === true) throw new Error('the published package must not be private')

async function filesUnder(directory, prefix = '') {
  const found = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = prefix === '' ? entry.name : `${prefix}/${entry.name}`
    if (entry.isDirectory()) found.push(...await filesUnder(join(directory, entry.name), relative))
    else found.push(relative)
  }
  return found.sort()
}

await rm(dist, { recursive: true, force: true })
for (const entry of ['lib', 'client.js', 'fonts', 'LICENSE', 'NOTICE', 'README.md']) {
  await cp(join(packageDirectory, entry), join(dist, entry), { recursive: true })
}

const files = (await filesUnder(dist)).filter(file => !['package.json', 'README.md', 'LICENSE'].includes(file))
const published = { ...manifest, files }
delete published.private
delete published.scripts
delete published.devDependencies
await writeFile(join(dist, 'package.json'), `${JSON.stringify(published, null, 2)}\n`)

const result = spawnSync('npm', publish ? ['publish', '--access', 'public'] : ['pack', '--dry-run'], {
  cwd: dist,
  stdio: 'inherit',
})
if (result.status !== 0) throw new Error(`npm exited with ${result.status}`)
