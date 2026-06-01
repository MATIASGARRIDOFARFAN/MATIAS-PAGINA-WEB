-- =============================================================================
-- USMP Market — Supabase / PostgreSQL schema
-- Basado en el análisis del proyecto PAGINA WEB (Next.js)
-- =============================================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUMS (valores exactos usados en lib/types.ts y lib/data.ts)
-- =============================================================================

CREATE TYPE product_status AS ENUM (
  'disponible', 'reservado', 'prestado', 'intercambiado', 'vendido'
);

CREATE TYPE product_condition AS ENUM ('nuevo', 'seminuevo', 'usado');

CREATE TYPE transaction_type AS ENUM ('venta', 'intercambio', 'ambos');

CREATE TYPE request_type AS ENUM ('compra', 'prestamo', 'intercambio');

CREATE TYPE request_status AS ENUM ('pendiente', 'aceptada', 'rechazada', 'completada');

CREATE TYPE report_status AS ENUM ('pendiente', 'resuelto');

CREATE TYPE user_role AS ENUM ('user', 'admin');

-- =============================================================================
-- PROFILES (extiende auth.users — sin passwordHash)
-- Campos deducidos de: auth-form, profile-content, publish-form, product-detail
-- =============================================================================

CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  name          TEXT NOT NULL GENERATED ALWAYS AS (trim(first_name || ' ' || last_name)) STORED,
  bio           TEXT,
  avatar_url    TEXT NOT NULL DEFAULT '/placeholder.svg',
  phone         TEXT,
  faculty       TEXT,
  career        TEXT,
  role          user_role NOT NULL DEFAULT 'user',
  suspended     BOOLEAN NOT NULL DEFAULT false,
  rating_avg    NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_count  INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT profiles_email_usmp CHECK (email ~* '^[a-z0-9]+(\.[a-z0-9]+)*@usmp\.pe$')
);

-- =============================================================================
-- PRODUCTS
-- Campos deducidos de: publish-form, edit-product-dialog, product-card, marketplace
-- =============================================================================

CREATE TABLE public.products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  price         NUMERIC(10,2) NOT NULL DEFAULT 0,
  images        JSONB NOT NULL DEFAULT '[]'::jsonb,
  category      TEXT NOT NULL,
  faculty       TEXT NOT NULL,
  career        TEXT NOT NULL,
  course        TEXT NOT NULL,
  condition     product_condition NOT NULL,
  transaction   transaction_type NOT NULL,
  status        product_status NOT NULL DEFAULT 'disponible',
  stock         INTEGER NOT NULL DEFAULT 1 CHECK (stock >= 1),
  location      TEXT NOT NULL,
  views         INTEGER NOT NULL DEFAULT 0,
  favorites     INTEGER NOT NULL DEFAULT 0,
  featured      BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- FAVORITES (falta en Prisma; UI en product-card, product-detail, favoritos)
-- =============================================================================

CREATE TABLE public.favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, product_id)
);

-- =============================================================================
-- MATERIAL REQUESTS (solicitudes de compra / préstamo / intercambio)
-- Campos deducidos de: request-dialog, checkout-dialog, api/requests
-- =============================================================================

CREATE TABLE public.material_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  requester_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type          request_type NOT NULL,
  status        request_status NOT NULL DEFAULT 'pendiente',
  message       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT material_requests_no_self CHECK (requester_id <> owner_id)
);

-- =============================================================================
-- CONVERSATIONS + MESSAGES
-- Campos deducidos de: internal-messenger, api/conversations
-- =============================================================================

CREATE TABLE public.conversations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       UUID REFERENCES public.products(id) ON DELETE SET NULL,
  participant1_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant2_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT conversations_no_self CHECK (participant1_id <> participant2_id),
  CONSTRAINT conversations_participant_order CHECK (participant1_id < participant2_id),
  UNIQUE (participant1_id, participant2_id, product_id)
);

CREATE TABLE public.messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content          TEXT NOT NULL,
  filtered         BOOLEAN NOT NULL DEFAULT false,
  filter_reason    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- NOTIFICATIONS
