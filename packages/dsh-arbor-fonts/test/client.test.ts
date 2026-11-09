import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  ARBOR_FONT_CSS,
  ARBOR_SCOPE_CSS,
  FONT_FACE_CSS,
  STYLE_ID,
  ensureArborFontStyle,
  hasArborRootOrText,
  installArborFonts,
} from '../src/client.ts'

/** A document fake with just the four members the plugin touches. */
function fakeDocument(initiallyMounted: boolean): {
  doc: Document
  mount: () => void
  styles: Array<{ id?: string; textContent?: string }>
} {
  let mounted = initiallyMounted
  const styles: Array<{ id?: string; textContent?: string }> = []
  const doc = {
    documentElement: {},
    head: {
      appendChild(element: { id?: string; textContent?: string }) {
        styles.push(element)
      },
    },
    getElementById(id: string) {
      return styles.find((style) => style.id === id) ?? null
    },
    createElement(tag: string) {
      return { tagName: tag, id: '', textContent: '' }
    },
    querySelector() {
      return mounted ? {} : null
    },
  }
  return { doc: doc as unknown as Document, mount: () => { mounted = true }, styles }
}

/** A MutationObserver fake that records the callback and options. */
class FakeObserver {
  static latest: FakeObserver | undefined
  readonly callback: MutationCallback
  target: unknown
  options: MutationObserverInit | undefined
  disconnects = 0

  constructor(callback: MutationCallback) {
    this.callback = callback
    FakeObserver.latest = this
  }

  observe(target: Node, options?: MutationObserverInit): void {
    this.target = target
    this.options = options
  }

  disconnect(): void {
    this.disconnects += 1
  }

  trigger(): void {
    this.callback([], this as unknown as MutationObserver)
  }
}

const Observer = FakeObserver as unknown as typeof MutationObserver

test('the faces are private families with swap and no synthetic style', () => {
  assert.equal((FONT_FACE_CSS.match(/@font-face/g) ?? []).length, 4)
  assert.equal((FONT_FACE_CSS.match(/font-display:swap/g) ?? []).length, 4)
  assert.equal((FONT_FACE_CSS.match(/font-style:normal/g) ?? []).length, 4)
  assert.match(FONT_FACE_CSS, /font-family:'Arbor ChillDIN'/)
  assert.match(FONT_FACE_CSS, /font-family:'Arbor ChillDIN Gothic'/)
  assert.match(FONT_FACE_CSS, /font-weight:400/)
  assert.match(FONT_FACE_CSS, /font-weight:500/)
  assert.match(FONT_FACE_CSS, /font-weight:600/)
  assert.match(FONT_FACE_CSS, /api\/arbor-fonts\/[0-9a-f]{16}\/ChillDINGothic_Std\.woff2/)
})

test('every scoped rule is rooted at the Arbor page or its text nodes', () => {
  const blocks = ARBOR_SCOPE_CSS.split('}').map((block) => block.trim()).filter(Boolean)
  assert.equal(blocks.length, 3)
  for (const block of blocks) {
    const selector = block.slice(0, block.indexOf('{')).trim()
    assert.ok(
      selector.includes('[data-arbor-page]') || selector.includes('[data-arbor-text="'),
      `unscoped selector: ${selector}`,
    )
    assert.doesNotMatch(selector, /(^|[\s,>+~])(body|html|:root|\*)([\s,{.:#>+~]|$)/)
  }
  assert.match(ARBOR_SCOPE_CSS, /\[data-arbor-text="display"\]\{[^}]*font-synthesis:none/)
})

test('the plugin overrides only the display and numeric properties', () => {
  const assigned = [...ARBOR_SCOPE_CSS.matchAll(/(--arbor-font-[a-z]+)\s*:/g)].map((match) => match[1])
  assert.deepEqual([...new Set(assigned)].sort(), ['--arbor-font-display', '--arbor-font-numeric'])
  assert.doesNotMatch(ARBOR_SCOPE_CSS, /--arbor-font-(body|code)\s*:/)
})

test('hasArborRootOrText checks the root and the contract marker', () => {
  const selectors: string[] = []
  const parent = (found: boolean): ParentNode => ({
    querySelector(selector: string) {
      selectors.push(selector)
      return found ? {} : null
    },
  }) as unknown as ParentNode
  assert.equal(hasArborRootOrText(parent(false)), false)
  assert.equal(hasArborRootOrText(parent(true)), true)
  assert.match(selectors[0] ?? '', /\[data-arbor-page\]/)
  assert.match(selectors[0] ?? '', /\[data-arbor-text\]/)
})

test('ensureArborFontStyle appends exactly one identical stylesheet', () => {
  const { doc, styles } = fakeDocument(false)
  assert.equal(ensureArborFontStyle(doc), true)
  assert.equal(ensureArborFontStyle(doc), false)
  assert.equal(styles.length, 1)
  assert.equal(styles[0]?.id, STYLE_ID)
  assert.equal(styles[0]?.textContent, ARBOR_FONT_CSS)
})

test('nothing is installed until an Arbor element exists', () => {
  const { doc, mount, styles } = fakeDocument(false)
  const dispose = installArborFonts(doc, Observer)
  assert.equal(styles.length, 0)
  const observer = FakeObserver.latest
  assert.ok(observer)
  assert.equal(observer.disconnects, 0)
  assert.equal(observer.options?.childList, true)
  assert.equal(observer.options?.subtree, true)
  assert.deepEqual(observer.options?.attributeFilter, ['data-arbor-page', 'data-arbor-text'])

  mount()
  observer.trigger()
  assert.equal(styles.length, 1)
  assert.equal(styles[0]?.textContent, ARBOR_FONT_CSS)
  assert.equal(observer.disconnects, 1)

  observer.trigger()
  assert.equal(styles.length, 1, 'a second mutation must not inject a second stylesheet')
  dispose()
})

test('an already-mounted Arbor page installs on the first check', () => {
  const { doc, styles } = fakeDocument(true)
  const dispose = installArborFonts(doc, Observer)
  assert.equal(styles.length, 1)
  const observer = FakeObserver.latest
  assert.ok(observer)
  assert.equal(observer.disconnects, 1)
  dispose()
})

test('the disposer stops the watcher even before the page appears', () => {
  const { doc, styles } = fakeDocument(false)
  const dispose = installArborFonts(doc, Observer)
  const observer = FakeObserver.latest
  assert.ok(observer)
  dispose()
  assert.equal(observer.disconnects, 1)
  assert.equal(styles.length, 0)
})
