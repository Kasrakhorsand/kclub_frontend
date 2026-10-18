/* eslint-disable @next/next/no-img-element */
export function Brand({ sub }: { sub: string }) {
  return (
    <span className="brand">
      <img className="emb" src="/brand/k-emblem.webp" alt="" width={40} height={40} />
      <span>
        <img className="wm" src="/brand/k-wordmark.png" alt="K Club" height={17} />
        <small>{sub}</small>
      </span>
    </span>
  );
}
