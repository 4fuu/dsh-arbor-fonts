# Vendored fonts

Source: <https://github.com/Warren2060/ChillDIN-ChillDINGothic> at commit
`d5251e66ded29639397025784c72dc2ac12bc817`.

The fonts are licensed under the SIL Open Font License 1.1; the upstream
license text is in `ChillDIN-OFL.txt`. No file was modified or subsetted.

| File | Family | Weight | Bytes | SHA-256 |
| --- | --- | --- | --- | --- |
| `ChillDIN-Regular.woff` | Arbor ChillDIN | 400 | 31908 | `e7652f7cd2b8008bf6e1ddd9aace5e9b42cc5e1afdb135d3db3399c8d314674d` |
| `ChillDIN-Medium.woff` | Arbor ChillDIN | 500 | 32532 | `ff9d00e8cfff20b8eb45b5bdab0a12e2be037b0c91395a9ebf0f830786939047` |
| `ChillDIN-SemiBold.woff` | Arbor ChillDIN | 600 | 32588 | `f542334ce887b2b731f0b5d0c4743ae16df1391d62db6cacc944a7c225900edf` |
| `ChillDINGothic_Std.woff2` | Arbor ChillDIN Gothic | 500 | 4565016 | `184fc96d68dc2bbf5a8e8d0ebfbf978b03f356827d582242fde9358ae88fad9e` |

The ChillDIN files carry Latin and numerals only. `ChillDINGothic_Std.woff2`
is the full-CJK static face: one weight (500), no variable axes. Hierarchy on
the Gothic must come from size and color, not weight.

`pnpm build` first runs `scripts/write-font-manifest.mjs`, which reads the
vendored files and writes `src/font-manifest.ts`; each served URL contains the
first 16 hex digits of the file's SHA-256. The route tests fail when the
manifest and the files disagree.
