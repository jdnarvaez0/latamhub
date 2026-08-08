-- Seed data for COL/LABS (latamhub).
-- Transformed from the frozen Lovable prototype
-- (colombia-startup-hub/src/data/startups.ts) using the documented mappings:
--   industry  : "Fintech" -> "fintech", "Proptech" -> "proptech", etc.
--   country   : "Colombia" -> "CO"
--   stage     : "Semilla" -> "seed", "Serie A" -> "series-a", etc.
--   modality  : "Remoto" -> "remote", "Híbrido" -> "hybrid", "Presencial" -> "onsite"
-- All startups are inserted as 'approved' so the public directory is populated
-- from day one. The seed is re-runnable: it truncates the two tables first.

truncate table jobs, startups restart identity cascade;

insert into startups (name, slug, description, long_description, website, country, city, industry, stage, founded_year, employee_range, investors, status) values
  ('Rappi', 'rappi',
   'La super-app latinoamericana que conecta a millones de usuarios con domicilios, pagos y servicios financieros.',
   'Nacida en Bogotá, Rappi se convirtió en el primer unicornio colombiano y hoy opera en nueve países. Su plataforma combina delivery, marketplace, publicidad retail y una vertical financiera propia.',
   'https://rappi.com', 'CO', 'Bogotá', 'ecommerce', 'series-b+', 2015, '200+',
   '["SoftBank", "Y Combinator", "Sequoia", "DST Global"]'::jsonb, 'approved'),

  ('Habi', 'habi',
   'Compra y venta de vivienda usada con precios instantáneos calculados con datos de mercado propios.',
   'Habi construyó la base de datos inmobiliaria más completa de Colombia y México para darle liquidez a un mercado históricamente lento: compra directamente el inmueble y lo revende en semanas.',
   'https://habi.co', 'CO', 'Bogotá', 'proptech', 'series-b+', 2019, '200+',
   '["SoftBank", "Tiger Global", "Homebrew", "Inspired Capital"]'::jsonb, 'approved'),

  ('Addi', 'addi',
   'Crédito de consumo en el punto de venta: compra ahora y paga después para comercios colombianos.',
   'Addi otorga crédito instantáneo en checkout usando modelos de riesgo alternativos, ampliando el acceso financiero a personas sin historial crediticio tradicional.',
   'https://addi.com', 'CO', 'Bogotá', 'fintech', 'series-b+', 2018, '200+',
   '["Andreessen Horowitz", "Union Square Ventures", "Monashees"]'::jsonb, 'approved'),

  ('Bold', 'bold',
   'Datáfonos y pagos digitales sin cuota mensual para micro y pequeños comercios en todo el país.',
   'Bold democratizó la aceptación de pagos con tarjeta en Colombia: dispositivos económicos, liquidación rápida y una cuenta de negocio integrada.',
   'https://bold.co', 'CO', 'Bogotá', 'fintech', 'series-a', 2019, '200+',
   '["Tiger Global", "Endeavor Catalyst", "General Atlantic"]'::jsonb, 'approved'),

  ('Laika', 'laika',
   'Ecommerce y servicios veterinarios para mascotas con suscripciones de alimento y domicilios en el día.',
   'Laika combina retail online, telemedicina veterinaria y una comunidad de dueños de mascotas, con operación logística propia en las principales ciudades.',
   'https://laika.com.co', 'CO', 'Bogotá', 'ecommerce', 'series-a', 2017, '51-200',
   '["Kaszek", "IDC Ventures", "Cometa"]'::jsonb, 'approved'),

  ('Chiper', 'chiper',
   'Marketplace mayorista que abastece tiendas de barrio saltándose intermediarios de la cadena tradicional.',
   'Chiper digitaliza el canal tradicional: el tendero pide desde una app y recibe al día siguiente a precios de mayorista, con crédito y analítica de surtido.',
   'https://chiper.co', 'CO', 'Bogotá', 'logistics', 'series-b+', 2018, '200+',
   '["WIND Ventures", "Kaszek", "Bluepointe"]'::jsonb, 'approved'),

  ('Frubana', 'frubana',
   'Suministro de alimentos frescos del campo directo a restaurantes, sin intermediarios ni desperdicio.',
   'Frubana conecta agricultores con restaurantes usando predicción de demanda y centros de acopio propios, reduciendo mermas y estabilizando precios de compra.',
   'https://frubana.com', 'CO', 'Medellín', 'agtech', 'series-b+', 2018, '200+',
   '["Tiger Global", "GGV Capital", "Y Combinator"]'::jsonb, 'approved'),

  ('La Haus', 'la-haus',
   'Plataforma de compra de vivienda nueva con acompañamiento financiero de punta a punta.',
   'La Haus digitalizó la venta de proyectos sobre planos en Colombia y México, integrando búsqueda, visita, separación y crédito hipotecario en un solo flujo.',
   'https://lahaus.com', 'CO', 'Medellín', 'proptech', 'series-b+', 2017, '200+',
   '["Bezos Expeditions", "Greenspring", "Kaszek", "Acrew"]'::jsonb, 'approved'),

  ('Treinta', 'treinta',
   'App de contabilidad y gestión para pequeños negocios: ventas, gastos, inventario y fiado en un solo lugar.',
   'Treinta reemplaza el cuaderno del tendero con una app gratuita y monetiza a través de servicios financieros y catálogo digital para más de un millón de negocios.',
   'https://treinta.co', 'CO', 'Bogotá', 'saas', 'series-a', 2020, '51-200',
   '["Y Combinator", "GFC", "Andreessen Horowitz"]'::jsonb, 'approved'),

  ('Ubits', 'ubits',
   'Plataforma de formación corporativa en español con rutas de aprendizaje medibles por competencia.',
   'Ubits produce contenido propio con expertos latinoamericanos y le entrega a RR.HH. métricas reales de adopción e impacto del aprendizaje.',
   'https://ubits.co', 'CO', 'Bogotá', 'edtech', 'series-a', 2017, '51-200',
   '["Riverwood", "Owl Ventures", "Reach Capital"]'::jsonb, 'approved'),

  ('1DOC3', '1doc3',
   'Orientación médica digital anónima y telemedicina para millones de usuarios hispanohablantes.',
   '1DOC3 resuelve dudas de salud en minutos con médicos verificados y modelos de triage, atendiendo especialmente temas sensibles con anonimato garantizado.',
   'https://1doc3.com', 'CO', 'Cali', 'healthtech', 'seed', 2013, '11-50',
   '["Y Combinator", "Simma Capital", "Rockstart"]'::jsonb, 'approved'),

  ('Muni', 'muni',
   'Compras comunitarias de productos de canasta básica con entrega a través de líderes de barrio.',
   'Muni agrupa la demanda de un vecindario para negociar mejores precios y entregar en un solo punto, reduciendo costo logístico y precio final.',
   'https://muni.com.co', 'CO', 'Bogotá', 'ecommerce', 'series-a', 2019, '51-200',
   '["Monashees", "Y Combinator", "Tiger Global"]'::jsonb, 'approved'),

  ('Siembra Viva', 'siembra-viva',
   'Mercado orgánico directo del campesino a la mesa con trazabilidad completa de cada cosecha.',
   'Siembra Viva trabaja con pequeños productores certificados en Antioquia, planifica siembras según demanda y entrega en menos de 48 horas desde la cosecha.',
   'https://siembraviva.com', 'CO', 'Medellín', 'agtech', 'bootstrapped', 2014, '11-50',
   '["Velum Ventures", "Fondo Emprender"]'::jsonb, 'approved'),

  ('Lineru', 'lineru',
   'Créditos de bajo monto 100% en línea aprobados en minutos con scoring alternativo.',
   'Lineru atiende a personas fuera del sistema bancario tradicional con préstamos pequeños, desembolso inmediato y un modelo de riesgo entrenado con datos locales.',
   'https://lineru.com', 'CO', 'Bogotá', 'fintech', 'series-a', 2013, '51-200',
   '["IFC", "Oikocredit"]'::jsonb, 'approved'),

  ('Liftit', 'liftit',
   'Red de transporte de carga bajo demanda con conductores verificados y seguimiento en vivo.',
   'Liftit digitaliza el transporte terrestre B2B en Latinoamérica: cotización automática, asignación inteligente de vehículos y visibilidad total del viaje.',
   'https://liftit.co', 'CO', 'Bogotá', 'logistics', 'series-a', 2017, '51-200',
   '["Jaguar Ventures", "IFC", "monashees"]'::jsonb, 'approved'),

  ('Sempli', 'sempli',
   'Financiación digital para pymes con decisiones de crédito en 48 horas y sin trámites bancarios.',
   'Sempli analiza el flujo de caja real de pequeñas y medianas empresas colombianas para otorgar capital de trabajo que la banca tradicional no cubre.',
   'https://sempli.co', 'CO', 'Medellín', 'fintech', 'series-a', 2016, '11-50',
   '["Oikocredit", "Incofin", "Velum Ventures"]'::jsonb, 'approved'),

  ('Foodology', 'foodology',
   'Cocinas ocultas que operan marcas digitales de comida optimizadas por datos de demanda.',
   'Foodology opera decenas de marcas virtuales desde cocinas compartidas en Colombia, México y Perú, ajustando menús y ubicaciones según datos de pedidos.',
   'https://foodology.com.co', 'CO', 'Bogotá', 'ecommerce', 'series-a', 2019, '200+',
   '["Andreessen Horowitz", "Kaszek", "Y Combinator"]'::jsonb, 'approved'),

  ('Bunky', 'bunky',
   'Software de gestión para coworkings y edificios multifamiliares con reservas y cobros automáticos.',
   'Bunky nació en Bucaramanga para administrar espacios compartidos: control de acceso, facturación recurrente y analítica de ocupación en una sola consola.',
   'https://bunky.co', 'CO', 'Bucaramanga', 'saas', 'seed', 2021, '1-10',
   '["Rockstart", "Ángeles locales"]'::jsonb, 'approved'),

  ('Acsendo', 'acsendo',
   'Evaluación de desempeño y clima laboral para equipos de recursos humanos en Latinoamérica.',
   'Acsendo le da a RR.HH. herramientas de objetivos, competencias y encuestas de clima con analítica comparable entre áreas y periodos.',
   'https://acsendo.com', 'CO', 'Bogotá', 'saas', 'bootstrapped', 2011, '11-50',
   '["Bootstrapped"]'::jsonb, 'approved'),

  ('Colegium', 'colegium',
   'Plataforma académica para colegios privados: notas, comunicación con familias y cartera.',
   'Colegium atiende instituciones de la Costa Caribe con un sistema académico y financiero pensado para colegios medianos que aún trabajan en hojas de cálculo.',
   'https://colegium.co', 'CO', 'Barranquilla', 'edtech', 'seed', 2018, '1-10',
   '["Ángeles locales"]'::jsonb, 'approved');

