"use client";
/** Player › Wallet (/panel/wallet): balance card, top-up and transactions. */
import clsx from "clsx";
import { useState } from "react";
import { fa, faNum, toman } from "@/engine/format";
import { TXS } from "@/engine/mock";
import { useSession } from "@/engine/store";
import { SITE } from "@/config/site";
import { Button3D } from "@/ui/kit/Buttons";
import { toast } from "@/ui/kit/Toast";
import { TransactionTable } from "@/ui/panel/parts/TransactionTable";
import { PageHead } from "@/ui/panel/shell/PageHead";

const WALLET_TOPUPS = [200_000, 500_000, 1_000_000, 2_000_000];

export function WalletView() {
  const user = useSession((s) => s.user)!;
  const [amount, setAmount] = useState(500_000);
  return (
    <>
      <PageHead title="کیف پول" />
      <div className="grid cols2e">
        <div className="wcard">
          <div className="top"><span className="lbl">{SITE.walletName}</span><span className="chipg" /></div>
          <div><div className="lbl">موجودی</div><div className="bal">{faNum(user.wallet)} <small>تومان</small></div></div>
          <div className="own"><span>{user.first} {user.last}</span><span>{fa(user.phone)}</span></div>
        </div>
        <div className="card stack">
          <h3>شارژ کیف پول</h3>
          <div className="chips">
            {WALLET_TOPUPS.map((v) => (
              <button key={v} className={clsx("chip", amount === v && "on")} onClick={() => setAmount(v)}>{toman(v)}</button>
            ))}
          </div>
          <Button3D onClick={() => toast("انتقال به درگاه پرداخت…")}>پرداخت {toman(amount)}</Button3D>
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <TransactionTable rows={TXS.filter((t) => t.phone === user.phone)} />
      </div>
    </>
  );
}
