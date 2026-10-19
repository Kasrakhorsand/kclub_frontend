"use client";
/** Front desk + Admin › Users (/panel/users). */
import { fa, toman } from "@/engine/format";
import { USERS } from "@/engine/mock";
import { useSession } from "@/engine/store";
import { PageHead } from "@/ui/panel/shell/PageHead";

export function UsersView() {
  const role = useSession((s) => s.role);
  return (
    <>
      <PageHead title={role === "admin" ? "کاربران و نقش‌ها" : "کاربران"} />
      <div className="tbl-wrap">
        <table>
          <thead><tr><th>نام</th><th>موبایل</th><th>نقش</th><th>کیف پول</th><th>VIP</th></tr></thead>
          <tbody>
            {Object.values(USERS).map((u) => (
              <tr key={u.phone}>
                <td>{u.first} {u.last}</td>
                <td>{fa(u.phone)}</td>
                <td>{u.roles.join("، ")}</td>
                <td>{toman(u.wallet)}</td>
                <td>{u.vip ? <span className="pill ball">VIP</span> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