-- Jobs: 31 vacancies across 19 startups (Muni has none). apply_url defaults to
-- the startup website so seeded jobs always point somewhere real.
with startup_ids as (
  select id, slug, website from startups
)
insert into jobs (startup_id, title, area, location, modality, salary_range, apply_url, status)
select s.id, j.title, j.area, j.location, j.modality, j.salary_range, s.website, 'active'
from startup_ids s
join (
  values
    ('rappi',     'Senior Backend Engineer',  'Ingeniería',  'Bogotá',      'remote',  'USD 5k - 7k'),
    ('rappi',     'Data Scientist',           'Datos',       'Bogotá',      'hybrid',  'COP 14M - 18M'),
    ('rappi',     'Product Designer',         'Producto',    'Bogotá',      'hybrid',  'COP 11M - 15M'),
    ('habi',      'Analista de Pricing',      'Datos',       'Bogotá',      'onsite',  'COP 6M - 9M'),
    ('habi',      'Frontend Engineer',        'Ingeniería',  'Remoto',      'remote',  'COP 10M - 14M'),
    ('addi',      'Risk Modeling Lead',       'Riesgo',      'Bogotá',      'hybrid',  'USD 4k - 6k'),
    ('addi',      'Android Engineer',         'Ingeniería',  'Remoto',      'remote',  'USD 3.5k - 5k'),
    ('addi',      'Compliance Analyst',       'Legal',       'Bogotá',      'onsite',  'COP 7M - 9M'),
    ('bold',      'Growth Marketing Lead',    'Marketing',   'Bogotá',      'hybrid',  'COP 12M+'),
    ('bold',      'SRE',                      'Ingeniería',  'Remoto',      'remote',  'USD 4k - 5.5k'),
    ('laika',     'Category Manager',         'Comercial',   'Bogotá',      'onsite',  'COP 6M - 8M'),
    ('chiper',    'Operations Manager',       'Operaciones', 'Bogotá',      'onsite',  'COP 8M - 11M'),
    ('chiper',    'Data Analyst',             'Datos',       'Bogotá',      'hybrid',  'COP 7M - 10M'),
    ('frubana',   'Supply Chain Lead',        'Operaciones', 'Medellín',    'onsite',  'COP 10M - 13M'),
    ('frubana',   'Backend Engineer (Go)',    'Ingeniería',  'Remoto',      'remote',  'USD 4k - 6k'),
    ('la-haus',   'Senior Product Manager',   'Producto',    'Medellín',    'hybrid',  'USD 4k - 6k'),
    ('la-haus',   'Asesor Comercial Senior',  'Comercial',   'Medellín',    'onsite',  'COP 5M + comisión'),
    ('treinta',   'Mobile Engineer (Flutter)','Ingeniería',  'Remoto',      'remote',  'USD 3k - 4.5k'),
    ('treinta',   'Customer Success Lead',    'Soporte',     'Bogotá',      'hybrid',  'COP 6M - 8M'),
    ('ubits',     'Instructional Designer',   'Contenido',   'Bogotá',      'hybrid',  'COP 5M - 7M'),
    ('ubits',     'Account Executive',        'Comercial',   'Bogotá',      'onsite',  'COP 5M + comisión'),
    ('1doc3',     'Médico General (turnos)',  'Salud',       'Remoto',      'remote',  'COP 5M - 7M'),
    ('1doc3',     'Full Stack Engineer',      'Ingeniería',  'Remoto',      'remote',  'COP 9M - 12M'),
    ('siembra-viva', 'Coordinador de Cosecha','Operaciones', 'Medellín',    'onsite',  'COP 3.5M - 5M'),
    ('lineru',    'Data Engineer',            'Datos',       'Bogotá',      'hybrid',  'COP 9M - 12M'),
    ('liftit',    'Fleet Operations Analyst', 'Operaciones', 'Bogotá',      'onsite',  'COP 4M - 6M'),
    ('liftit',    'QA Engineer',              'Ingeniería',  'Remoto',      'remote',  'COP 7M - 10M'),
    ('sempli',    'Analista de Crédito Pyme', 'Riesgo',      'Medellín',    'hybrid',  'COP 4.5M - 6M'),
    ('foodology', 'Chef Corporativo',         'Operaciones', 'Bogotá',      'onsite',  'COP 6M - 8M'),
    ('foodology', 'Growth Analyst',           'Marketing',   'Bogotá',      'hybrid',  'COP 6M - 9M'),
    ('bunky',     'Fullstack Developer',      'Ingeniería',  'Bucaramanga', 'hybrid',  'COP 6M - 9M'),
    ('acsendo',   'Implementation Consultant','Soporte',     'Remoto',      'remote',  'COP 5M - 7M'),
    ('colegium',  'Soporte Técnico Educativo','Soporte',     'Barranquilla','onsite', 'COP 3M - 4.5M')
) as j(startup_slug, title, area, location, modality, salary_range)
  on j.startup_slug = s.slug;
