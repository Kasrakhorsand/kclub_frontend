/** Placeholder coach portrait (gold silhouette with initial) until real photos are added via Coach.photo. */
export function CoachPortrait({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label={`تصویر ${name}`}>
      <defs>
        <radialGradient id="cg" cx=".5" cy=".35" r=".9">
          <stop offset="0" stopColor="#2A2418" />
          <stop offset="1" stopColor="#0D0D0E" />
        </radialGradient>
      </defs>
      <rect width="400" height="300" fill="url(#cg)" />
      <g opacity=".14" stroke="#C9A45C" fill="none">
        <rect x="30" y="40" width="340" height="230" />
        <line x1="200" y1="40" x2="200" y2="270" />
      </g>
      <path d="M90 300C96 236 140 214 200 214C260 214 304 236 310 300Z" fill="#C9A45C" opacity=".85" />
      <ellipse cx="200" cy="140" rx="46" ry="56" fill="#C99A78" />
      <path d="M154 132C152 96 172 80 200 80C230 80 250 98 246 132C238 112 222 104 200 104C180 104 162 112 154 132Z" fill="#1A1410" />
      <text x="200" y="250" textAnchor="middle" fontSize="40" fill="#0D0D0E" opacity=".5">{name[0]}</text>
    </svg>
  );
}
