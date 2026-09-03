/**
 * Curated catalog of Colombian startups for the COL/LABS ingestion pipeline.
 *
 * Each entry defines:
 *  - Core startup metadata (upserted to `startups` table)
 *  - A `jobSources` array describing where to fetch open roles
 *
 * Supported job source types:
 *  - "greenhouse"  → https://boards-api.greenhouse.io/v1/boards/{boardToken}/jobs
 *  - "lever"       → https://api.lever.co/v0/postings/{company}?mode=json
 *  - "workable"    → https://apply.workable.com/api/v1/widget/jobs/?account={account}
 *  - "ashby"       → https://jobs.ashbyhq.com/api/non-user-facing/job-board/jobs?organizationHostedJobsPageName={slug}
 *  - "careers_url" → Fallback: direct URL to the company careers page (no API, listed for reference)
 *
 * Industry slugs must match the `industries` table (seeded in 00005_seed_industries.sql):
 *   fintech | proptech | ecommerce | logistics | agtech | edtech | healthtech
 *   hrtech | saas | marketplace | legaltech | traveltech | cleantech | other
 *
 * Stage slugs: pre-seed | seed | series-a | series-b+ | bootstrapped
 * Modality slugs: remote | hybrid | onsite
 */

export type JobSourceType =
  | "greenhouse"
  | "lever"
  | "workable"
  | "ashby"
  | "careers_url";

export interface JobSource {
  type: JobSourceType;
  /** Token/slug/account used to build the API URL */
  token: string;
}

export interface StartupEntry {
  /** Matches the `slug` column — used as upsert key */
  slug: string;
  name: string;
  description: string;
  longDescription?: string;
  website: string;
  linkedinUrl?: string;
  logoUrl?: string;
  country: "CO" | "BR" | "CL" | "AR" | "MX";
  city: string;
  industry: string;
  stage?: "pre-seed" | "seed" | "series-a" | "series-b+" | "bootstrapped";
  foundedYear?: number;
  employeeRange?: string;
  investors?: string[];
  jobSources: JobSource[];
}

