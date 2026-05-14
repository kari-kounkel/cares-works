-- =============================================================================
-- Minuteman Press Uptown — Phase 1 + Phase 3 Schema (DRAFT)
-- =============================================================================
-- Tag-driven storefront architecture: one master product catalog, filtered
-- per customer for branded storefronts. No separate sites — every customer
-- storefront is a query against the same tables with the customer's branding
-- overlay applied.
--
-- Target: Supabase / PostgreSQL 15+
-- Status: Draft v1 — for build planning, not yet applied
-- Companion to:  public/demo/mmp.html
-- =============================================================================


-- =============================================================================
-- Extensions
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =============================================================================
-- Enums
-- =============================================================================
CREATE TYPE customer_tier AS ENUM ('tier_1', 'tier_2', 'tier_3');

CREATE TYPE order_status AS ENUM (
  'new',            -- just placed, awaiting file review
  'file_review',    -- pre-press team is reviewing the uploaded file
  'approved',       -- file approved, queued for production
  'printing',       -- on press
  'finishing',      -- bindery / cutting / coating / lamination
  'ready',          -- ready for pickup or shipping
  'picked_up',
  'shipped',
  'cancelled',
  'refunded'
);

CREATE TYPE customer_user_role AS ENUM ('admin', 'employee', 'approver');

CREATE TYPE pre_press_status AS ENUM ('pending', 'approved', 'needs_revision');


-- =============================================================================
-- customers — branded storefront accounts (Tier 1 / 2 / 3)
-- One row per Phase 3 client. Their /shop/{slug} URL renders the master
-- catalog filtered to whatever's tagged for this customer.
-- =============================================================================
CREATE TABLE customers (
  id                  uuid          PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug                text          NOT NULL UNIQUE,
  name                text          NOT NULL,
  tier                customer_tier NOT NULL DEFAULT 'tier_1',

  -- branding (rendered on their storefront)
  primary_color       text,
  accent_color        text,
  accent_text_color   text,
  logo_storage_path   text,
  tagline             text,
  welcome_message     text,

  -- contact / billing
  contact_name        text,
  contact_email       text,
  contact_phone       text,
  monthly_fee         numeric(10,2),
  stripe_subscription_id text,

  -- routing — Tier 3 gets a wildcard subdomain {slug}.mmpuptown.com
  subdomain           text          UNIQUE,

  is_active           boolean       NOT NULL DEFAULT true,

  created_at          timestamptz   NOT NULL DEFAULT now(),
  updated_at          timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT subdomain_only_for_tier_3
    CHECK (subdomain IS NULL OR tier = 'tier_3')
);

CREATE INDEX idx_customers_slug      ON customers (slug)      WHERE is_active = true;
CREATE INDEX idx_customers_subdomain ON customers (subdomain) WHERE subdomain IS NOT NULL;


