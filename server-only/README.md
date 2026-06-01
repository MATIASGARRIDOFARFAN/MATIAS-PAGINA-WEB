# Rutas API (solo servidor Node)

Estas rutas **no se incluyen** en el build estático de GitHub Pages (`output: 'export'`).

La versión publicada en GitHub Pages usa `lib/client-api.ts` (Supabase desde el navegador).

Para Vercel/Node, mueve `api-routes-backup` de vuelta a `app/api` y quita `output: 'export'` de `next.config.mjs`.
