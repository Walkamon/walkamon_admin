import { Link, useLocation } from "react-router-dom";
import "./css/pvpAdmin.css";

export function PvpAdminNav() {
  const loc = useLocation();
  const base = "/pvp";
  const items = [
    { to: `${base}/reward-rules`, label: "Luật phần thưởng" },
    { to: `${base}/item-effects`, label: "Hiệu ứng vật phẩm" },
    { to: `${base}/rank-tiers`, label: "Bậc xếp hạng" },
    { to: `${base}/spirit-rules`, label: "Luật Tinh Linh" },
  ];

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {items.map((it) => (
        <Link
          key={it.to}
          to={it.to}
          className={`inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200 ${
            loc.pathname === it.to
              ? "border-primary bg-primary text-white hover:bg-primary/90"
              : "border-border bg-card text-foreground hover:bg-muted"
          }`}>
          {it.label}
        </Link>
      ))}
    </div>
  );
}

export default PvpAdminNav;
