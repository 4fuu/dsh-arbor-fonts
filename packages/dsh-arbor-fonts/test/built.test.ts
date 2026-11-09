import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
// @ts-expect-error the built Host entry is JavaScript and intentionally has no declarations.
import * as host from '../lib/index.js'

test('the built Host entry registers the routes on a connection', () => {
  const routes: Array<{ path: string; methods: readonly string[] }> = []
  host.apply({
    connection: {
      fetch: {
        register(route: { path: string; methods: readonly string[] }) {
          routes.push(route)
          return async () => {}
        },
      },
    },
  })
  assert.equal(host.name, 'dsh-arbor-fonts')
  assert.deepEqual(host.inject, ['connection'])
  assert.equal(routes.length, 4)
  assert.ok(routes.every((route) => route.methods.includes('GET') && route.methods.includes('HEAD')))
})

test('the built client entry is a DSH module-loader registration', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  let registration: { id: string; factory: (require: (name: string) => unknown) => Record<string, unknown> } | undefined
  const window = {
    __ModuleLoader__: {
      load(value: typeof registration) {
        registration = value
      },
    },
  }
  new Function('window', source)(window)
  assert.ok(registration)
  assert.equal(registration.id, '@4fu/dsh-arbor-fonts')
  const exports = registration.factory(() => {
    throw new Error('the client bundle has no runtime imports')
  })
  assert.equal(typeof exports.apply, 'function')
  assert.match(String(exports.ARBOR_FONT_CSS), /@font-face\{font-family:'Arbor ChillDIN'/)
})
