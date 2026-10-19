# K Club web

Next.js 15 (App Router) + TypeScript front end for K Club court booking (padel, beach tennis, beach volley). Persian, RTL, black/gold theme.

## Commands
- `npm run dev` — dev server on :3000 (preview config: `kclub-web` in `.claude/launch.json`)
- `npx tsc --noEmit` — type check (slow, ~1–2 min on this machine)
- `npm run lint` — ESLint

## Structure
- `src/engine/` is the shared, UI-free logic used by several club sites (K Club, Noor Club): types, venue rules, format, store, API, mock data and hooks (`useBookingFlow`, `useCart`, `useCheckout`, `useOpenSlots`, `useLogin`, `useSetPassword`, `usePanelSession`, panel stats). No components, CSS or brand copy; ESLint blocks imports of `@/ui`, `@/app`, `@/config/site`, `@/config/home` and CSS from it. See `src/engine/README.md`.
- `src/ui/` is K Club's own look: components, pages, 3D, and `styles/` (one CSS file per section: base, layout, three, home, booking, auth, coaches). The panel is split by role: `src/ui/panel/{shell,parts,common,player,secretary,admin}/`, one file per page with that folder's CSS beside it; `src/ui/panel/README.md` maps every menu item to its file. All CSS is imported in order from `src/app/globals.css`. Another site must not reuse it.
- `src/config/`: `venue.ts` and `content.ts` feed the engine; `site.ts`, `home.tsx`, `theme.css` are K Club UI config.
- `src/app/` routes stay thin and render `src/ui` pages.
- Put new business logic in an engine hook first, then render it in `src/ui`.

## Conventions
- UI copy is Persian; numbers shown to users go through `fa()` / `toman()` in `src/engine/format.ts`, dates through the Jalali helpers there.
- Styles: tokens in `src/config/theme.css`, K Club styles in `src/ui/styles/<section>.css` (shared bits in `base.css`); use tokens rather than new hard-coded colours.
- No external CDNs or Google Fonts: everything (fonts, three.js, media) is served from the project so the site works on Iranian internet.
- Data goes through `src/engine/api.ts` only; it uses mock data until `NEXT_PUBLIC_API_URL` is set. Don't import `engine/mock.ts` for new data reads.
- 3D icons: `<Icon3D name="..." />` from `src/ui/kit/Icon3D.tsx`.
- Test logins (mock): 09121234567 player, 09120000001 front desk, 09120000002 admin; any 5-digit code.

## Don't
- Don't edit `.env.local` or `package-lock.json` by hand (a hook blocks it).
- Don't commit `graphify-out/`.
