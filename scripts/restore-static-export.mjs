/**
 * Restaura API routes y middleware después de un build estático.
 */
import fs from "fs"
import path from "path"

const root = process.cwd()
const apiSrc = path.join(root, "server-only", "api-routes-backup", "api")
const apiDst = path.join(root, "app", "api")
const mw = path.join(root, "middleware.ts")
const mwOff = path.join(root, "middleware.ts.disabled")

if (fs.existsSync(apiSrc) && !fs.existsSync(apiDst)) {
  fs.mkdirSync(path.join(root, "app"), { recursive: true })
  fs.renameSync(apiSrc, apiDst)
  console.log("→ API restaurada en app/api")
}

if (fs.existsSync(mwOff) && !fs.existsSync(mw)) {
  fs.renameSync(mwOff, mw)
  console.log("→ middleware.ts restaurado")
}

console.log("Restauración completada.")
