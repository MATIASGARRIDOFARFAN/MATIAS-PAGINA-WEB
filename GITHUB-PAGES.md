# Despliegue en GitHub Pages

## Requisitos

1. Ejecutar `supabase/schema.sql` en Supabase.
2. Configurar secrets en el repo: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Build local (genera carpeta `out`)

```bat
cd /d "d:\JEIMY 2\PAGINA WEB"
npm install
set GITHUB_PAGES=true
set GITHUB_PAGES_REPO=MATIAS-PAGINA-WEB
npm run build:gh-pages
```

La carpeta **`out`** es el sitio estático listo para publicar.

Después del build, si desarrollas en local con API routes:

```bat
npm run restore:dev
```

## Subir manualmente a GitHub Pages

1. Repo → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: crea rama `gh-pages`, sube el **contenido de `out`** a la raíz de esa rama.

```bat
cd out
git init
git add .
git commit -m "Deploy GitHub Pages"
git branch -M gh-pages
git remote add origin https://github.com/TU_USUARIO/MATIAS-PAGINA-WEB.git
git push -f origin gh-pages
```

## Automático con GitHub Actions

Usa el workflow `.github/workflows/deploy-pages.yml` (push a `main`).

## Nota sobre API routes

Las rutas en `server-only/api-routes-backup/` se conservan para despliegue con Node (Vercel).
En GitHub Pages la app usa `lib/client-api.ts` (Supabase directo desde el navegador).
