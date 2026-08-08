# Col/Labs (latamhub)

Directorio del ecosistema startup latinoamericano, empezando por Colombia.

## Stack

- **Next.js 16** (App Router, Turbopack, async request APIs)
- **TypeScript** (strict)
- **TailwindCSS v4** (OKLCH design tokens, custom utilities)
- **shadcn/ui** (on-demand, `new-york` + `slate`)
- **Supabase** (Postgres + RLS, `@supabase/ssr`)
- **Vercel** (deploy target)
- **Bun** (package manager)

## Local development

```bash
bun install
cp .env.example .env.local   # fill in NEXT_PUBLIC_SUPABASE_URL and ANON key
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command          | Purpose                                  |
| ---------------- | ---------------------------------------- |
| `bun dev`        | Dev server (Turbopack)                   |
| `bun run build`  | Production build (Turbopack)             |
| `bun run start`  | Run the production build                 |
| `bun run lint`   | ESLint (flat config, `eslint-config-next`) |
| `bun run typecheck` | `tsc --noEmit`                       |

## Layout

```
src/
├── app/              # App Router pages, layout, globals.css
├── components/       # React components (shadcn/ui will live in src/components/ui)
└── lib/              # Supabase clients, types, constants

supabase/
├── migrations/       # Numbered SQL migrations (00001..00005)
└── seed.sql          # Re-runnable seed data
```

## Source of truth

The architecture, data model, and design system are documented in `../docs/`:

- `../docs/ARCHITECTURE.md`
- `../docs/DATA_MODEL.md`
- `../docs/DESIGN_SYSTEM.md`