-- Campos deducidos de: notification-bell, lib/notifications.ts
-- =============================================================================

CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  read        BOOLEAN NOT NULL DEFAULT false,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- HISTORY
-- Campos deducidos de: historial/page.tsx, lib/history.ts
-- =============================================================================

CREATE TABLE public.history_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  related_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  product_id      UUID REFERENCES public.products(id) ON DELETE SET NULL,
  request_id      UUID REFERENCES public.material_requests(id) ON DELETE SET NULL,
  type            TEXT NOT NULL,
  status          TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- RATINGS
-- Campos deducidos de: api/ratings, rating-stars, profile-content
-- =============================================================================

CREATE TABLE public.user_ratings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_id    UUID REFERENCES public.material_requests(id) ON DELETE SET NULL,
  stars         SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT user_ratings_no_self CHECK (from_user_id <> to_user_id)
);

CREATE TABLE public.product_ratings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  request_id    UUID REFERENCES public.material_requests(id) ON DELETE SET NULL,
  stars         SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- REPORTS
-- Campos deducidos de: api/reports, admin/page.tsx
-- =============================================================================

CREATE TABLE public.reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_user_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  reason            TEXT NOT NULL,
  status            report_status NOT NULL DEFAULT 'pendiente',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT reports_has_target CHECK (
    target_user_id IS NOT NULL OR target_product_id IS NOT NULL
  )
);

-- =============================================================================
-- ÍNDICES
-- =============================================================================

CREATE INDEX idx_products_seller_id    ON public.products(seller_id);
CREATE INDEX idx_products_category     ON public.products(category);
CREATE INDEX idx_products_status       ON public.products(status);
CREATE INDEX idx_products_created_at   ON public.products(created_at DESC);
CREATE INDEX idx_products_faculty      ON public.products(faculty);
CREATE INDEX idx_products_career       ON public.products(career);

CREATE INDEX idx_favorites_user_id     ON public.favorites(user_id);
CREATE INDEX idx_favorites_product_id  ON public.favorites(product_id);

CREATE INDEX idx_material_requests_requester ON public.material_requests(requester_id);
CREATE INDEX idx_material_requests_owner     ON public.material_requests(owner_id);
CREATE INDEX idx_material_requests_status    ON public.material_requests(status);
CREATE INDEX idx_material_requests_product   ON public.material_requests(product_id);

CREATE INDEX idx_conversations_participant1 ON public.conversations(participant1_id);
CREATE INDEX idx_conversations_participant2 ON public.conversations(participant2_id);
CREATE INDEX idx_messages_conversation_id   ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at        ON public.messages(created_at);

CREATE INDEX idx_notifications_user_read    ON public.notifications(user_id, read);
CREATE INDEX idx_history_entries_user_id    ON public.history_entries(user_id);

CREATE INDEX idx_user_ratings_to_user       ON public.user_ratings(to_user_id);
CREATE INDEX idx_product_ratings_product    ON public.product_ratings(product_id);

CREATE INDEX idx_reports_status             ON public.reports(status);

-- =============================================================================
-- FUNCIONES AUXILIARES
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.is_usmp_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN email ~* '^[a-z0-9]+(\.[a-z0-9]+)*@usmp\.pe$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  fname TEXT;
  lname TEXT;
