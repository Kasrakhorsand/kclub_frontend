"use client";
/** Front desk › Wallet & transactions (/panel/wops); Admin › Transactions (/panel/alltx). */
import { TXS } from "@/engine/mock";
import { TransactionTable } from "@/ui/panel/parts/TransactionTable";
import { PageHead } from "@/ui/panel/shell/PageHead";

/** All transactions, used for the front-desk wallet page and the admin transactions page. */
export function AllTransactionsView({ title }: { title: string }) {
  return (
    <>
      <PageHead title={title} />
      <TransactionTable rows={TXS} showUser />
    </>
  );
}