export const STARTUPS_CATALOG: StartupEntry[] = [
  // ─── Unicornios / Serie B+ ───────────────────────────────────────────────
  {
    slug: "rappi",
    name: "Rappi",
    description:
      "Super-app latinoamericana de delivery, pagos y servicios financieros que opera en nueve países.",
    longDescription:
      "Nacida en Bogotá en 2015, Rappi fue el primer unicornio colombiano. Su plataforma combina delivery on-demand, marketplace, publicidad retail y una vertical financiera propia (RappiPay). Opera en Colombia, México, Brasil, Argentina, Chile, Perú, Ecuador, Uruguay y Costa Rica.",
    website: "https://rappi.com",
    linkedinUrl: "https://www.linkedin.com/company/rappi",
    country: "CO",
    city: "Bogotá",
    industry: "ecommerce",
    stage: "series-b+",
    foundedYear: 2015,
    employeeRange: "200+",
    investors: ["SoftBank", "Y Combinator", "Sequoia", "DST Global"],
    jobSources: [
      { type: "lever", token: "rappi" },
      { type: "greenhouse", token: "rappi" },
      { type: "careers_url", token: "https://careers.rappi.com" },
    ],
  },
  {
    slug: "habi",
    name: "Habi",
    description:
      "Compra y venta de vivienda usada con precios instantáneos calculados con datos de mercado propios.",
    longDescription:
      "Habi construyó la base de datos inmobiliaria más completa de Colombia y México. Compra directamente el inmueble y lo revende en semanas, dándole liquidez a un mercado históricamente lento.",
    website: "https://habi.co",
    linkedinUrl: "https://www.linkedin.com/company/habi-tech",
    country: "CO",
    city: "Bogotá",
    industry: "proptech",
    stage: "series-b+",
    foundedYear: 2019,
    employeeRange: "200+",
    investors: ["SoftBank", "Tiger Global", "Homebrew", "Inspired Capital"],
    jobSources: [
      { type: "greenhouse", token: "habi" },
      { type: "lever", token: "habi" },
      { type: "careers_url", token: "https://habi.co/careers" },
    ],
  },
  {
    slug: "addi",
    name: "Addi",
    description:
      "Crédito de consumo en el punto de venta: compra ahora y paga después para comercios colombianos.",
    longDescription:
      "Addi otorga crédito instantáneo en checkout usando modelos de riesgo alternativos, ampliando el acceso financiero a personas sin historial crediticio tradicional.",
    website: "https://addi.com",
    linkedinUrl: "https://www.linkedin.com/company/addico",
    country: "CO",
    city: "Bogotá",
    industry: "fintech",
    stage: "series-b+",
    foundedYear: 2018,
    employeeRange: "200+",
    investors: [
      "Andreessen Horowitz",
      "Union Square Ventures",
      "Monashees",
    ],
    jobSources: [
      { type: "greenhouse", token: "addi" },
      { type: "lever", token: "addi" },
      { type: "ashby", token: "addi" },
      { type: "careers_url", token: "https://addi.com/careers" },
    ],
  },
  {
    slug: "bold",
    name: "Bold",
    description:
      "Datáfonos y pagos digitales sin cuota mensual para micro y pequeños comercios en todo el país.",
    longDescription:
      "Bold democratizó la aceptación de pagos con tarjeta en Colombia con dispositivos económicos, liquidación rápida y una cuenta de negocio integrada.",
    website: "https://bold.co",
    linkedinUrl: "https://www.linkedin.com/company/bold-co",
    country: "CO",
    city: "Bogotá",
    industry: "fintech",
    stage: "series-a",
    foundedYear: 2019,
    employeeRange: "200+",
    investors: ["Tiger Global", "Endeavor Catalyst", "General Atlantic"],
    jobSources: [
      { type: "greenhouse", token: "boldco" },
      { type: "lever", token: "bold-co" },
      { type: "workable", token: "bold-co" },
      { type: "careers_url", token: "https://bold.co/careers" },
    ],
  },
  {
    slug: "laika",
    name: "Laika",
    description:
      "Ecommerce y servicios veterinarios para mascotas con suscripciones de alimento y domicilios en el día.",
    longDescription:
      "Laika combina retail online, telemedicina veterinaria y comunidad de dueños de mascotas, con logística propia en las principales ciudades colombianas.",
    website: "https://laika.com.co",
    linkedinUrl: "https://www.linkedin.com/company/laika-co",
    country: "CO",
    city: "Bogotá",
    industry: "ecommerce",
    stage: "series-a",
    foundedYear: 2017,
    employeeRange: "51-200",
    investors: ["Kaszek", "IDC Ventures", "Cometa"],
    jobSources: [
      { type: "greenhouse", token: "laika" },
      { type: "lever", token: "laika" },
      { type: "careers_url", token: "https://laika.com.co/careers" },
    ],
  },
  {
    slug: "chiper",
    name: "Chiper",
    description:
      "Marketplace mayorista que abastece tiendas de barrio saltándose intermediarios de la cadena tradicional.",
    longDescription:
      "Chiper digitaliza el canal tradicional: el tendero pide desde una app y recibe al día siguiente a precios de mayorista, con crédito y analítica de surtido.",
    website: "https://chiper.co",
    linkedinUrl: "https://www.linkedin.com/company/chiperapp",
    country: "CO",
    city: "Bogotá",
    industry: "logistics",
    stage: "series-b+",
    foundedYear: 2018,
    employeeRange: "200+",
    investors: ["WIND Ventures", "Kaszek", "Bluepointe"],
    jobSources: [
      { type: "greenhouse", token: "chiper" },
      { type: "lever", token: "chiper" },
      { type: "careers_url", token: "https://chiper.co/careers" },
    ],
  },
  {
    slug: "frubana",
    name: "Frubana",
    description:
      "Suministro de alimentos frescos del campo directo a restaurantes, sin intermediarios ni desperdicio.",
    longDescription:
      "Frubana conecta agricultores con restaurantes usando predicción de demanda y centros de acopio propios, reduciendo mermas y estabilizando precios de compra.",
    website: "https://frubana.com",
    linkedinUrl: "https://www.linkedin.com/company/frubana",
    country: "CO",
    city: "Medellín",
    industry: "agtech",
    stage: "series-b+",
    foundedYear: 2018,
    employeeRange: "200+",
    investors: ["Tiger Global", "GGV Capital", "Y Combinator"],
    jobSources: [
      { type: "greenhouse", token: "frubana" },
      { type: "lever", token: "frubana" },
      { type: "careers_url", token: "https://frubana.com/careers" },
    ],
  },
  {
    slug: "la-haus",
    name: "La Haus",
    description:
      "Plataforma de compra de vivienda nueva con acompañamiento financiero de punta a punta.",
    longDescription:
      "La Haus digitalizó la venta de proyectos sobre planos en Colombia y México, integrando búsqueda, visita, separación y crédito hipotecario en un solo flujo.",
    website: "https://lahaus.com",
    linkedinUrl: "https://www.linkedin.com/company/la-haus",
    country: "CO",
    city: "Medellín",
    industry: "proptech",
    stage: "series-b+",
    foundedYear: 2017,
    employeeRange: "200+",
    investors: [
      "Bezos Expeditions",
      "Greenspring",
      "Kaszek",
      "Acrew",
    ],
    jobSources: [
      { type: "greenhouse", token: "lahaus" },
      { type: "lever", token: "la-haus" },
      { type: "careers_url", token: "https://lahaus.com/careers" },
    ],
  },
  // ─── Serie A / Seed ──────────────────────────────────────────────────────
  {
    slug: "treinta",
    name: "Treinta",
    description:
      "App de contabilidad simple para tenderos y microempresarios que reemplaza el cuaderno de cuentas.",
    website: "https://treinta.co",
    linkedinUrl: "https://www.linkedin.com/company/treinta-co",
    country: "CO",
    city: "Bogotá",
    industry: "fintech",
    stage: "series-a",
    foundedYear: 2020,
    employeeRange: "51-200",
    investors: ["Tiger Global", "Kaszek", "Y Combinator"],
    jobSources: [
      { type: "greenhouse", token: "treinta" },
      { type: "lever", token: "treinta" },
      { type: "careers_url", token: "https://treinta.co/careers" },
    ],
  },
  {
    slug: "ubits",
    name: "Ubits",
    description:
      "Plataforma B2B de capacitación corporativa en español para América Latina.",
    website: "https://ubits.com",
    linkedinUrl: "https://www.linkedin.com/company/ubits",
    country: "CO",
    city: "Bogotá",
    industry: "edtech",
    stage: "series-a",
    foundedYear: 2018,
    employeeRange: "51-200",
    investors: ["Softbank", "Monashees"],
    jobSources: [
      { type: "greenhouse", token: "ubits" },
      { type: "lever", token: "ubits" },
      { type: "careers_url", token: "https://ubits.com/careers" },
    ],
  },
  {
    slug: "1doc3",
    name: "1Doc3",
    description:
      "Telemedicina que conecta pacientes con médicos certificados en minutos, 24/7.",
    website: "https://1doc3.com",
    linkedinUrl: "https://www.linkedin.com/company/1doc3",
    country: "CO",
    city: "Bogotá",
    industry: "healthtech",
    stage: "series-a",
    foundedYear: 2015,
    employeeRange: "51-200",
    investors: ["Accel", "Kaszek"],
    jobSources: [
      { type: "greenhouse", token: "1doc3" },
      { type: "lever", token: "1doc3" },
      { type: "careers_url", token: "https://1doc3.com/careers" },
    ],
  },
  {
    slug: "lineru",
    name: "Lineru",
    description:
      "Créditos de consumo 100% digitales aprobados en minutos para colombianos sin trámites.",
    website: "https://lineru.com",
    linkedinUrl: "https://www.linkedin.com/company/lineru",
    country: "CO",
    city: "Bogotá",
    industry: "fintech",
    stage: "series-a",
    foundedYear: 2012,
    employeeRange: "51-200",
    investors: ["Accion Venture Lab", "IFC"],
    jobSources: [
      { type: "lever", token: "lineru" },
      { type: "greenhouse", token: "lineru" },
      { type: "careers_url", token: "https://lineru.com/careers" },
    ],
  },
  {
    slug: "liftit",
    name: "Liftit",
    description:
      "Plataforma de logística de última milla que conecta transportadores con empresas en tiempo real.",
    website: "https://liftit.co",
    linkedinUrl: "https://www.linkedin.com/company/liftit",
    country: "CO",
    city: "Bogotá",
    industry: "logistics",
    stage: "series-b+",
    foundedYear: 2016,
    employeeRange: "200+",
    investors: ["IFC", "Cavallo Ventures", "Soros Economic Development Fund"],
    jobSources: [
      { type: "greenhouse", token: "liftit" },
      { type: "lever", token: "liftit" },
      { type: "careers_url", token: "https://liftit.co/careers" },
    ],
  },
  {
    slug: "sempli",
    name: "Sempli",
    description:
      "Créditos rápidos para pymes colombianas usando inteligencia artificial para evaluar riesgo.",
    website: "https://sempli.com.co",
    linkedinUrl: "https://www.linkedin.com/company/sempli",
    country: "CO",
    city: "Medellín",
    industry: "fintech",
    stage: "seed",
    foundedYear: 2016,
    employeeRange: "11-50",
    investors: ["Accion Venture Lab"],
    jobSources: [
      { type: "lever", token: "sempli" },
      { type: "careers_url", token: "https://sempli.com.co/careers" },
    ],
  },
  {
    slug: "foodology",
    name: "Foodology",
    description:
      "Cadena de restaurantes virtuales que opera cocinas fantasma optimizadas con datos y tecnología.",
    website: "https://foodology.com.co",
    linkedinUrl: "https://www.linkedin.com/company/foodology",
    country: "CO",
    city: "Bogotá",
    industry: "ecommerce",
    stage: "series-a",
    foundedYear: 2019,
    employeeRange: "51-200",
    investors: ["Tiger Global", "Andreessen Horowitz", "Kaszek"],
    jobSources: [
      { type: "greenhouse", token: "foodology" },
      { type: "lever", token: "foodology" },
      { type: "careers_url", token: "https://foodology.com.co/careers" },
    ],
  },
  {
    slug: "bunky",
    name: "Bunky",
    description:
      "Plataforma de coliving que gestiona habitaciones amobladas con todo incluido para jóvenes profesionales.",
    website: "https://bunky.co",
    linkedinUrl: "https://www.linkedin.com/company/bunky-co",
    country: "CO",
    city: "Bucaramanga",
    industry: "proptech",
    stage: "seed",
    foundedYear: 2020,
    employeeRange: "11-50",
    investors: ["Ángeles locales"],
    jobSources: [
      { type: "lever", token: "bunky" },
      { type: "careers_url", token: "https://bunky.co/careers" },
    ],
  },
  {
    slug: "siembra-viva",
    name: "Siembra Viva",
    description:
      "Marketplace que conecta agricultores con consumidores urbanos con entregas a domicilio.",
    website: "https://siembraviva.com",
    linkedinUrl: "https://www.linkedin.com/company/siembra-viva",
    country: "CO",
    city: "Medellín",
    industry: "agtech",
    stage: "seed",
    foundedYear: 2015,
    employeeRange: "11-50",
    investors: ["Ángeles locales"],
    jobSources: [
      { type: "lever", token: "siembra-viva" },
      { type: "careers_url", token: "https://siembraviva.com/careers" },
    ],
  },
  {
    slug: "acsendo",
    name: "Acsendo",
    description:
      "Software de gestión del desempeño y cultura organizacional para empresas latinoamericanas.",
    website: "https://acsendo.com",
    linkedinUrl: "https://www.linkedin.com/company/acsendo",
    country: "CO",
    city: "Bogotá",
    industry: "saas",
    stage: "bootstrapped",
    foundedYear: 2010,
    employeeRange: "11-50",
    investors: [],
    jobSources: [
      { type: "lever", token: "acsendo" },
      { type: "careers_url", token: "https://acsendo.com/careers" },
    ],
  },
  {
    slug: "muni",
    name: "Muni",
    description:
      "Fintech que ofrece cuentas digitales y crédito para los colombianos excluidos del sistema bancario.",
    website: "https://muni.co",
    linkedinUrl: "https://www.linkedin.com/company/muni-co",
    country: "CO",
    city: "Bogotá",
    industry: "fintech",
    stage: "seed",
    foundedYear: 2021,
    employeeRange: "11-50",
    investors: ["Y Combinator", "Quona Capital"],
    jobSources: [
      { type: "greenhouse", token: "muni" },
      { type: "lever", token: "muni" },
      { type: "careers_url", token: "https://muni.co/careers" },
    ],
  },
  {
    slug: "colegium",
    name: "Colegium",
    description:
      "Sistema de gestión académica y financiera para colegios privados de Colombia y LATAM.",
    website: "https://colegium.co",
    linkedinUrl: "https://www.linkedin.com/company/colegium",
    country: "CO",
    city: "Barranquilla",
    industry: "edtech",
    stage: "seed",
    foundedYear: 2018,
    employeeRange: "1-10",
    investors: ["Ángeles locales"],
    jobSources: [
      { type: "lever", token: "colegium" },
      { type: "careers_url", token: "https://colegium.co/careers" },
    ],
  },
];
