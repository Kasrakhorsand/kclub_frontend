# K Club web

Next.js 15 (App Router) + TypeScript front end for K Club court booking (padel, beach tennis, beach volley). Persian, RTL, black/gold theme.

## Commands
- `npm run dev` — dev server on :3000 (preview config: `kclub-web` in `.claude/launch.json`)
- `npx tsc --noEmit` — type check (slow, ~1–2 min on this machine)
- `npm run lint` — ESLint

## Conventions
- UI copy is Persian; numbers shown to users go through `fa()` / `toman()` in `src/lib/format.ts`, dates through the Jalali helpers there.
- Styles live in `src/app/kclub.css` (design tokens on `:root` and `[data-theme="dark"]`); prefer those classes and tokens over new Tailwind utility soup.
- No external CDNs or Google Fonts: everything (fonts, three.js, media) is served from the project so the site works on Iranian internet.
- Data goes through `src/lib/api.ts` only; it uses mock data until `NEXT_PUBLIC_API_URL` is set. Don't import `lib/mock.ts` for new data reads.
- 3D icons: `<Icon3D name="..." />` from `src/components/ui/Icon3D.tsx` (Steel Edition set in `icons3d.ts`).
- Test logins (mock): 09121234567 player, 09120000001 front desk, 09120000002 admin; any 5-digit code.

## Don't
- Don't edit `.env.local` or `package-lock.json` by hand (a hook blocks it).
- Don't commit `graphify-out/`.
