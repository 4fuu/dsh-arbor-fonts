import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { FONT_FILES } from '../src/font-manifest.ts'
import { fontResponse, registerFontRoutes, type FontRouteConnection } from '../src/routes.ts'

const FONT_DIRECTORY = new URL('../fonts/', import.meta.url)

test('the manifest names the vendored bytes', async () => {
  for (const font of FONT_FILES) {
    const bytes = await readFile(new URL(font.file, FONT_DIRECTORY))
    const sha256 = createHash('sha256').update(bytes).digest('hex')
    assert.equal(sha256, font.sha256, `${font.file} changed without regenerating the manifest`)
    assert.equal(font.path, `/${font.url}`)
    assert.match(font.path, /^\/api\/arbor-fonts\/[0-9a-f]{16}\/.+$/)
  }
  const gothic = FONT_FILES.find((font) => font.file === 'ChillDINGothic_Std.woff2')
  assert.equal(
    gothic?.sha256,
    '184fc96d68dc2bbf5a8e8d0ebfbf978b03f356827d582242fde9358ae88fad9e',
  )
})

test('registerFontRoutes registers one exact GET/HEAD route per face', () => {
  const routes: Array<{ path: string; methods: readonly string[]; requestBody: string }> = []
  const connection: FontRouteConnection = {
    fetch: {
      register(route) {
        routes.push(route)
        return async () => {}
      },
    },
  }
  registerFontRoutes(connection)
  assert.deepEqual(routes.map((route) => route.path), FONT_FILES.map((font) => font.path))
  for (const route of routes) {
    assert.deepEqual([...route.methods].sort(), ['GET', 'HEAD'])
    assert.equal(route.requestBody, 'buffered')
  }
})

test('GET returns the exact bytes with a font content type and immutable caching', async () => {
  const font = FONT_FILES.find((candidate) => candidate.file === 'ChillDIN-Regular.woff')
  assert.ok(font)
  const bytes = new Uint8Array([1, 2, 3, 4])
  const response = await fontResponse(
    font,
    new Request(`http://dsh.test${font.path}`),
    async () => bytes,
  )
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('content-type'), 'font/woff')
  assert.equal(response.headers.get('cache-control'), 'public, max-age=31536000, immutable')
  assert.equal(response.headers.get('etag'), `"${font.sha256}"`)
  assert.equal(response.headers.get('content-length'), '4')
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes)
})

test('the Gothic route uses the woff2 content type', async () => {
  const font = FONT_FILES.find((candidate) => candidate.file === 'ChillDINGothic_Std.woff2')
  assert.ok(font)
  const response = await fontResponse(font, new Request(`http://dsh.test${font.path}`), async () => new Uint8Array())
  assert.equal(response.headers.get('content-type'), 'font/woff2')
})

test('HEAD returns the headers without a body', async () => {
  const font = FONT_FILES[1]
  assert.ok(font)
  const response = await fontResponse(
    font,
    new Request(`http://dsh.test${font.path}`, { method: 'HEAD' }),
    async () => new Uint8Array([9, 9]),
  )
  assert.equal(response.status, 200)
  assert.equal(response.body, null)
  assert.equal(response.headers.get('content-length'), '2')
})

test('a matching If-None-Match answers 304', async () => {
  const font = FONT_FILES[0]
  assert.ok(font)
  const response = await fontResponse(
    font,
    new Request(`http://dsh.test${font.path}`, {
      headers: { 'if-none-match': `"other", "${font.sha256}"` },
    }),
    async () => {
      throw new Error('a 304 must not read the file')
    },
  )
  assert.equal(response.status, 304)
  assert.equal(response.body, null)
  assert.equal(response.headers.get('etag'), `"${font.sha256}"`)
})

test('another path, another method and a failed read are refused', async () => {
  const font = FONT_FILES[0]
  assert.ok(font)
  const wrongPath = await fontResponse(font, new Request('http://dsh.test/api/arbor-fonts/other.woff'), async () => new Uint8Array())
  assert.equal(wrongPath.status, 404)

  const wrongMethod = await fontResponse(font, new Request(`http://dsh.test${font.path}`, { method: 'POST' }), async () => new Uint8Array())
  assert.equal(wrongMethod.status, 405)
  assert.equal(wrongMethod.headers.get('allow'), 'GET, HEAD')

  const failed = await fontResponse(font, new Request(`http://dsh.test${font.path}`), async () => {
    throw new Error('missing')
  })
  assert.equal(failed.status, 500)
})
