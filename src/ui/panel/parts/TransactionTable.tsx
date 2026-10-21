"use client";
/** Wallet transactions table (player wallet, front-desk cash, admin reports). */
import { fa, faNum, jDate } from "@/engine/format";
import type { Tx } from "@/engine/types";

const TX_TYPE: Record<Tx["type"], [label: string, pill: string]> = {
  charge: ["شارژ", "green"],
  pay: ["پرداخت", "red"],
  refund: ["بازگشت وجه", "info"],
};

/** Wallet transactions table; `showUser` adds a column with the account holder. */
export function TransactionTable({ rows, showUser }: { rows: Tx[]; showUser?: boolean }) {
  return (
    <div className="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th>تاریخ</th>
            {showUser && <th>کاربر</th>}
            <th>نوع</th>
            <th>شرح</th>
            <th>روش</th>
            <th>ثبت توسط</th>
            <th>مبلغ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((tx) => (
            <tr key={tx.id}>
              <td>{jDate(tx.date)}</td>
              {showUser && <td>{tx.userName ?? fa(tx.phone)}</td>}
              <td><span className={`pill ${TX_TYPE[tx.type][1]}`}>{TX_TYPE[tx.type][0]}</span></td>
              <td>{tx.desc}</td>
              <td>{tx.method}</td>
              <td>{tx.actor}</td>
              <td className={tx.amount > 0 ? "pos" : "neg"} style={{ direction: "ltr", textAlign: "right" }}>{faNum(tx.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
