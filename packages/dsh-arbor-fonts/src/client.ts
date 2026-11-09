/// <reference lib="dom" />
/**
 * `@4fu/dsh-arbor-fonts` — the browser half.
 *
 * The plugin owns two CSS custom properties, and only on the Arbor page:
 * `--arbor-font-display` becomes ChillDIN Gothic and `--arbor-font-numeric`
 * becomes ChillDIN. `body` and `code` are deliberately absent: dsh-arbor's
 * defaults for those roles are DSH's own body and monospace tokens.
 *
 * Scoping. dsh-arbor's contract pins `[data-arbor-text]` on every text node but
 * leaves the root marker to its own UI, so the rules name both the page root
 * this plugin knows (`[data-arbor-page]`, which dsh-arbor's page already
 * carries) and the contract-pinned text nodes. Nothing here can match an
 * ordinary DSH element: no selector is a bare tag, class, `body`, `:root` or
 * `*`, and the `@font-face` families are private names beginning with "Arbor".
 *
 * Lazy. The stylesheet is appended only after an Arbor root or a
 * `[data-arbor-text]` node exists. A font face is fetched only once the
 * browser uses one of those families, so an ordinary DSH page never requests a
 * font file from this plugin.
 */

import { FONT_FILES, type FontFile } from './font-manifest.ts'

/** The stylesheet's id, so a re-apply replaces rather than doubles it. */
export const STYLE_ID = 'dsh-arbor-fonts'

/** The root dsh-arbor's page carries. */
export const ROOT_SELECTOR = '[data-arbor-page]'

/** The contract-pinned marker on every Arbor text node. */
export const TEXT_SELECTOR = '[data-arbor-text]'

/** The selector for one overridden role's text nodes. */
function textRole(role: 'display' | 'numeric'): string {
  return `[data-arbor-text="${role}"]`
}

/** One `@font-face` rule. */
function fontFace(font: FontFile): string {
  return `@font-face{font-family:'${font.family}';src:url("${font.url}") format('${font.format}');font-weight:${font.weight};font-style:normal;font-display:swap}`
}

/** The four faces, with `font-display: swap`. */
export const FONT_FACE_CSS: string = FONT_FILES.map(fontFace).join('\n')

/**
 * The overrides. The root rule covers the page as a whole; the text-node rules
 * repeat the value for a deployment whose root marker differs, and add the
 * one non-property declaration the single-weight Gothic needs.
 */
export const ARBOR_SCOPE_CSS: string = [
  `${ROOT_SELECTOR}{--arbor-font-display:'Arbor ChillDIN Gothic',var(--arbor-font-body,var(--dsw-font-family));--arbor-font-numeric:'Arbor ChillDIN',var(--arbor-font-body,var(--dsw-font-family))}`,
  `${textRole('display')}{--arbor-font-display:'Arbor ChillDIN Gothic',var(--arbor-font-body,var(--dsw-font-family));font-synthesis:none}`,
  `${textRole('numeric')}{--arbor-font-numeric:'Arbor ChillDIN',var(--arbor-font-body,var(--dsw-font-family))}`,
].join('\n')

/** The whole stylesheet the plugin appends. */
export const ARBOR_FONT_CSS: string = `${FONT_FACE_CSS}\n${ARBOR_SCOPE_CSS}`

/** Whether the document already contains the Arbor page or one of its nodes. */
export function hasArborRootOrText(root: ParentNode): boolean {
  return root.querySelector(`${ROOT_SELECTOR}, ${TEXT_SELECTOR}`) !== null
}

/** Append the stylesheet once; false when an earlier copy is already present. */
export function ensureArborFontStyle(doc: Document): boolean {
  if (doc.getElementById(STYLE_ID) !== null) return false
  const style = doc.createElement('style')
  style.id = STYLE_ID
  style.textContent = ARBOR_FONT_CSS
  doc.head.appendChild(style)
  return true
}

/**
 * Watch for the Arbor page and install the stylesheet on first sight.
 *
 * @param doc - document to watch.
 * @param Observer - MutationObserver constructor, injectable for tests.
 * @returns a disposer that stops watching.
 */
export function installArborFonts(
  doc: Document,
  Observer: typeof MutationObserver = MutationObserver,
): () => void {
  let stop = (): void => {}
  let done = false
  const finish = (): void => {
    if (done) return
    done = true
    stop()
  }
  const check = (): void => {
    if (done || !hasArborRootOrText(doc)) return
    ensureArborFontStyle(doc)
    finish()
  }
  const observer = new Observer(check)
  observer.observe(doc.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-arbor-page', 'data-arbor-text'],
  })
  stop = () => observer.disconnect()
  check()
  return finish
}

/** The Cordis context slice the browser plugin uses. */
export interface ClientContext {
  effect(callback: () => () => void): void
}

/** Install the lazy watcher and release it with the plugin. */
export function apply(ctx: ClientContext): void {
  if (typeof document === 'undefined') return
  const dispose = installArborFonts(document)
  ctx.effect(() => dispose)
}