-- =============================================================================
-- products — master catalog (Frank's own products at MMP prices)
-- =============================================================================
CREATE TABLE products (
  id                          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku                         text NOT NULL UNIQUE,
  name                        text NOT NULL,
  category                    text,
  short_description           text,
  long_description            text,

  -- drives mockup template + production routing
  product_type                text,        -- 'bc', 'sign', 'postcard', 'folder', 'brochure'

  -- pricing
  master_price                numeric(10,2),
  pricing_tiers               jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- [{qty: 100, price: 22.00}, {qty: 250, price: 39.00}, ...]

  -- variants / options
  options                     jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- [{group: "Paper Stock", values: ["14pt Matte","14pt Gloss",...]}, ...]

  -- production
  standard_turnaround_days    integer DEFAULT 4,
  rush_available              boolean DEFAULT true,
  rush_surcharge              numeric(10,2),
  press_equipment             text,

  -- file requirements
  file_requirements           jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- {bleed: 0.125, min_dpi: 300, color_mode: "CMYK", accepted_types: ["pdf","ai","eps","psd","jpg","png"]}
  pre_press_review_required   boolean DEFAULT true,

  -- fulfillment
  pickup_available            boolean DEFAULT true,
  shipping_eligible           boolean DEFAULT true,
  shipping_flat_rate          numeric(10,2) DEFAULT 8.00,

  -- visibility
  show_on_master_catalog      boolean NOT NULL DEFAULT true,
  is_active                   boolean NOT NULL DEFAULT true,
  featured                    boolean NOT NULL DEFAULT false,

  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_active       ON products (is_active);
CREATE INDEX idx_products_category     ON products (category);
CREATE INDEX idx_products_featured     ON products (featured) WHERE featured = true;
CREATE INDEX idx_products_show_master  ON products (show_on_master_catalog)
  WHERE show_on_master_catalog = true AND is_active = true;


-- =============================================================================
-- product_customer_tags — many-to-many, the HEART of the architecture
-- "Which products appear on which branded storefront?"
-- Plus per-customer overrides: their price, their product name, their
-- template, their uploaded mockup. Null = inherit from master product.
-- =============================================================================
CREATE TABLE product_customer_tags (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id          uuid NOT NULL REFERENCES products(id)  ON DELETE CASCADE,
  customer_id         uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- per-customer overrides (NULL = inherit master)
  price_override          numeric(10,2),
  name_override           text,
  description_override    text,
  template_name           text,
  mockup_storage_path     text,

  is_active           boolean NOT NULL DEFAULT true,
  sort_order          integer NOT NULL DEFAULT 0,

  tagged_at           timestamptz NOT NULL DEFAULT now(),
  tagged_by           uuid REFERENCES auth.users(id),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  UNIQUE (product_id, customer_id)
);

CREATE INDEX idx_pct_product  ON product_customer_tags (product_id)  WHERE is_active = true;
CREATE INDEX idx_pct_customer ON product_customer_tags (customer_id) WHERE is_active = true;


-- =============================================================================
-- customer_users — Tier 3 SSO accounts (employees of the branded customer)
-- =============================================================================
CREATE TABLE customer_users (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id     uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  auth_user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            customer_user_role NOT NULL DEFAULT 'employee',
  display_name    text,
  created_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE (customer_id, auth_user_id)
);

CREATE INDEX idx_cu_customer ON customer_users (customer_id);
CREATE INDEX idx_cu_auth     ON customer_users (auth_user_id);


-- =============================================================================
-- orders
-- =============================================================================
CREATE TABLE orders (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number        text NOT NULL UNIQUE,

  -- buyer context
  customer_id         uuid REFERENCES customers(id),   -- NULL = direct MMP master order
  buyer_user_id       uuid REFERENCES auth.users(id),
  buyer_name          text NOT NULL,
  buyer_email         text NOT NULL,
  buyer_phone         text,

  -- amounts
  subtotal            numeric(10,2) NOT NULL,
  tax                 numeric(10,2) NOT NULL DEFAULT 0,
  shipping            numeric(10,2) NOT NULL DEFAULT 0,
  total               numeric(10,2) NOT NULL,

  -- fulfillment
  fulfillment_type    text NOT NULL DEFAULT 'pickup',  -- 'pickup' | 'ship'
  shipping_address    jsonb,

  status              order_status NOT NULL DEFAULT 'new',

  -- payment
  stripe_payment_intent_id  text,
  stripe_charge_id          text,
  paid_at                   timestamptz,

  -- notes
  buyer_notes         text,
  internal_notes      text,

  -- approval workflow (Tier 3 customers)
  approval_required   boolean NOT NULL DEFAULT false,
  approved_at         timestamptz,
  approved_by         uuid REFERENCES auth.users(id),

  ordered_at          timestamptz NOT NULL DEFAULT now(),
  fulfilled_at        timestamptz,
  cancelled_at        timestamptz,
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_status      ON orders (status);
CREATE INDEX idx_orders_customer    ON orders (customer_id)   WHERE customer_id IS NOT NULL;
CREATE INDEX idx_orders_ordered_at  ON orders (ordered_at DESC);


-- =============================================================================
-- order_items — snapshot at order time so historical orders survive product edits
-- =============================================================================
CREATE TABLE order_items (
  id                      uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id                uuid NOT NULL REFERENCES orders(id)   ON DELETE CASCADE,
  product_id              uuid NOT NULL REFERENCES products(id),
  customer_id             uuid REFERENCES customers(id),

  -- snapshot
  product_name            text NOT NULL,
  product_sku             text,
  quantity                integer NOT NULL,
  unit_price              numeric(10,2) NOT NULL,
  line_total              numeric(10,2) NOT NULL,
  options                 jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- customer-uploaded file
  upload_storage_path     text,
  upload_file_name        text,

  -- file review
  pre_press_status_value  pre_press_status NOT NULL DEFAULT 'pending',
  pre_press_notes         text,
  pre_press_reviewed_at   timestamptz,
  pre_press_reviewed_by   uuid REFERENCES auth.users(id),

  created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_items_order   ON order_items (order_id);
CREATE INDEX idx_order_items_product ON order_items (product_id);


-- =============================================================================
-- mockups — design/template files attached to a product or a customer×product tag
-- =============================================================================
CREATE TABLE mockups (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id          uuid REFERENCES products(id)  ON DELETE CASCADE,
  customer_id         uuid REFERENCES customers(id) ON DELETE CASCADE,

  storage_path        text NOT NULL,
  file_name           text NOT NULL,
  file_type           text,
  file_size_bytes     bigint,

  is_main             boolean NOT NULL DEFAULT false,
  caption             text,
  sort_order          integer NOT NULL DEFAULT 0,

  uploaded_at         timestamptz NOT NULL DEFAULT now(),
  uploaded_by         uuid REFERENCES auth.users(id),

  CONSTRAINT mockup_attached_to_something
    CHECK (product_id IS NOT NULL OR customer_id IS NOT NULL)
);

CREATE INDEX idx_mockups_product  ON mockups (product_id)  WHERE product_id  IS NOT NULL;
CREATE INDEX idx_mockups_customer ON mockups (customer_id) WHERE customer_id IS NOT NULL;


-- =============================================================================
-- Triggers — keep updated_at fresh
-- =============================================================================
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_customers_updated_at  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_products_updated_at   BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_pct_updated_at        BEFORE UPDATE ON product_customer_tags
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_orders_updated_at     BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =============================================================================
-- Views — the queries your storefront pages will hit
-- =============================================================================

-- Master catalog (Frank's public storefront at mmpuptown.com)
CREATE OR REPLACE VIEW v_master_catalog AS
SELECT p.*
FROM products p
WHERE p.is_active = true
  AND p.show_on_master_catalog = true
ORDER BY p.featured DESC, p.name;

-- Customer storefront catalog (everything visible at /shop/{slug})
-- Applies the per-customer overrides on top of master product fields.
CREATE OR REPLACE VIEW v_customer_catalog AS
SELECT
  c.id                                                  AS customer_id,
  c.slug                                                AS customer_slug,
  c.name                                                AS customer_name,
  c.primary_color,
  c.accent_color,
  c.accent_text_color,
  c.tier,
  p.id                                                  AS product_id,
  p.sku,
  p.product_type,
  p.category,
  COALESCE(pct.name_override,        p.name)            AS display_name,
  COALESCE(pct.description_override, p.short_description) AS display_description,
  COALESCE(pct.price_override,       p.master_price)    AS display_price,
  COALESCE(pct.template_name,        'Standard')        AS template_name,
  pct.mockup_storage_path,
  p.options,
  p.pricing_tiers,
  pct.sort_order
FROM customers c
JOIN product_customer_tags pct ON pct.customer_id = c.id
JOIN products p                ON p.id            = pct.product_id
WHERE c.is_active   = true
  AND p.is_active   = true
  AND pct.is_active = true
ORDER BY c.slug, pct.sort_order, p.name;


-- =============================================================================
-- Row-Level Security
-- =============================================================================

-- Helper: is the current auth user a MMP admin (Frank or staff)?
CREATE OR REPLACE FUNCTION is_mmp_admin() RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'mmp_admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: is the current user a member of this customer organization?
CREATE OR REPLACE FUNCTION is_customer_member(customer_uuid uuid) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM customer_users
    WHERE customer_id  = customer_uuid
      AND auth_user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

ALTER TABLE customers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE products               ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_customer_tags  ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE mockups                ENABLE ROW LEVEL SECURITY;

-- customers: anyone can read active ones; admin manages
CREATE POLICY customers_public_read ON customers
  FOR SELECT USING (is_active = true);
CREATE POLICY customers_admin_all   ON customers
  FOR ALL    USING (is_mmp_admin()) WITH CHECK (is_mmp_admin());

-- products: public read of active; admin manages
CREATE POLICY products_public_read ON products
  FOR SELECT USING (is_active = true);
CREATE POLICY products_admin_all   ON products
  FOR ALL    USING (is_mmp_admin()) WITH CHECK (is_mmp_admin());

-- tags: public read of active (the storefront filter needs this); admin manages
CREATE POLICY pct_public_read ON product_customer_tags
  FOR SELECT USING (is_active = true);
CREATE POLICY pct_admin_all   ON product_customer_tags
  FOR ALL    USING (is_mmp_admin()) WITH CHECK (is_mmp_admin());

-- customer_users: self, customer members, or MMP admin
CREATE POLICY customer_users_read ON customer_users
  FOR SELECT USING (
    is_mmp_admin()
    OR auth_user_id = auth.uid()
    OR is_customer_member(customer_id)
  );
CREATE POLICY customer_users_admin ON customer_users
  FOR ALL    USING (is_mmp_admin()) WITH CHECK (is_mmp_admin());

-- orders: buyer reads own, customer members read their org's, admin sees all
CREATE POLICY orders_read ON orders
  FOR SELECT USING (
    is_mmp_admin()
    OR buyer_user_id = auth.uid()
    OR (customer_id IS NOT NULL AND is_customer_member(customer_id))
  );
CREATE POLICY orders_insert ON orders
  FOR INSERT WITH CHECK (
    buyer_user_id = auth.uid() OR auth.uid() IS NULL  -- allow guest checkout
  );
CREATE POLICY orders_admin_all ON orders
  FOR ALL    USING (is_mmp_admin()) WITH CHECK (is_mmp_admin());

-- order_items inherit visibility from their parent order
CREATE POLICY order_items_read ON order_items
  FOR SELECT USING (
    is_mmp_admin()
    OR EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
        AND (o.buyer_user_id = auth.uid()
             OR (o.customer_id IS NOT NULL AND is_customer_member(o.customer_id)))
    )
  );
CREATE POLICY order_items_admin_all ON order_items
  FOR ALL    USING (is_mmp_admin()) WITH CHECK (is_mmp_admin());

-- mockups: public read (storefront imagery), admin manages
CREATE POLICY mockups_public_read ON mockups
  FOR SELECT USING (true);
CREATE POLICY mockups_admin_all   ON mockups
  FOR ALL    USING (is_mmp_admin()) WITH CHECK (is_mmp_admin());


-- =============================================================================
-- Storage buckets (create via Supabase Dashboard or storage.create_bucket)
-- =============================================================================
-- 'product-photos'    — public, MMP master catalog imagery
-- 'customer-logos'    — public, customer branding marks
-- 'customer-mockups'  — public, customer-specific product templates
-- 'order-uploads'     — PRIVATE, customer-uploaded print files
--                       (signed URLs only, scoped to buyer + MMP admins)


-- =============================================================================
-- Seed data — matches public/demo/mmp.html so the visual demo and the
-- database start with the same five fake customers and six master products.
-- =============================================================================
INSERT INTO customers
  (slug, name, tier, primary_color, accent_color, accent_text_color,
   tagline, welcome_message, contact_name, contact_email, monthly_fee, subdomain)
VALUES
  ('lakeshore',   'Lakeshore Realty',     'tier_2', '#0c4a6e', '#fbbf24', '#0c4a6e',
   'Marketing Materials Portal', 'Welcome, Lakeshore team.',
   'Sarah Pelletier', 'sarah@lakeshorere.com', 500.00, NULL),

  ('heritage',    'Heritage Insurance',   'tier_3', '#7c2d12', '#fbbf24', '#7c2d12',
   'Agent Print Hub', 'Welcome, Heritage team.',
   'Diane Wright', 'diane@heritageins.com', 850.00, 'heritage'),

  ('hagen-cpa',   'Mike Hagen CPA',       'tier_1', '#1e3a8a', '#fbbf24', '#1e3a8a',
   'Firm Print Portal', 'Welcome to Mike''s print catalog.',
   'Mike Hagen', 'mike@hagencpa.com', 300.00, NULL),

  ('uptown-yoga', 'Uptown Yoga Studio',   'tier_1', '#5b4636', '#d9b88a', '#5b4636',
   'Studio Print Portal', 'Welcome, yoga family.',
   'Maya Thornton', 'maya@uptownyoga.studio', 300.00, NULL),

  ('grace',       'Grace Church',         'tier_2', '#4c1d95', '#fbbf24', '#4c1d95',
   'Ministry Print Hub', 'Welcome, Grace Church team.',
   'James Whitman', 'jw@gracechurch.org', 500.00, NULL);


INSERT INTO products
  (sku, name, category, short_description, master_price, product_type,
   standard_turnaround_days, featured)
VALUES
  ('BC-14PT-GLS',  'Premium Business Cards | 14pt Gloss', 'Business Cards',
   '250 pieces, full color, double-sided',  39.00, 'bc',       4, true),
  ('BR-TRI-100',   'Tri-Fold Brochures | 100lb Gloss Text','Flyers & Brochures',
   '100 pieces, full color, two-sided',    129.00, 'brochure', 4, true),
  ('BN-VYL-36',    'Vinyl Banner | 3'' x 6'' with Grommets','Banners & Signs',
   'Single banner, full color, indoor/outdoor', 89.00, 'sign', 5, true),
  ('PC-100GL',     'Postcards | 100lb Gloss Cover',       'Postcards',
   '100 pieces, full color, double-sided',  59.00, 'postcard', 4, true),
  ('YS-CORO-1824', 'Yard Signs | 4mm Coroplast',          'Yard Signs',
   'Single sign, full color, with H-stake', 24.00, 'sign',     3, true),
  ('LH-70-PREM',   'Letterhead | 70lb Premium Text',      'Letterhead',
   '250 sheets, full color, single-sided',  79.00, 'folder',   4, true);


-- Example tag operations — show how a customer storefront gets populated.
-- The Phase 3 admin workflow: pick a product, check off which customers
-- should see it. Each row here = one checkbox flipped in the demo.

-- Lakeshore Realty (Tier 2): full real estate kit
INSERT INTO product_customer_tags
  (product_id, customer_id, name_override, price_override, template_name, sort_order)
SELECT p.id, c.id, 'Agent Business Cards',             39.00, 'LR Template', 1 FROM products p, customers c WHERE p.sku='BC-14PT-GLS'  AND c.slug='lakeshore'
UNION ALL
SELECT p.id, c.id, 'Open House Yard Sign 18x24',       24.00, 'LR Template', 2 FROM products p, customers c WHERE p.sku='YS-CORO-1824' AND c.slug='lakeshore'
UNION ALL
SELECT p.id, c.id, 'Listing Postcards 4x6',            59.00, 'LR Template', 3 FROM products p, customers c WHERE p.sku='PC-100GL'     AND c.slug='lakeshore'
UNION ALL
SELECT p.id, c.id, 'Tri-Fold Listing Brochures',      129.00, 'LR Template', 4 FROM products p, customers c WHERE p.sku='BR-TRI-100'   AND c.slug='lakeshore';

-- Heritage Insurance (Tier 3): policy materials + agent collateral
INSERT INTO product_customer_tags
  (product_id, customer_id, name_override, price_override, template_name, sort_order)
SELECT p.id, c.id, 'Agent Business Cards',  59.00, 'HI Template', 1 FROM products p, customers c WHERE p.sku='BC-14PT-GLS' AND c.slug='heritage'
UNION ALL
SELECT p.id, c.id, 'Letterhead | Agent Branded', 145.00, 'HI Template', 2 FROM products p, customers c WHERE p.sku='LH-70-PREM' AND c.slug='heritage';

-- Mike Hagen CPA (Tier 1): just enough for tax season
INSERT INTO product_customer_tags
  (product_id, customer_id, name_override, price_override, template_name, sort_order)
SELECT p.id, c.id, 'CPA Business Cards', 59.00, 'MH Template', 1 FROM products p, customers c WHERE p.sku='BC-14PT-GLS' AND c.slug='hagen-cpa'
UNION ALL
SELECT p.id, c.id, 'Firm Letterhead',    94.00, 'MH Template', 2 FROM products p, customers c WHERE p.sku='LH-70-PREM'  AND c.slug='hagen-cpa';


-- =============================================================================
-- Try-it query — after running this, point a storefront at it like:
--   SELECT * FROM v_customer_catalog WHERE customer_slug = 'lakeshore';
--
-- That single query is what GET /shop/lakeshore hits. The branded view
-- applies primary_color/accent_color on top, renders each product mockup
-- from product_type + customer branding, and shows display_price.
-- =============================================================================
