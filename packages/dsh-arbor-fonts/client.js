window.__ModuleLoader__.load({
	id: "@4fu/dsh-arbor-fonts",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client.ts
var client_exports = {};
__export(client_exports, {
  ARBOR_FONT_CSS: () => ARBOR_FONT_CSS,
  ARBOR_SCOPE_CSS: () => ARBOR_SCOPE_CSS,
  FONT_FACE_CSS: () => FONT_FACE_CSS,
  ROOT_SELECTOR: () => ROOT_SELECTOR,
  STYLE_ID: () => STYLE_ID,
  TEXT_SELECTOR: () => TEXT_SELECTOR,
  apply: () => apply,
  ensureArborFontStyle: () => ensureArborFontStyle,
  hasArborRootOrText: () => hasArborRootOrText,
  installArborFonts: () => installArborFonts
});
module.exports = __toCommonJS(client_exports);

// src/font-manifest.ts
var FONT_FILES = [
  {
    "file": "ChillDIN-Regular.woff",
    "family": "Arbor ChillDIN",
    "weight": 400,
    "format": "woff",
    "mediaType": "font/woff",
    "sha256": "e7652f7cd2b8008bf6e1ddd9aace5e9b42cc5e1afdb135d3db3399c8d314674d",
    "path": "/api/arbor-fonts/e7652f7cd2b8008b/ChillDIN-Regular.woff",
    "url": "api/arbor-fonts/e7652f7cd2b8008b/ChillDIN-Regular.woff"
  },
  {
    "file": "ChillDIN-Medium.woff",
    "family": "Arbor ChillDIN",
    "weight": 500,
    "format": "woff",
    "mediaType": "font/woff",
    "sha256": "ff9d00e8cfff20b8eb45b5bdab0a12e2be037b0c91395a9ebf0f830786939047",
    "path": "/api/arbor-fonts/ff9d00e8cfff20b8/ChillDIN-Medium.woff",
    "url": "api/arbor-fonts/ff9d00e8cfff20b8/ChillDIN-Medium.woff"
  },
  {
    "file": "ChillDIN-SemiBold.woff",
    "family": "Arbor ChillDIN",
    "weight": 600,
    "format": "woff",
    "mediaType": "font/woff",
    "sha256": "f542334ce887b2b731f0b5d0c4743ae16df1391d62db6cacc944a7c225900edf",
    "path": "/api/arbor-fonts/f542334ce887b2b7/ChillDIN-SemiBold.woff",
    "url": "api/arbor-fonts/f542334ce887b2b7/ChillDIN-SemiBold.woff"
  },
  {
    "file": "ChillDINGothic_Std.woff2",
    "family": "Arbor ChillDIN Gothic",
    "weight": 500,
    "format": "woff2",
    "mediaType": "font/woff2",
    "sha256": "184fc96d68dc2bbf5a8e8d0ebfbf978b03f356827d582242fde9358ae88fad9e",
    "path": "/api/arbor-fonts/184fc96d68dc2bbf/ChillDINGothic_Std.woff2",
    "url": "api/arbor-fonts/184fc96d68dc2bbf/ChillDINGothic_Std.woff2"
  }
];

// src/client.ts
var STYLE_ID = "dsh-arbor-fonts";
var ROOT_SELECTOR = "[data-arbor-page]";
var TEXT_SELECTOR = "[data-arbor-text]";
function textRole(role) {
  return `[data-arbor-text="${role}"]`;
}
function fontFace(font) {
  return `@font-face{font-family:'${font.family}';src:url("${font.url}") format('${font.format}');font-weight:${font.weight};font-style:normal;font-display:swap}`;
}
var FONT_FACE_CSS = FONT_FILES.map(fontFace).join("\n");
var ARBOR_SCOPE_CSS = [
  `${ROOT_SELECTOR}{--arbor-font-display:'Arbor ChillDIN Gothic',var(--arbor-font-body,var(--dsw-font-family));--arbor-font-numeric:'Arbor ChillDIN',var(--arbor-font-body,var(--dsw-font-family))}`,
  `${textRole("display")}{--arbor-font-display:'Arbor ChillDIN Gothic',var(--arbor-font-body,var(--dsw-font-family));font-synthesis:none}`,
  `${textRole("numeric")}{--arbor-font-numeric:'Arbor ChillDIN',var(--arbor-font-body,var(--dsw-font-family))}`
].join("\n");
var ARBOR_FONT_CSS = `${FONT_FACE_CSS}
${ARBOR_SCOPE_CSS}`;
function hasArborRootOrText(root) {
  return root.querySelector(`${ROOT_SELECTOR}, ${TEXT_SELECTOR}`) !== null;
}
function ensureArborFontStyle(doc) {
  if (doc.getElementById(STYLE_ID) !== null) return false;
  const style = doc.createElement("style");
  style.id = STYLE_ID;
  style.textContent = ARBOR_FONT_CSS;
  doc.head.appendChild(style);
  return true;
}
function installArborFonts(doc, Observer = MutationObserver) {
  let stop = () => {
  };
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    stop();
  };
  const check = () => {
    if (done || !hasArborRootOrText(doc)) return;
    ensureArborFontStyle(doc);
    finish();
  };
  const observer = new Observer(check);
  observer.observe(doc.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-arbor-page", "data-arbor-text"]
  });
  stop = () => observer.disconnect();
  check();
  return finish;
}
function apply(ctx) {
  if (typeof document === "undefined") return;
  const dispose = installArborFonts(document);
  ctx.effect(() => dispose);
}

		return module.exports;
	}
});

