-- Migration 00005: seed industries catalog
-- Eight canonical industries, matching docs/DATA_MODEL.md.

insert into industries (slug, label) values
  ('fintech',    'Fintech'),
  ('proptech',   'Proptech'),
  ('healthtech', 'Healthtech'),
  ('edtech',     'Edtech'),
  ('logistics',  'Logística'),
  ('ecommerce',  'Ecommerce'),
  ('agtech',     'Agtech'),
  ('saas',       'SaaS')
on conflict (slug) do nothing;
