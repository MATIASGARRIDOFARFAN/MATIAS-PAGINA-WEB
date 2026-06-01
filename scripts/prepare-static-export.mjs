/**
 * Mueve API routes y middleware fuera de app/ solo para `output: 'export'`.
 * Ejecutar antes de: npm run build (con GITHUB_PAGES=true)
 * Restaurar con: node scripts/restore-static-export.mjs
 */
import fs from "fs"
import path from "path"

const root = process.cwd()
const apiSrc = path.join(root, "app", "api")
const apiDst = path.join(root, "server-only", "api-routes-backup", "api")
const mw = path.join(root, "middleware.ts")
const mwOff = path.join(root, "middleware.ts.disabled")

if (fs.existsSync(apiSrc)) {
  fs.mkdirSync(path.dirname(apiDst), { recursive: true })
  if (fs.existsSync(apiDst)) fs.rmSync(apiDst, { recursive: true, force: true })
  fs.renameSync(apiSrc, apiDst)
  console.log("→ app/api movido a server-only/api-routes-backup/api")
}

if (fs.existsSync(mw)) {
  if (fs.existsSync(mwOff)) fs.unlinkSync(mwOff)
  fs.renameSync(mw, mwOff)
  console.log("→ middleware.ts deshabilitado (middleware.ts.disabled)")
}

console.log("Listo para build estático.")
