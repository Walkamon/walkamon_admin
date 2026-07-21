import { Link, useLocation } from "react-router-dom";

export function PvpAdminNav() {
  const loc = useLocation();
  const base = "/pvp";
  const items = [
    { to: `${base}/reward-rules`, label: "Reward Rules" },
    { to: `${base}/item-effects`, label: "Item Effects" },
    { to: `${base}/rank-tiers`, label: "Rank Tiers" },
    { to: `${base}/spirit-rules`, label: "Spirit Rules" },
  ];

  return (
    <div className="mb-4 flex gap-2">
      {items.map((it) => (
        <Link
          key={it.to}
          to={it.to}
          className={`px-3 py-2 border rounded ${loc.pathname === it.to ? 'bg-primary text-white' : 'bg-card text-foreground'}`}>
          {it.label}
        </Link>
      ))}
    </div>
  );
}

export default PvpAdminNav;
