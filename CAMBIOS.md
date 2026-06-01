# USMP Market — Cambios de plataforma segura

## Resumen

Se implementó una arquitectura full-stack con base de datos SQL (Prisma + SQLite en desarrollo), autenticación institucional con verificación por código, mensajería interna filtrada, solicitudes de materiales, historial, calificaciones, notificaciones y panel de administración.

---

## 1. Registro y autenticación

| Funcionalidad | Implementación |
|---------------|----------------|
| Solo `@usmp.pe` | `lib/validations.ts` |
| Código de verificación | `POST /api/auth/register` + email en consola (dev) |
| Verificar correo antes de acceder | `emailVerified` + página `/verificar-email` |
| Alerta al iniciar sesión | `notifyLoginAlert()` → notificación + email + SMS si hay `phone` |

**Flujo:** Registro → `/verificar-email` → ingresar código → sesión JWT en cookie httpOnly.

---

## 2. Perfil editable

- `PATCH /api/profile` — nombre, apellidos, bio, teléfono (alertas), avatar
- El **correo institucional no se modifica**
- Calificación promedio desde `User.ratingAvg` / `ratingCount`
- UI en `components/profile-content.tsx`

---

## 3. Mensajería interna

- Chat real: `GET/POST /api/conversations`, `GET/POST /api/conversations/[id]/messages`
- Filtros en `lib/message-filter.ts`: teléfonos, emails, URLs, datos sensibles
- Sin WhatsApp en publicaciones
- UI: `components/internal-messenger.tsx`, `/mensajes`

---

## 4. Solicitudes de materiales

- `POST /api/requests` — compra, préstamo, intercambio
- `PATCH /api/requests/[id]` — `accept`, `reject`, `complete`
- Notificaciones al propietario (plataforma + email + SMS)
- Producto pasa a **reservado** al solicitar

---

## 5. Estados de productos

`disponible` | `reservado` | `prestado` | `intercambiado` | `vendido`

- Al completar compra → `vendido`
- Al completar préstamo → `prestado`
- Etiquetas: `components/status-badge.tsx`

---

## 6. Historial

- Tabla `HistoryEntry`
- `GET /api/history`
- Página `/historial`

---

## 7. Calificaciones

- `UserRating` y `ProductRating`
- `POST /api/ratings` — estrellas 1–5 + comentario opcional
- `GET /api/ratings?userId=` o `?productId=`
- Componentes: `components/rating-stars.tsx`

---

## 8. Notificaciones

- Tabla `Notification`
- `GET/PATCH /api/notifications`
- Campana en navbar: `components/notification-bell.tsx`
- Tipos: solicitudes, mensajes, compras, préstamos, calificaciones, login

**Email/SMS en desarrollo:** se imprimen en la consola del servidor. En producción conectar `lib/email-service.ts` y `lib/sms-service.ts` (Resend, Twilio, FCM).

---

## 9. Panel de administración

- `/admin` — solo `role: admin`
- `GET/PATCH /api/admin` — usuarios, reportes, suspender, eliminar publicaciones
- Admin demo: `admin@usmp.pe` / `admin12345`

---

## 10. Base de datos (tablas)

- `User`, `Product`, `MaterialRequest`, `Conversation`, `Message`
- `Notification`, `HistoryEntry`, `UserRating`, `ProductRating`, `Report`

Schema: `prisma/schema.prisma`

---

## 11. Seguridad

- Sanitización XSS: `lib/security.ts`
- Prisma parametrizado (anti SQL injection)
- JWT en cookie httpOnly (`lib/auth.ts`)
- Permisos por ruta: `lib/api-helpers.ts` (`requireVerifiedAuth`, `requireAdmin`)
- Middleware: rutas protegidas en `middleware.ts`

---

## Archivos nuevos

```
lib/types.ts, lib/security.ts, lib/message-filter.ts
lib/email-service.ts, lib/sms-service.ts, lib/notifications.ts
lib/history.ts, lib/api-helpers.ts
app/api/auth/verify-email/route.ts
app/api/requests/route.ts, app/api/requests/[id]/route.ts
app/api/conversations/route.ts, app/api/conversations/[id]/messages/route.ts
app/api/notifications/route.ts, app/api/history/route.ts
app/api/ratings/route.ts, app/api/admin/route.ts, app/api/reports/route.ts
app/verificar-email/page.tsx, app/historial/page.tsx, app/admin/page.tsx
components/status-badge.tsx, components/rating-stars.tsx
components/notification-bell.tsx, components/internal-messenger.tsx
components/chat-wrapper.tsx
CAMBIOS.md
```

## Archivos modificados (principales)

```
prisma/schema.prisma, prisma/seed.ts
app/api/auth/register|login|me/route.ts
app/api/products/route.ts, app/api/products/[id]/route.ts
app/api/profile/route.ts
components/auth-form.tsx, navbar.tsx, profile-content.tsx
components/request-dialog.tsx, checkout-dialog.tsx, publish-form.tsx
components/product-detail.tsx, product-card.tsx
app/mensajes/page.tsx, app/perfil/page.tsx
lib/data.ts, lib/products-db.ts, middleware.ts
```

---

## Cómo actualizar la base de datos

El esquema cambió de forma importante. En tu máquina ejecuta:

```bash
npx prisma migrate reset
# o, si prefieres conservar el archivo:
# Borra prisma/dev.db y luego:
npx prisma migrate dev --name platform_v2
npm run db:seed
npx prisma generate
npm run dev
```

En desarrollo, los **códigos de verificación** aparecen en la terminal donde corre `npm run dev` al registrarte.

---

## Cuentas de prueba

| Usuario | Contraseña |
|---------|------------|
| `admin@usmp.pe` | `admin12345` |
| `crojas@usmp.pe` | `usmp12345` |

Registra uno nuevo: `tu.nombre@usmp.pe` y verifica con el código de la consola.
