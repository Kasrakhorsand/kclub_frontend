# K Club web

Next.js 15 (App Router) + TypeScript front end for K Club court booking (padel, beach tennis, beach volley). Persian, RTL, black/gold theme.

## Commands
- `npm run dev` — dev server on :3000 (preview config: `kclub-web` in `.claude/launch.json`)
- `npx tsc --noEmit` — type check (slow, ~1–2 min on this machine)
- `npm run lint` — ESLint

## Structure
- `src/modules/` is reusable across clubs: no club names, colours, sports or prices in module code. See `src/modules/README.md`.
- `src/config/` holds everything club-specific: `site.ts` (brand, nav, footer), `venue.ts` (sports, courts, prices, hours, rules), `home.tsx` (home copy), `content.ts` (photos, reviews, contact), `theme.css` (colour tokens).
- `src/app/` routes stay thin and render module components.
- Modules read venue data through `@/modules/core/venue`, never `@/config/venue` directly.

## Conventions
- UI copy is Persian; numbers shown to users go through `fa()` / `toman()` in `src/modules/core/format.ts`, dates through the Jalali helpers there.
- Styles: tokens in `src/config/theme.css`, shared styles in `src/modules/styles.css`; use tokens rather than new hard-coded colours.
- No external CDNs or Google Fonts: everything (fonts, three.js, media) is served from the project so the site works on Iranian internet.
- Data goes through `src/modules/core/api.ts` only; it uses mock data until `NEXT_PUBLIC_API_URL` is set. Don't import `core/mock.ts` for new data reads.
- 3D icons: `<Icon3D name="..." />` from `src/modules/ui/Icon3D.tsx`.
- Test logins (mock): 09121234567 player, 09120000001 front desk, 09120000002 admin; any 5-digit code.

## Don't
- Don't edit `.env.local` or `package-lock.json` by hand (a hook blocks it).
- Don't commit `graphify-out/`.