BEGIN
  IF NOT public.is_usmp_email(NEW.email) THEN
    RAISE EXCEPTION 'Solo se permiten correos @usmp.pe';
  END IF;

  fname := COALESCE(
    NEW.raw_user_meta_data->>'first_name',
    split_part(NEW.email, '.', 1)
  );
  lname := COALESCE(
    NEW.raw_user_meta_data->>'last_name',
    split_part(split_part(NEW.email, '@', 1), '.', 2)
  );

  INSERT INTO public.profiles (id, email, first_name, last_name, avatar_url)
  VALUES (
    NEW.id,
    lower(NEW.email),
    fname,
    COALESCE(NULLIF(lname, ''), fname)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET
    rating_avg   = COALESCE((SELECT AVG(stars)::numeric(3,2) FROM public.user_ratings WHERE to_user_id = NEW.to_user_id), 0),
    rating_count = (SELECT COUNT(*) FROM public.user_ratings WHERE to_user_id = NEW.to_user_id)
  WHERE id = NEW.to_user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_product_favorites_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.products SET favorites = favorites + 1 WHERE id = NEW.product_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.products SET favorites = GREATEST(favorites - 1, 0) WHERE id = OLD.product_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.touch_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER material_requests_updated_at
  BEFORE UPDATE ON public.material_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_user_rating_insert
  AFTER INSERT ON public.user_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_rating();

CREATE TRIGGER on_favorite_change
  AFTER INSERT OR DELETE ON public.favorites
  FOR EACH ROW EXECUTE FUNCTION public.update_product_favorites_count();

CREATE TRIGGER on_message_insert
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_conversation_on_message();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.history_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Helper: usuario autenticado es admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND suspended = false
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- PROFILES
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- PRODUCTS
CREATE POLICY "products_select_all" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "products_insert_own" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "products_update_own" ON public.products
  FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "products_delete_own" ON public.products
  FOR DELETE USING (auth.uid() = seller_id);

-- FAVORITES
CREATE POLICY "favorites_select_own" ON public.favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "favorites_insert_own" ON public.favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "favorites_delete_own" ON public.favorites
  FOR DELETE USING (auth.uid() = user_id);

-- MATERIAL REQUESTS
CREATE POLICY "requests_select_involved" ON public.material_requests
  FOR SELECT USING (auth.uid() IN (requester_id, owner_id));

CREATE POLICY "requests_insert_requester" ON public.material_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "requests_update_involved" ON public.material_requests
  FOR UPDATE USING (auth.uid() IN (requester_id, owner_id));

-- CONVERSATIONS
CREATE POLICY "conversations_select_participant" ON public.conversations
  FOR SELECT USING (auth.uid() IN (participant1_id, participant2_id));

CREATE POLICY "conversations_insert_participant" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() IN (participant1_id, participant2_id));

-- MESSAGES
CREATE POLICY "messages_select_participant" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND auth.uid() IN (c.participant1_id, c.participant2_id)
    )
  );

CREATE POLICY "messages_insert_sender" ON public.messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND auth.uid() IN (c.participant1_id, c.participant2_id)
    )
  );

-- NOTIFICATIONS
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- HISTORY
CREATE POLICY "history_select_own" ON public.history_entries
  FOR SELECT USING (auth.uid() = user_id);

-- USER RATINGS
CREATE POLICY "user_ratings_select_all" ON public.user_ratings
  FOR SELECT USING (true);

CREATE POLICY "user_ratings_insert_own" ON public.user_ratings
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- PRODUCT RATINGS
CREATE POLICY "product_ratings_select_all" ON public.product_ratings
  FOR SELECT USING (true);

CREATE POLICY "product_ratings_insert_own" ON public.product_ratings
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- REPORTS
CREATE POLICY "reports_insert_own" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "reports_select_admin" ON public.reports
  FOR SELECT USING (public.is_admin());

CREATE POLICY "reports_update_admin" ON public.reports
  FOR UPDATE USING (public.is_admin());

-- Admin puede ver/editar usuarios y productos
CREATE POLICY "profiles_admin_update" ON public.profiles
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "products_admin_delete" ON public.products
  FOR DELETE USING (public.is_admin());

-- =============================================================================
-- STORAGE BUCKETS (ejecutar en Supabase Dashboard o via API)
-- =============================================================================
-- Bucket: avatars        — público, imágenes de perfil
-- Bucket: product-images — público, imágenes de productos
--
-- Políticas Storage sugeridas:
--   avatars: INSERT/UPDATE/DELETE solo auth.uid() en path {user_id}/*
--   product-images: INSERT/UPDATE/DELETE solo seller del producto
