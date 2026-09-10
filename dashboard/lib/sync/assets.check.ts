// Runnable check for the asset helpers: bun lib/sync/assets.check.ts
import assert from "node:assert/strict"
import { join } from "node:path"

import { assetFile, mimeFor } from "./assets"

// only the formats the viewer serves, matched on the real extension
assert.equal(mimeFor("img/diagram.png"), "image/png")
assert.equal(mimeFor("img/Photo.JPG"), "image/jpeg")
assert.equal(mimeFor("a/b.svg"), "image/svg+xml")
assert.equal(mimeFor("files/spec.pdf"), "application/pdf")
assert.equal(mimeFor("notes/page.md"), null)
assert.equal(mimeFor("bin/tool.exe"), null)
assert.equal(mimeFor("Makefile"), null)
assert.equal(mimeFor("folder.png/readme"), null, "a dot in a folder name is not an extension")
assert.equal(mimeFor(".obsidian/app.json"), null)

// a stored file path comes only from a plain hash, so a bad row can never
// send the route outside the asset folder
process.env.ASSET_DIR = "/srv/assets"
const sha1 = "a".repeat(40)
assert.equal(assetFile(sha1), join("/srv/assets", sha1))
assert.equal(assetFile("b".repeat(64)), join("/srv/assets", "b".repeat(64)), "sha256 repos too")
for (const bad of ["../../etc/passwd", "../" + sha1, sha1 + "/x", "", "ABCDEF".repeat(7), "a".repeat(39)]) {
  assert.equal(assetFile(bad), null, `must reject ${JSON.stringify(bad)}`)
}

console.log("asset checks ok")
